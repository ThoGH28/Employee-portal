#!/usr/bin/env python
"""
Comprehensive seed script to populate Employee Portal with realistic data.
Creates users, profiles, leave requests, announcements, payslips, documents,
chat sessions, and chat messages.
"""
import os
import sys
import random
from datetime import date, timedelta
from decimal import Decimal

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.employees.models import EmployeeProfile, LeaveRequest, HRAnnouncement, Payslip
from apps.documents.models import Document, DocumentChunk, DocumentMetadata
from apps.chat.models import ChatSession, ChatMessage

User = get_user_model()

# ──────────────────────────────────────────────
# 1. USERS
# ──────────────────────────────────────────────
USERS_DATA = [
    # Admin / HR
    {"username": "admin", "email": "admin@luvina.net", "first_name": "Admin", "last_name": "System", "role": "admin", "password": "Admin@123456"},
    {"username": "hr_manager", "email": "hr@luvina.net", "first_name": "Nguyen", "last_name": "Thi Lan", "role": "hr", "password": "Hr@123456"},
    {"username": "hr_assistant", "email": "hr.assistant@luvina.net", "first_name": "Tran", "last_name": "Van Minh", "role": "hr", "password": "Hr@123456"},
    # Employees
    {"username": "john_doe", "email": "john.doe@luvina.net", "first_name": "John", "last_name": "Doe", "role": "employee", "password": "Employee@123"},
    {"username": "jane_smith", "email": "jane.smith@luvina.net", "first_name": "Jane", "last_name": "Smith", "role": "employee", "password": "Employee@123"},
    {"username": "david_nguyen", "email": "david.nguyen@luvina.net", "first_name": "David", "last_name": "Nguyen", "role": "employee", "password": "Employee@123"},
    {"username": "maria_garcia", "email": "maria.garcia@luvina.net", "first_name": "Maria", "last_name": "Garcia", "role": "employee", "password": "Employee@123"},
    {"username": "alex_tran", "email": "alex.tran@luvina.net", "first_name": "Alex", "last_name": "Tran", "role": "employee", "password": "Employee@123"},
    {"username": "sarah_le", "email": "sarah.le@luvina.net", "first_name": "Sarah", "last_name": "Le", "role": "employee", "password": "Employee@123"},
    {"username": "michael_pham", "email": "michael.pham@luvina.net", "first_name": "Michael", "last_name": "Pham", "role": "employee", "password": "Employee@123"},
    {"username": "emily_vo", "email": "emily.vo@luvina.net", "first_name": "Emily", "last_name": "Vo", "role": "employee", "password": "Employee@123"},
    {"username": "robert_hoang", "email": "robert.hoang@luvina.net", "first_name": "Robert", "last_name": "Hoang", "role": "employee", "password": "Employee@123"},
    {"username": "lisa_dang", "email": "lisa.dang@luvina.net", "first_name": "Lisa", "last_name": "Dang", "role": "employee", "password": "Employee@123"},
    {"username": "kevin_bui", "email": "kevin.bui@luvina.net", "first_name": "Kevin", "last_name": "Bui", "role": "employee", "password": "Employee@123"},
    {"username": "anna_duong", "email": "anna.duong@luvina.net", "first_name": "Anna", "last_name": "Duong", "role": "employee", "password": "Employee@123"},
    {"username": "chris_lam", "email": "chris.lam@luvina.net", "first_name": "Chris", "last_name": "Lam", "role": "employee", "password": "Employee@123"},
    {"username": "diana_ngo", "email": "diana.ngo@luvina.net", "first_name": "Diana", "last_name": "Ngo", "role": "employee", "password": "Employee@123"},
    {"username": "peter_truong", "email": "peter.truong@luvina.net", "first_name": "Peter", "last_name": "Truong", "role": "employee", "password": "Employee@123"},
    {"username": "nancy_ly", "email": "nancy.ly@luvina.net", "first_name": "Nancy", "last_name": "Ly", "role": "employee", "password": "Employee@123"},
    {"username": "james_cao", "email": "james.cao@luvina.net", "first_name": "James", "last_name": "Cao", "role": "employee", "password": "Employee@123"},
    {"username": "emma_huynh", "email": "emma.huynh@luvina.net", "first_name": "Emma", "last_name": "Huynh", "role": "employee", "password": "Employee@123"},
]

# ──────────────────────────────────────────────
# 2. EMPLOYEE PROFILES
# ──────────────────────────────────────────────
DEPARTMENTS = ['hr', 'it', 'sales', 'marketing', 'operations', 'finance']
DESIGNATIONS = {
    'hr': ['HR Manager', 'HR Specialist', 'Recruitment Lead', 'Payroll Officer'],
    'it': ['Software Engineer', 'DevOps Engineer', 'QA Engineer', 'Tech Lead', 'Data Analyst', 'System Administrator'],
    'sales': ['Sales Manager', 'Account Executive', 'Business Development Rep', 'Sales Engineer'],
    'marketing': ['Marketing Manager', 'Content Strategist', 'SEO Specialist', 'Brand Designer'],
    'operations': ['Operations Manager', 'Project Coordinator', 'Supply Chain Analyst', 'Logistics Lead'],
    'finance': ['Finance Manager', 'Accountant', 'Financial Analyst', 'Auditor'],
}
CITIES = [
    ('Ho Chi Minh City', 'Ho Chi Minh', 'Vietnam'),
    ('Hanoi', 'Hanoi', 'Vietnam'),
    ('Da Nang', 'Da Nang', 'Vietnam'),
    ('New York', 'NY', 'USA'),
    ('San Francisco', 'CA', 'USA'),
    ('Singapore', 'Central', 'Singapore'),
]

