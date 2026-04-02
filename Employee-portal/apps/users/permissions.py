"""
Custom permission classes for role-based access control with department scope.

Roles hierarchy:
  admin > hr > dept_manager > employee

Scopes:
  ALL        - no filtering (admin, hr)
  DEPARTMENT - filter by user's department
  SELF       - filter by user's own records
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrHR(BasePermission):
    """Admin or HR users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'hr')


class IsDeptManagerOrAbove(BasePermission):
    """Admin, HR, or department manager"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ('admin', 'hr'):
            return True
        return request.user.is_department_manager()


class IsSameDepartment(BasePermission):
    """
    Object-level permission: user must be in the same department as the target object.
    The object must have either:
      - a 'department' field directly, or
      - an 'employee' FK pointing to a user with a profile.department
    Admin and HR bypass this check.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'hr'):
            return True
        user_dept = request.user.get_department()
        if user_dept is None:
            return False
        # Try direct department field
        if hasattr(obj, 'department'):
            return obj.department in (user_dept, 'company', 'all')
        # Try via employee FK -> profile
        if hasattr(obj, 'employee') and hasattr(obj.employee, 'profile'):
            return obj.employee.profile.department == user_dept
        # Try via user FK -> profile
        if hasattr(obj, 'user') and hasattr(obj.user, 'profile'):
            return obj.user.profile.department == user_dept
        return False


def get_department_filter(user):
    """
    Return a dict suitable for queryset.filter() to scope by department.
    Returns None if user has ALL scope (admin/hr).
    """
    if user.role in ('admin', 'hr'):
        return None  # No filter needed
    return user.get_department()
