"""
Employee Lookup Service – query/service layer for the AI Chatbot.

Provides structured DB queries so the chatbot can answer questions about
employees without relying on vector search alone.

Usage from chat chain / views:
    from apps.chat.employee_lookup import EmployeeLookupService
    svc = EmployeeLookupService()
    results = svc.search_employee(query="Phong Le")
"""
import logging
from typing import Dict, List, Any, Optional

from django.db.models import Q, Count
from apps.employees.models import EmployeeProfile
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)

# Fields that must NEVER be returned to non-HR callers
SENSITIVE_FIELDS = {
    'bank_account_number', 'bank_branch', 'bank_name',
    'date_of_birth', 'emergency_contact_phone',
}


class EmployeeLookupService:
    """
    Structured employee queries for AI Chatbot / function-calling.
    """

    # ────────────── Search ──────────────

    def search_employee(
        self, query: str, *, limit: int = 10
    ) -> Dict[str, Any]:
        """
        Fuzzy search by name, employee_id, email, or phone.
        Returns a list of matching employees (public-safe fields only).
        If >1 match, caller should ask user to disambiguate.
        """
        query = query.strip()
        if not query:
            return {"success": False, "message": "Vui lòng cung cấp tên, mã NV hoặc email để tìm kiếm."}

        # Build Q filter: match individual words against first/last name
        base_q = (
            Q(user__first_name__icontains=query)
            | Q(user__last_name__icontains=query)
            | Q(user__email__icontains=query)
            | Q(employee_id__icontains=query)
            | Q(user__phone_number__icontains=query)
            | Q(user__username__icontains=query)
        )
        # If query has spaces, also try each word against first/last name
        words = query.split()
        if len(words) >= 2:
            multi_q = Q()
            for w in words:
                multi_q &= (Q(user__first_name__icontains=w) | Q(user__last_name__icontains=w))
            base_q = base_q | multi_q

        profiles = EmployeeProfile.objects.select_related('user', 'manager__user').filter(base_q)[:limit]

        if not profiles.exists():
            return {
                "success": True,
                "count": 0,
                "message": f"Không tìm thấy nhân viên nào khớp với '{query}'. "
                           f"Hãy thử tìm bằng mã nhân viên (VD: LMN-0001) hoặc email.",
                "employees": [],
            }

        employees = [self._profile_to_public_dict(p) for p in profiles]
        msg = None
        if len(employees) > 1:
            msg = (
                f"Tìm thấy {len(employees)} nhân viên khớp với '{query}'. "
                "Bạn muốn xem thông tin của ai?"
            )
        return {
            "success": True,
            "count": len(employees),
            "message": msg,
            "employees": employees,
        }

    # ────────────── By ID / exact ──────────────

    def get_employee_by_id(self, employee_id: str) -> Dict[str, Any]:
        """Lookup by exact employee_id (e.g. LMN-0001)."""
        try:
            p = EmployeeProfile.objects.select_related('user', 'manager__user').get(
                employee_id__iexact=employee_id.strip()
            )
            return {"success": True, "employee": self._profile_to_public_dict(p)}
        except EmployeeProfile.DoesNotExist:
            return {"success": False, "message": f"Không tìm thấy nhân viên có mã '{employee_id}'."}

    def get_employee_by_email(self, email: str) -> Dict[str, Any]:
        """Lookup by exact email."""
        try:
            p = EmployeeProfile.objects.select_related('user', 'manager__user').get(
                user__email__iexact=email.strip()
            )
            return {"success": True, "employee": self._profile_to_public_dict(p)}
        except EmployeeProfile.DoesNotExist:
            return {"success": False, "message": f"Không tìm thấy nhân viên có email '{email}'."}

    # ────────────── Department queries ──────────────

    def list_by_department(self, department: str) -> Dict[str, Any]:
        """List all employees in a department."""
        dept = department.strip().lower()
        valid = dict(EmployeeProfile.DEPARTMENT_CHOICES)
        if dept not in valid:
            return {
                "success": False,
                "message": f"Phòng ban '{department}' không hợp lệ. Các phòng ban: {', '.join(valid.keys())}.",
            }
        profiles = (
            EmployeeProfile.objects
            .select_related('user', 'manager__user')
            .filter(department=dept)
            .order_by('designation', 'user__first_name')
        )
        return {
            "success": True,
            "department": valid[dept],
            "count": profiles.count(),
            "employees": [self._profile_to_public_dict(p) for p in profiles],
        }

    def department_summary(self) -> Dict[str, Any]:
        """Return employee count per department."""
        data = (
            EmployeeProfile.objects
            .values('department')
            .annotate(count=Count('id'))
            .order_by('department')
        )
        dept_names = dict(EmployeeProfile.DEPARTMENT_CHOICES)
        summary = [
            {"department": dept_names.get(d['department'], d['department']),
             "code": d['department'],
             "count": d['count']}
            for d in data
        ]
        total = sum(d['count'] for d in summary)
        return {"success": True, "total_employees": total, "departments": summary}

    # ────────────── Manager / Org ──────────────

    def get_manager_of(self, query: str) -> Dict[str, Any]:
        """Who is the manager of <query>?"""
        result = self.search_employee(query, limit=5)
        if not result["success"] or result["count"] == 0:
            return result
        if result["count"] > 1:
            return {
                "success": True,
                "message": result["message"],
                "employees": result["employees"],  # ask user to choose
            }
        emp = result["employees"][0]
        if emp.get("manager"):
            return {
                "success": True,
                "employee": emp["full_name"],
                "manager": emp["manager"],
            }
        return {
            "success": True,
            "employee": emp["full_name"],
            "message": f"{emp['full_name']} không có quản lý trực tiếp (có thể là cấp cao nhất).",
        }

    def get_direct_reports(self, query: str) -> Dict[str, Any]:
        """List direct reports of <query>."""
        result = self.search_employee(query, limit=5)
        if not result["success"] or result["count"] == 0:
            return result
        if result["count"] > 1:
            return {"success": True, "message": result["message"], "employees": result["employees"]}

        emp_data = result["employees"][0]
        try:
            profile = EmployeeProfile.objects.get(employee_id=emp_data["employee_id"])
        except EmployeeProfile.DoesNotExist:
            return {"success": False, "message": "Không tìm thấy profile."}

        reports = profile.direct_reports.select_related('user').all()
        return {
            "success": True,
            "manager": emp_data["full_name"],
            "count": reports.count(),
            "direct_reports": [self._profile_to_public_dict(r) for r in reports],
        }

    # ────────────── Sensitive-field policy ──────────────

    def get_sensitive_info(self, query: str, *, requester_role: str) -> Dict[str, Any]:
        """
        Return sensitive fields ONLY if requester is admin/hr.
        Otherwise refuse with a policy message.
        """
        if requester_role not in ('admin', 'hr'):
            return {
                "success": False,
                "message": (
                    "Thông tin nhạy cảm (lương, CCCD, tài khoản ngân hàng…) "
                    "chỉ được phép truy cập bởi HR hoặc Admin. "
                    "Vui lòng liên hệ phòng HR nếu cần."
                ),
            }
        result = self.search_employee(query, limit=3)
        if not result["success"] or result["count"] == 0:
            return result
        if result["count"] > 1:
            return {"success": True, "message": result["message"], "employees": result["employees"]}

        emp_data = result["employees"][0]
        try:
            p = EmployeeProfile.objects.select_related('user').get(employee_id=emp_data["employee_id"])
        except EmployeeProfile.DoesNotExist:
            return {"success": False, "message": "Không tìm thấy."}

        emp_data.update({
            "bank_name": p.bank_name,
            "bank_account_number": p.bank_account_number[:4] + "****" + p.bank_account_number[-4:] if len(p.bank_account_number) > 8 else "****",
            "bank_branch": p.bank_branch,
            "date_of_birth": str(p.date_of_birth) if p.date_of_birth else None,
            "emergency_contact_phone": p.emergency_contact_phone,
        })
        return {"success": True, "employee": emp_data}

    # ────────────── Internal helpers ──────────────

    @staticmethod
    def _profile_to_public_dict(profile: EmployeeProfile) -> Dict[str, Any]:
        """Convert profile to a dict with public-safe fields only."""
        user = profile.user
        dept_display = dict(EmployeeProfile.DEPARTMENT_CHOICES).get(
            profile.department, profile.department
        )
        mgr = None
        if profile.manager:
            mgr = {
                "full_name": profile.manager.user.get_full_name(),
                "employee_id": profile.manager.employee_id,
                "designation": profile.manager.designation,
            }
        return {
            "employee_id": profile.employee_id,
            "full_name": user.get_full_name(),
            "email": user.email,
            "department": dept_display,
            "department_code": profile.department,
            "designation": profile.designation,
            "date_of_joining": str(profile.date_of_joining),
            "city": profile.city,
            "country": profile.country,
            "manager": mgr,
            "bio": profile.bio,
            "is_active": user.is_active,
        }


# ═══════════════════════════════════════════════════════════
# Function/Tool schema for LLM function-calling
# (pass this to OpenAI tools= parameter)
# ═══════════════════════════════════════════════════════════
EMPLOYEE_LOOKUP_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_employee",
            "description": "Tìm nhân viên theo tên, mã nhân viên (VD: LMN-0001), email, hoặc số điện thoại. Trả về danh sách khớp.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Tên, mã NV, email hoặc SĐT"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_department_employees",
            "description": "Liệt kê nhân viên theo phòng ban. Các phòng ban: hr, it, sales, marketing, operations, finance.",
            "parameters": {
                "type": "object",
                "properties": {
                    "department": {"type": "string", "description": "Mã phòng ban (hr/it/sales/marketing/operations/finance)"},
                },
                "required": ["department"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_manager_of",
            "description": "Tìm quản lý trực tiếp của một nhân viên.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Tên hoặc mã NV"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_direct_reports",
            "description": "Liệt kê nhân viên trực tiếp của một quản lý.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Tên hoặc mã quản lý"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "department_summary",
            "description": "Thống kê số lượng nhân viên theo từng phòng ban.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]