# ──────────────────────────────────────────────
# 3. ANNOUNCEMENTS
# ──────────────────────────────────────────────
ANNOUNCEMENTS_DATA = [
    {
        "title": "Chào Mừng Đến Với Employee Portal 2.0",
        "content": """Kính gửi toàn thể nhân viên,

Chúng tôi vui mừng thông báo ra mắt Employee Portal phiên bản 2.0 với nhiều tính năng mới:

1. **AI Chatbot** - Hỗ trợ trả lời câu hỏi về chính sách công ty 24/7
2. **Tìm kiếm thông minh** - Tìm kiếm tài liệu bằng AI
3. **Quản lý nghỉ phép** - Gửi và theo dõi đơn nghỉ phép trực tuyến
4. **Phiếu lương** - Xem phiếu lương hàng tháng

Vui lòng đăng nhập và khám phá các tính năng mới. Nếu gặp bất kỳ vấn đề nào, hãy liên hệ bộ phận IT.

Trân trọng,
Ban Giám Đốc""",
        "status": "published",
    },
    {
        "title": "Lịch Nghỉ Lễ Năm 2026",
        "content": """Phòng Nhân sự xin thông báo lịch nghỉ lễ năm 2026:

- 01/01/2026: Tết Dương lịch
- 25/01 - 01/02/2026: Tết Nguyên Đán (Bính Ngọ)
- 06/04/2026: Giỗ Tổ Hùng Vương
- 30/04/2026: Ngày Giải phóng miền Nam
- 01/05/2026: Ngày Quốc tế Lao động
- 02/09/2026: Ngày Quốc khánh

Lưu ý:
- Nhân viên cần lập kế hoạch nghỉ phép sớm
- Các bộ phận phải đảm bảo có người trực trong dịp lễ
- Đơn nghỉ phép phải được gửi trước ít nhất 2 tuần

Phòng Nhân sự""",
        "status": "published",
    },
    {
        "title": "Chương Trình Sức Khỏe & Phúc Lợi Mới",
        "content": """Kính gửi toàn thể nhân viên,

Công ty vui mừng thông báo chương trình phúc lợi sức khỏe mới, có hiệu lực từ ngày 01/04/2026:

**Bảo hiểm sức khỏe nâng cao:**
- Khám sức khỏe tổng quát hàng năm miễn phí
- Bảo hiểm nha khoa lên đến 10 triệu VNĐ/năm
- Bảo hiểm mắt lên đến 5 triệu VNĐ/năm
- Bảo hiểm sức khỏe tâm thần & tư vấn tâm lý

**Chương trình Wellness:**
- Hỗ trợ phí gym/yoga 500.000 VNĐ/tháng
- Ngày nghỉ sức khỏe tinh thần (Mental Health Day) - 2 ngày/năm
- Workshop sức khỏe hàng quý

Để đăng ký, vui lòng truy cập Employee Portal > Benefits hoặc liên hệ HR.

Trân trọng,
Phòng Nhân sự""",
        "status": "published",
    },
    {
        "title": "Chính Sách Làm Việc Từ Xa (Remote Work Policy)",
        "content": """Thông báo cập nhật chính sách làm việc từ xa:

**Chính sách Hybrid Work 2026:**

1. Nhân viên được phép làm việc từ xa tối đa 3 ngày/tuần
2. Các ngày bắt buộc có mặt tại văn phòng: Thứ Ba và Thứ Năm
3. Yêu cầu khi làm việc từ xa:
   - Kết nối Internet ổn định (tối thiểu 20Mbps)
   - Phản hồi tin nhắn trong vòng 30 phút trong giờ làm việc
   - Camera bật trong các cuộc họp video
   - Báo cáo công việc hàng ngày qua hệ thống

4. Đăng ký lịch WFH trước 17:00 ngày Thứ Sáu hàng tuần
5. Manager có quyền từ chối nếu công việc yêu cầu có mặt

Chính sách có hiệu lực từ 15/04/2026. Chi tiết xem tại Employee Portal > Documents.

Ban Điều hành""",
        "status": "published",
    },
    {
        "title": "Team Building Q2/2026 - Phan Thiết",
        "content": """🎉 Thông báo Team Building Q2/2026!

**Thời gian:** 25-27/04/2026 (Thứ Sáu - Chủ Nhật)
**Địa điểm:** Mũi Né, Phan Thiết
**Chủ đề:** "Together We Grow"

**Lịch trình:**
- Ngày 1: Di chuyển, check-in, Welcome Dinner
- Ngày 2: Team Games, Beach Olympics, Gala Night
- Ngày 3: Free time, check-out, di chuyển về

**Chi phí:** Công ty tài trợ 100%
**Đăng ký:** Trước 10/04/2026 qua form trên Portal

Lưu ý: Nhân viên không tham gia cần báo trước và có lý do hợp lệ.

HR Department""",
        "status": "published",
    },
    {
        "title": "Đánh Giá Hiệu Suất Giữa Năm 2026",
        "content": """Kính gửi các Quản lý và Nhân viên,

Phòng Nhân sự xin thông báo lịch đánh giá hiệu suất giữa năm 2026:

**Timeline:**
- 01/04 - 15/04: Nhân viên tự đánh giá (Self-Assessment)  
- 16/04 - 30/04: Quản lý đánh giá (Manager Review)
- 01/05 - 10/05: Phiên họp 1-on-1 (Calibration)
- 15/05: Kết quả đánh giá được công bố

**Tiêu chí đánh giá:**
1. Hiệu suất công việc (40%)
2. Kỹ năng chuyên môn (25%)
3. Teamwork & Communication (20%)
4. Initiative & Innovation (15%)

**Thang đánh giá:** Outstanding / Exceeds / Meets / Below / Needs Improvement

Các form đánh giá đã có sẵn trên Portal. Vui lòng hoàn thành đúng hạn.

Phòng Nhân sự""",
        "status": "published",
    },
    {
        "title": "Thông Báo Nâng Cấp Hệ Thống IT",
        "content": """Phòng IT xin thông báo lịch bảo trì và nâng cấp hệ thống:

**Thời gian:** 05/04/2026, 22:00 - 06/04/2026, 06:00 (Chủ Nhật đêm)

**Hệ thống bị ảnh hưởng:**
- Email server (tạm ngưng 2 tiếng)
- VPN access (tạm ngưng 1 tiếng)
- Employee Portal (tạm ngưng 30 phút)
- File sharing system (tạm ngưng 1 tiếng)

**Cải tiến sau nâng cấp:**
- Tốc độ xử lý tăng 40%
- Bảo mật nâng cao (2FA bắt buộc)
- Tích hợp AI chatbot mới
- Storage mở rộng lên 500GB/user

Vui lòng lưu lại công việc trước 22:00 ngày 05/04. Liên hệ IT Support nếu gặp sự cố sau nâng cấp.

IT Department""",
        "status": "published",
    },
    {
        "title": "Chương Trình Đào Tạo Nội Bộ Q2/2026",
        "content": """Phòng HR & L&D xin giới thiệu chương trình đào tạo Q2/2026:

**1. Technical Skills:**
- Python Advanced (12/04, 19/04) - Instructor: David Nguyen
- Cloud Architecture AWS (26/04) - External Trainer
- Data Analytics with Power BI (03/05, 10/05) - Instructor: Lisa Dang

**2. Soft Skills:**
- Leadership for New Managers (05/04) - External Coach
- Effective Communication (12/04) - HR Team
- Time Management & Productivity (19/04) - External Trainer

**3. Compliance:**
- Information Security Awareness (mandatory, online) - Deadline: 30/04
- Anti-Harassment Training (mandatory, online) - Deadline: 15/05

Đăng ký qua Employee Portal > Training. Mỗi nhân viên phải hoàn thành ít nhất 1 khóa technical + 2 khóa compliance trong quý.

L&D Department""",
        "status": "published",
    },
    {
        "title": "Thông Báo Tuyển Dụng Nội Bộ",
        "content": """Các vị trí đang tuyển dụng nội bộ:

1. **Senior Software Engineer** - IT Department
   - Yêu cầu: 5+ năm kinh nghiệm, Python/Django, React
   - Mức lương: Thỏa thuận (cạnh tranh)

2. **Marketing Lead** - Marketing Department
   - Yêu cầu: 4+ năm kinh nghiệm Digital Marketing
   - Mức lương: 25-35 triệu VNĐ

3. **Financial Analyst** - Finance Department
   - Yêu cầu: CFA Level 2+, 3+ năm kinh nghiệm
   - Mức lương: 20-30 triệu VNĐ

**Quyền lợi khi chuyển vị trí nội bộ:**
- Ưu tiên xét tuyển
- Không cần thời gian thử việc
- Hỗ trợ đào tạo chuyển đổi

Gửi CV qua email hr@luvina.net trước 20/04/2026.

Phòng Tuyển dụng""",
        "status": "published",
    },
    {
        "title": "Quy Định Bảo Mật Thông Tin Cập Nhật",
        "content": """Kính gửi toàn thể nhân viên,

Nhằm tăng cường bảo mật thông tin, các quy định sau được cập nhật và có hiệu lực từ 01/04/2026:

**1. Mật khẩu:**
- Tối thiểu 12 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
- Thay đổi mỗi 60 ngày (trước đây 90 ngày)
- Không được trùng 5 mật khẩu gần nhất

**2. Xác thực 2 yếu tố (2FA):**
- Bắt buộc cho tất cả hệ thống nội bộ
- Sử dụng app Authenticator (không dùng SMS)

**3. Thiết bị cá nhân:**
- BYOD phải cài đặt MDM (Mobile Device Management)
- Không lưu dữ liệu công ty trên thiết bị cá nhân không được phê duyệt

**4. Email:**
- Không forward email công ty ra email cá nhân
- Báo cáo ngay email phishing qua nút "Report Phishing"

Vi phạm sẽ bị xử lý theo quy chế lao động. Hoàn thành khóa Security Awareness trên Portal trước 30/04.

IT Security Team""",
        "status": "published",
    },
]

# ──────────────────────────────────────────────
# 4. DOCUMENTS (metadata only, no real files)
# ──────────────────────────────────────────────
DOCUMENTS_DATA = [
    {"title": "Employee Handbook 2026", "description": "Comprehensive guide for all employees covering company policies, benefits, and procedures.", "document_type": "handbook", "file_type": "pdf", "file_size": 4_200_000},
    {"title": "Remote Work Policy", "description": "Guidelines and requirements for hybrid and remote work arrangements.", "document_type": "policy", "file_type": "pdf", "file_size": 1_500_000},
    {"title": "Information Security Policy", "description": "Company-wide information security guidelines and compliance requirements.", "document_type": "policy", "file_type": "pdf", "file_size": 2_800_000},
    {"title": "Code of Conduct", "description": "Standards of behavior and ethical guidelines for all employees.", "document_type": "policy", "file_type": "pdf", "file_size": 1_200_000},
    {"title": "Leave Policy & Guidelines", "description": "Detailed leave types, entitlements, and application procedures.", "document_type": "policy", "file_type": "pdf", "file_size": 980_000},
    {"title": "Benefits & Compensation Guide", "description": "Overview of employee benefits including health insurance, retirement, and perks.", "document_type": "handbook", "file_type": "pdf", "file_size": 3_100_000},
    {"title": "Onboarding Checklist", "description": "Step-by-step onboarding process for new employees.", "document_type": "form", "file_type": "docx", "file_size": 450_000},
    {"title": "Performance Review Template Q2 2026", "description": "Template for mid-year performance evaluation.", "document_type": "form", "file_type": "docx", "file_size": 380_000},
    {"title": "Travel & Expense Reimbursement Policy", "description": "Procedures for business travel approval and expense claims.", "document_type": "policy", "file_type": "pdf", "file_size": 1_100_000},
    {"title": "Anti-Harassment Policy", "description": "Company policy on preventing workplace harassment and discrimination.", "document_type": "policy", "file_type": "pdf", "file_size": 1_800_000},
    {"title": "IT Equipment Usage Policy", "description": "Guidelines for using company-provided IT equipment and software.", "document_type": "policy", "file_type": "pdf", "file_size": 750_000},
    {"title": "Training & Development Catalog Q2 2026", "description": "Available training programs and enrollment procedures.", "document_type": "announcement", "file_type": "pdf", "file_size": 2_500_000},
    {"title": "Emergency Response Plan", "description": "Procedures for fire, earthquake, and other emergency situations.", "document_type": "handbook", "file_type": "pdf", "file_size": 1_600_000},
    {"title": "Data Protection & GDPR Compliance", "description": "Data handling procedures compliant with international privacy regulations.", "document_type": "policy", "file_type": "pdf", "file_size": 2_200_000},
    {"title": "New Hire Tax Form W-4", "description": "Tax withholding form for new employees.", "document_type": "form", "file_type": "pdf", "file_size": 320_000},
]

# ──────────────────────────────────────────────
# 5. LEAVE REQUESTS
# ──────────────────────────────────────────────
LEAVE_REASONS = [
    "Về quê thăm gia đình",
    "Khám sức khỏe định kỳ",
    "Nghỉ phép năm",
    "Đưa con đi tiêm chủng",
    "Xử lý việc cá nhân",
    "Du lịch với gia đình",
    "Tham dự đám cưới bạn",
    "Nghỉ ốm - cảm cúm",
    "Bảo trì nhà cửa",
    "Chăm sóc người thân bị bệnh",
    "Tham gia khóa đào tạo bên ngoài",
    "Nghỉ dưỡng sức sau dự án lớn",
    "Khám răng",
    "Xử lý giấy tờ hành chính",
    "Tham dự lễ tốt nghiệp con",
]

# ──────────────────────────────────────────────
# 6. CHAT CONVERSATIONS
# ──────────────────────────────────────────────
CHAT_CONVERSATIONS = [
    {
        "title": "Hỏi về chính sách nghỉ phép",
        "messages": [
            ("user", "Tôi muốn hỏi về chính sách nghỉ phép năm. Mỗi nhân viên được bao nhiêu ngày nghỉ phép?"),
            ("assistant", "Theo chính sách của công ty Lumina, mỗi nhân viên full-time được hưởng:\n\n- **Nghỉ phép năm (Annual Leave):** 12 ngày/năm\n- **Nghỉ ốm (Sick Leave):** 30 ngày/năm (có giấy bác sĩ)\n- **Nghỉ việc riêng (Casual Leave):** 3 ngày/năm\n- **Nghỉ không lương:** Theo thỏa thuận với quản lý\n\nNgoài ra, nhân viên có thâm niên trên 5 năm được thêm 2 ngày phép/năm. Bạn có muốn biết thêm chi tiết về loại nghỉ phép nào không?"),
            ("user", "Tôi muốn nghỉ 5 ngày từ tuần sau, quy trình xin nghỉ như thế nào?"),
            ("assistant", "Đây là quy trình xin nghỉ phép:\n\n1. **Gửi đơn online:** Vào Employee Portal > Leave Request > Tạo đơn mới\n2. **Điền thông tin:** Chọn loại nghỉ phép, ngày bắt đầu/kết thúc, lý do\n3. **Gửi cho quản lý:** Đơn sẽ tự động gửi đến quản lý trực tiếp\n4. **Chờ phê duyệt:** Quản lý sẽ duyệt trong vòng 2 ngày làm việc\n\n**Lưu ý quan trọng:**\n- Gửi đơn trước ít nhất 3 ngày làm việc\n- Nghỉ trên 3 ngày cần gửi trước 2 tuần\n- Bàn giao công việc cho đồng nghiệp trước khi nghỉ\n\nBạn có cần tôi hướng dẫn tạo đơn trên Portal không?"),
        ]
    },
    {
        "title": "Hỏi về phúc lợi bảo hiểm",
        "messages": [
            ("user", "Công ty có những chương trình bảo hiểm gì cho nhân viên?"),
            ("assistant", "Công ty Lumina cung cấp gói phúc lợi bảo hiểm toàn diện:\n\n**1. Bảo hiểm xã hội (bắt buộc):**\n- BHXH, BHYT, BHTN theo quy định nhà nước\n\n**2. Bảo hiểm sức khỏe nâng cao:**\n- Gói Premium: khám chữa bệnh tại bệnh viện quốc tế\n- Giới hạn: 200 triệu VNĐ/năm/người\n- Bao gồm: nội trú, ngoại trú, nha khoa, mắt\n- Bảo hiểm cho người thân: +50% phí\n\n**3. Bảo hiểm tai nạn 24/7:**\n- Mức bồi thường: lên đến 500 triệu VNĐ\n\n**4. Bảo hiểm nhân thọ:**\n- Mức: 12 tháng lương cơ bản\n\nBạn muốn tìm hiểu thêm về phúc lợi nào?"),
            ("user", "Làm sao để đăng ký bảo hiểm cho vợ/chồng?"),
            ("assistant", "Để đăng ký bảo hiểm cho người thân (vợ/chồng, con), bạn cần:\n\n**Bước 1:** Tải form đăng ký từ Portal > Documents > Benefits\n**Bước 2:** Điền đầy đủ thông tin người thân\n**Bước 3:** Chuẩn bị giấy tờ:\n- Giấy đăng ký kết hôn (bản sao công chứng)\n- CMND/CCCD của người thân\n- Ảnh 3x4 (2 tấm)\n**Bước 4:** Gửi hồ sơ cho HR\n**Bước 5:** HR xử lý trong 5-7 ngày làm việc\n\n**Chi phí:**\n- Vợ/Chồng: Công ty hỗ trợ 50%, nhân viên đóng 50%\n- Con (dưới 18 tuổi): Công ty hỗ trợ 70%\n\nLiên hệ HR: hr@luvina.net | Ext: 1234"),
        ]
    },
    {
        "title": "Hỏi về chính sách làm việc từ xa",
        "messages": [
            ("user", "Cho tôi hỏi chính sách Work From Home hiện tại?"),
            ("assistant", "Theo chính sách Hybrid Work 2026 của Lumina:\n\n**Quy định chung:**\n- WFH tối đa 3 ngày/tuần\n- Bắt buộc có mặt: Thứ Ba và Thứ Năm\n- Đăng ký lịch WFH trước 17:00 Thứ Sáu hàng tuần\n\n**Yêu cầu khi WFH:**\n- Internet ổn định (≥20Mbps)\n- Phản hồi tin nhắn trong 30 phút (giờ làm việc)\n- Camera bật trong cuộc họp video\n- Daily report cuối ngày\n\n**Lưu ý:**\n- Manager có quyền yêu cầu lên văn phòng nếu cần\n- Một số vị trí không áp dụng WFH (Reception, IT Infra onsite)\n\nBạn cần đăng ký WFH cho tuần tới không?"),
        ]
    },
    {
        "title": "IT Support - Reset mật khẩu",
        "messages": [
            ("user", "Tôi quên mật khẩu email công ty, làm sao reset?"),
            ("assistant", "Tôi sẽ hướng dẫn bạn reset mật khẩu email:\n\n**Cách 1: Self-service (nhanh nhất)**\n1. Truy cập: https://password.luvina.net\n2. Nhập email công ty\n3. Xác minh qua số điện thoại đã đăng ký\n4. Tạo mật khẩu mới\n\n**Cách 2: Liên hệ IT Support**\n- Gọi: Ext 9999 hoặc hotline 1900-xxxx\n- Email cá nhân đến: it.support@luvina.net\n- Cung cấp: Họ tên, mã nhân viên, ngày sinh\n\n**Yêu cầu mật khẩu mới:**\n- Tối thiểu 12 ký tự\n- Chứa: chữ hoa + chữ thường + số + ký tự đặc biệt\n- Không trùng 5 mật khẩu gần nhất\n\n⚠️ Sau khi reset, bạn cần cập nhật mật khẩu trên tất cả thiết bị đã đăng nhập."),
            ("user", "Tôi không nhớ số điện thoại đã đăng ký. Có cách nào khác không?"),
            ("assistant", "Nếu không nhớ số điện thoại đã đăng ký, bạn có thể:\n\n**Cách 3: Xác minh trực tiếp**\n1. Đến phòng IT (Tầng 3, phòng 305)\n2. Mang theo CMND/CCCD\n3. IT sẽ xác minh danh tính và reset ngay\n\n**Giờ làm việc IT Support:**\n- Thứ 2 - Thứ 6: 08:00 - 18:00\n- Thứ 7: 09:00 - 12:00\n\n**Cách 4: Nhờ quản lý xác nhận**\n- Quản lý gửi email cho IT xác nhận bạn là nhân viên\n- IT sẽ reset và gửi mật khẩu tạm qua kênh an toàn\n\nBạn muốn tôi tạo ticket IT Support giúp không?"),
        ]
    },
    {
        "title": "Hỏi về quy trình tuyển dụng nội bộ",
        "messages": [
            ("user", "Tôi muốn ứng tuyển vị trí Senior Software Engineer ở phòng IT. Quy trình như thế nào?"),
            ("assistant", "Chúc mừng bạn quan tâm đến vị trí Senior Software Engineer! Đây là quy trình ứng tuyển nội bộ:\n\n**Bước 1: Kiểm tra điều kiện**\n- Đã làm việc tại Lumina ≥ 12 tháng\n- Performance Review gần nhất: Meets Expectations trở lên\n- Được sự đồng ý của quản lý hiện tại\n\n**Bước 2: Nộp hồ sơ**\n- CV cập nhật\n- Thư ứng tuyển (1 trang)\n- Gửi đến: hr@luvina.net, CC quản lý hiện tại\n- Hạn: 20/04/2026\n\n**Bước 3: Phỏng vấn**\n- Vòng 1: Technical Assessment (coding test)\n- Vòng 2: Interview với Hiring Manager\n- Vòng 3: Panel Interview\n\n**Timeline:** 2-3 tuần từ khi nộp hồ sơ\n\n**Ưu đãi chuyển vị trí nội bộ:**\n- Không cần thời gian thử việc\n- Hỗ trợ đào tạo chuyển đổi 3 tháng\n\nBạn cần thêm thông tin gì không?"),
        ]
    },
]


# ═══════════════════════════════════════════════
# EXECUTION
# ═══════════════════════════════════════════════

def create_users():
    print("\n" + "=" * 60)
    print("📋 CREATING USERS")
    print("=" * 60)
    users = {}
    for data in USERS_DATA:
        username = data["username"]
        if User.objects.filter(username=username).exists():
            users[username] = User.objects.get(username=username)
            print(f"  ⏭ {username} already exists")
        elif User.objects.filter(email=data["email"]).exists():
            users[username] = User.objects.get(email=data["email"])
            print(f"  ⏭ {username} already exists (by email)")
        else:
            user = User.objects.create_user(
                username=username,
                email=data["email"],
                password=data["password"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                role=data["role"],
                is_staff=data["role"] in ("admin", "hr"),
                is_superuser=data["role"] == "admin",
            )
            users[username] = user
            print(f"  ✅ Created {username} ({data['role']})")
    return users


def create_profiles(users):
    print("\n" + "=" * 60)
    print("👤 CREATING EMPLOYEE PROFILES")
    print("=" * 60)
    emp_index = 1
    for username, user in users.items():
        if hasattr(user, 'profile'):
            try:
                _ = user.profile
                print(f"  ⏭ Profile for {username} already exists")
                continue
            except EmployeeProfile.DoesNotExist:
                pass
        if EmployeeProfile.objects.filter(user=user).exists():
            print(f"  ⏭ Profile for {username} already exists")
            continue

        dept = random.choice(DEPARTMENTS)
        designation = random.choice(DESIGNATIONS[dept])
        city, state, country = random.choice(CITIES)
        doj = date(2023, 1, 1) + timedelta(days=random.randint(0, 900))
        dob = date(1985, 1, 1) + timedelta(days=random.randint(0, 5475))

        EmployeeProfile.objects.create(
            user=user,
            department=dept,
            designation=designation,
            employee_id=f"LMN-{emp_index:04d}",
            date_of_joining=doj,
            date_of_birth=dob,
            address=f"{random.randint(1,999)} {random.choice(['Nguyen Hue', 'Le Loi', 'Tran Hung Dao', 'Hai Ba Trung', 'Ly Tu Trong', 'Pasteur'])} Street",
            city=city,
            state=state,
            country=country,
            postal_code=f"{random.randint(10000, 99999)}",
            emergency_contact=f"{random.choice(['Nguyen', 'Tran', 'Le', 'Pham'])} {random.choice(['Van', 'Thi', 'Duc', 'Minh'])} {random.choice(['An', 'Binh', 'Chi', 'Dung'])}",
            emergency_contact_phone=f"+84{random.randint(900000000, 999999999)}",
            bio=f"{designation} tại {dict(EmployeeProfile.DEPARTMENT_CHOICES).get(dept, dept)} department với nhiều năm kinh nghiệm.",
        )
        print(f"  ✅ Profile for {username}: {designation} @ {dept}")
        emp_index += 1


def create_announcements(users):
    print("\n" + "=" * 60)
    print("📢 CREATING ANNOUNCEMENTS")
    print("=" * 60)
    admin_users = [u for u in users.values() if u.role in ("admin", "hr")]
    for i, data in enumerate(ANNOUNCEMENTS_DATA):
        if HRAnnouncement.objects.filter(title=data["title"]).exists():
            print(f"  ⏭ '{data['title'][:50]}...' already exists")
            continue
        creator = admin_users[i % len(admin_users)]
        pub_date = timezone.now() - timedelta(days=random.randint(1, 30))
        HRAnnouncement.objects.create(
            title=data["title"],
            content=data["content"],
            status=data["status"],
            created_by=creator,
            published_at=pub_date,
            expires_at=pub_date + timedelta(days=90),
        )
        print(f"  ✅ Announcement: {data['title'][:50]}...")


def create_leave_requests(users):
    print("\n" + "=" * 60)
    print("🏖 CREATING LEAVE REQUESTS")
    print("=" * 60)
    employees = [u for u in users.values() if u.role == "employee"]
    hr_users = [u for u in users.values() if u.role in ("admin", "hr")]
    leave_types = ['sick', 'casual', 'earned', 'unpaid']
    statuses_weights = [('pending', 30), ('approved', 50), ('rejected', 10), ('cancelled', 10)]
    statuses = [s for s, w in statuses_weights for _ in range(w)]

    count = 0
    for emp in employees:
        num_leaves = random.randint(2, 6)
        for _ in range(num_leaves):
            start = date(2025, 6, 1) + timedelta(days=random.randint(0, 300))
            duration = random.randint(1, 5)
            end = start + timedelta(days=duration)
            status = random.choice(statuses)
            leave_type = random.choice(leave_types)
            reason = random.choice(LEAVE_REASONS)

            lr = LeaveRequest(
                employee=emp,
                leave_type=leave_type,
                start_date=start,
                end_date=end,
                reason=reason,
                status=status,
            )
            if status == 'approved':
                approver = random.choice(hr_users)
                lr.approved_by = approver
                lr.approval_date = timezone.now() - timedelta(days=random.randint(1, 10))
                lr.approval_comment = random.choice(["Approved. Enjoy your time off!", "OK đã duyệt.", "Approved - please ensure handover.", "Đã duyệt. Bàn giao công việc nhé."])
            elif status == 'rejected':
                approver = random.choice(hr_users)
                lr.approved_by = approver
                lr.approval_date = timezone.now() - timedelta(days=random.randint(1, 10))
                lr.approval_comment = random.choice(["Team needs you during this period.", "Trùng lịch dự án quan trọng. Vui lòng chọn ngày khác.", "Too many people off that week."])
            lr.save()
            count += 1
    print(f"  ✅ Created {count} leave requests for {len(employees)} employees")


def create_payslips(users):
    print("\n" + "=" * 60)
    print("💰 CREATING PAYSLIPS")
    print("=" * 60)
    employees = [u for u in users.values() if u.role == "employee"]
    admin_user = next((u for u in users.values() if u.role == "admin"), next((u for u in users.values() if u.is_superuser), list(users.values())[0]))

    salary_ranges = {
        'it': (18_000_000, 45_000_000),
        'hr': (15_000_000, 35_000_000),
        'sales': (14_000_000, 40_000_000),
        'marketing': (14_000_000, 35_000_000),
        'operations': (13_000_000, 30_000_000),
        'finance': (16_000_000, 40_000_000),
    }

    count = 0
    months = [date(2025, m, 1) for m in range(7, 13)] + [date(2026, m, 1) for m in range(1, 4)]

    for emp in employees:
        try:
            profile = emp.profile
        except EmployeeProfile.DoesNotExist:
            continue

        dept = profile.department
        low, high = salary_ranges.get(dept, (15_000_000, 30_000_000))
        basic = Decimal(str(random.randint(low, high))).quantize(Decimal('1'))

        for month in months:
            if Payslip.objects.filter(employee=emp, month_year=month).exists():
                continue

            hra = (basic * Decimal('0.20')).quantize(Decimal('1'))
            da = (basic * Decimal('0.10')).quantize(Decimal('1'))
            other_allow = Decimal(str(random.randint(500_000, 3_000_000)))
            pf = (basic * Decimal('0.08')).quantize(Decimal('1'))
            tds = (basic * Decimal(str(random.uniform(0.05, 0.15)))).quantize(Decimal('1'))
            insurance_val = Decimal(str(random.choice([500_000, 700_000, 1_000_000])))
            other_ded = Decimal(str(random.randint(0, 500_000)))

            status = 'distributed' if month < date(2026, 3, 1) else 'finalized' if month == date(2026, 3, 1) else 'draft'

            Payslip.objects.create(
                employee=emp,
                month_year=month,
                basic_salary=basic,
                house_rent_allowance=hra,
                dearness_allowance=da,
                other_allowances=other_allow,
                provident_fund=pf,
                tax_deducted_at_source=tds,
                insurance=insurance_val,
                other_deductions=other_ded,
                status=status,
                created_by=admin_user,
            )
            count += 1

    print(f"  ✅ Created {count} payslips ({len(months)} months × {len(employees)} employees)")


def create_documents(users):
    print("\n" + "=" * 60)
    print("📄 CREATING DOCUMENTS")
    print("=" * 60)
    admin_users = [u for u in users.values() if u.role in ("admin", "hr")]

    for data in DOCUMENTS_DATA:
        if Document.objects.filter(title=data["title"]).exists():
            print(f"  ⏭ '{data['title'][:50]}' already exists")
            continue

        uploader = random.choice(admin_users)
        doc = Document.objects.create(
            title=data["title"],
            description=data["description"],
            document_type=data["document_type"],
            file=f"documents/2026/03/{data['title'].lower().replace(' ', '_')}.{data['file_type']}",
            file_size=data["file_size"],
            file_type=data["file_type"],
            uploaded_by=uploader,
            status="indexed",
            is_indexed=True,
            extracted_text=f"[Extracted text content of {data['title']}] {data['description']}",
            indexed_at=timezone.now() - timedelta(days=random.randint(1, 30)),
        )

        # Create metadata
        DocumentMetadata.objects.create(
            document=doc,
            author=f"{uploader.first_name} {uploader.last_name}",
            keywords=", ".join(data["title"].lower().split()[:5]),
            language="en",
            page_count=random.randint(5, 50),
            word_count=random.randint(2000, 15000),
            is_confidential=random.choice([False, False, False, True]),
            tags=f"{data['document_type']}, hr, {random.choice(['important', 'internal', 'public', 'confidential'])}",
        )

        # Create sample chunks
        num_chunks = random.randint(3, 8)
        for idx in range(num_chunks):
            DocumentChunk.objects.create(
                document=doc,
                chunk_index=idx,
                content=f"[Chunk {idx}] Content from {data['title']}: {data['description']} - Section {idx + 1} covers detailed information about relevant policies and procedures.",
                token_count=random.randint(100, 500),
            )

        print(f"  ✅ Document: {data['title']} ({num_chunks} chunks)")


def create_chat_sessions(users):
    print("\n" + "=" * 60)
    print("💬 CREATING CHAT SESSIONS & MESSAGES")
    print("=" * 60)
    employees = [u for u in users.values() if u.role == "employee"]

    count_sessions = 0
    count_messages = 0

    for conv_data in CHAT_CONVERSATIONS:
        user = random.choice(employees)

        session = ChatSession.objects.create(
            user=user,
            title=conv_data["title"],
            is_active=True,
        )
        count_sessions += 1

        for role, content in conv_data["messages"]:
            ChatMessage.objects.create(
                session=session,
                role=role,
                content=content,
                tokens_used=random.randint(50, 500) if role == "assistant" else None,
                sources=[],
            )
            count_messages += 1

    # Also create some extra quick sessions for variety
    quick_questions = [
        ("Lương tháng 3 đã có chưa?", "Phiếu lương tháng 3/2026 đã được cập nhật trên Portal. Bạn có thể xem tại mục Payslips. Nếu có thắc mắc về các khoản, vui lòng liên hệ HR."),
        ("WiFi văn phòng mật khẩu gì?", "WiFi văn phòng:\n- Tên: Lumina-Office\n- Mật khẩu: Lumina@2026\n\nWiFi khách:\n- Tên: Lumina-Guest\n- Mật khẩu: guest2026\n\nLưu ý: WiFi khách không truy cập được hệ thống nội bộ."),
        ("Số phòng họp còn trống chiều nay?", "Tôi không có quyền truy cập hệ thống đặt phòng họp. Bạn có thể:\n1. Xem lịch phòng họp trên Outlook Calendar\n2. Đặt phòng qua app Workplace của công ty\n3. Liên hệ Admin (ext: 1000)\n\nPhòng họp có sẵn: Meeting Room A (10 người), B (6 người), C (20 người)."),
        ("Tôi cần xin giấy xác nhận công tác", "Để xin giấy xác nhận công tác, bạn cần:\n\n1. Gửi email đến hr@luvina.net với nội dung:\n   - Họ tên, mã nhân viên\n   - Mục đích xin giấy (visa, ngân hàng, v.v.)\n   - Ngôn ngữ (Tiếng Việt/Tiếng Anh)\n2. HR sẽ xử lý trong 2-3 ngày làm việc\n3. Nhận giấy tại phòng HR hoặc gửi qua email\n\nPhí: Miễn phí"),
    ]

    for question, answer in quick_questions:
        user = random.choice(employees)
        session = ChatSession.objects.create(
            user=user,
            title=question[:50],
            is_active=True,
        )
        count_sessions += 1
        ChatMessage.objects.create(session=session, role="user", content=question)
        ChatMessage.objects.create(session=session, role="assistant", content=answer, tokens_used=random.randint(80, 300))
        count_messages += 2

    print(f"  ✅ Created {count_sessions} chat sessions with {count_messages} messages")


def print_summary():
    print("\n" + "=" * 60)
    print("📊 DATABASE SUMMARY")
    print("=" * 60)
    print(f"  Users:          {User.objects.count()}")
    print(f"  Profiles:       {EmployeeProfile.objects.count()}")
    print(f"  Announcements:  {HRAnnouncement.objects.count()}")
    print(f"  Leave Requests: {LeaveRequest.objects.count()}")
    print(f"  Payslips:       {Payslip.objects.count()}")
    print(f"  Documents:      {Document.objects.count()}")
    print(f"  Doc Chunks:     {DocumentChunk.objects.count()}")
    print(f"  Chat Sessions:  {ChatSession.objects.count()}")
    print(f"  Chat Messages:  {ChatMessage.objects.count()}")
    print("=" * 60)
    print("\n✨ Seed data completed!\n")
    print("🔑 Login credentials:")
    print("  Admin:    admin / Admin@123456")
    print("  HR:       hr_manager / Hr@123456")
    print("  Employee: john_doe / Employee@123")
    print("  (All employees share password: Employee@123)")


if __name__ == "__main__":
    print("\n🚀 Starting Employee Portal seed data generation...\n")
    users = create_users()
    create_profiles(users)
    create_announcements(users)
    create_leave_requests(users)
    create_payslips(users)
    create_documents(users)
    create_chat_sessions(users)
    print_summary()
