#!/usr/bin/env python
"""
Comprehensive seed script – populates Employee Portal with ~80 employees,
manager hierarchy, 60-day attendance/leave history, admin requests, payslips,
announcements, documents, and chat data.

IDEMPOTENT – safe to run multiple times (uses get_or_create / filter-before-insert).

Usage:
    cd Employee-portal
    python seed_full.py          # fresh seed
    python seed_full.py --reset  # wipe then re-seed
"""
import os
import sys
import random
import string
from datetime import date, timedelta, datetime
from decimal import Decimal

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction

from apps.employees.models import (
    EmployeeProfile, LeaveRequest, HRAnnouncement, Payslip, AdministrativeRequest,
)
from apps.documents.models import Document, DocumentChunk, DocumentMetadata
from apps.chat.models import ChatSession, ChatMessage

User = get_user_model()
TODAY = date.today()  # 2026-04-01
NOW = timezone.now()

# ════════════════════════════════════════════════════════════
# CONSTANTS
# ════════════════════════════════════════════════════════════
DEPARTMENTS = ['hr', 'it', 'sales', 'marketing', 'operations', 'finance']

DESIGNATIONS = {
    'hr': ['Giám đốc Nhân sự', 'Trưởng phòng Nhân sự', 'Đối tác Nhân sự', 'Trưởng nhóm Tuyển dụng',
            'Chuyên viên Nhân sự', 'Chuyên viên Tiền lương', 'Chuyên viên Thu hút Nhân tài', 'Điều phối viên Nhân sự'],
    'it': ['Phó Giám đốc Kỹ thuật', 'Trưởng phòng Kỹ thuật', 'Trưởng nhóm Kỹ thuật', 'Kỹ sư Phần mềm Cao cấp',
           'Kỹ sư Phần mềm', 'Kỹ sư DevOps', 'Kỹ sư Kiểm thử', 'Chuyên viên Phân tích Dữ liệu',
           'Quản trị Hệ thống', 'Thiết kế viên UI/UX', 'Lập trình viên', 'Kiến trúc sư Đám mây'],
    'sales': ['Giám đốc Kinh doanh', 'Trưởng phòng Kinh doanh', 'Chuyên viên Khách hàng Cao cấp',
              'Chuyên viên Khách hàng', 'Nhân viên Phát triển Kinh doanh', 'Kỹ sư Kinh doanh',
              'Nhân viên Kinh doanh', 'Điều phối viên Kinh doanh'],
    'marketing': ['Giám đốc Marketing', 'Trưởng phòng Marketing', 'Chuyên viên Chiến lược Nội dung',
                  'Chuyên viên SEO', 'Thiết kế viên Thương hiệu', 'Chuyên viên Marketing Số',
                  'Quản lý Mạng Xã hội', 'Chuyên viên Phân tích Marketing'],
    'operations': ['Giám đốc Vận hành', 'Trưởng phòng Vận hành', 'Quản lý Dự án', 'Điều phối viên Dự án',
                   'Chuyên viên Chuỗi Cung ứng', 'Trưởng nhóm Logistics', 'Chuyên viên Phân tích Vận hành',
                   'Quản lý Chất lượng'],
    'finance': ['Giám đốc Tài chính', 'Trưởng phòng Tài chính', 'Kế toán Cao cấp', 'Kế toán viên',
                'Chuyên viên Phân tích Tài chính', 'Kiểm toán viên', 'Chuyên viên Công nợ', 'Chuyên viên Ngân sách'],
}

# Manager-level designations (first 2-3 per dept become managers)
MANAGER_TITLES = {
    'hr': ['Giám đốc Nhân sự', 'Trưởng phòng Nhân sự'],
    'it': ['Phó Giám đốc Kỹ thuật', 'Trưởng phòng Kỹ thuật', 'Trưởng nhóm Kỹ thuật'],
    'sales': ['Giám đốc Kinh doanh', 'Trưởng phòng Kinh doanh'],
    'marketing': ['Giám đốc Marketing', 'Trưởng phòng Marketing'],
    'operations': ['Giám đốc Vận hành', 'Trưởng phòng Vận hành'],
    'finance': ['Giám đốc Tài chính', 'Trưởng phòng Tài chính'],
}

CITIES = [
    ('Ho Chi Minh City', 'Ho Chi Minh', 'Vietnam'),
    ('Hanoi', 'Hanoi', 'Vietnam'),
    ('Da Nang', 'Da Nang', 'Vietnam'),
    ('Hai Phong', 'Hai Phong', 'Vietnam'),
    ('Can Tho', 'Can Tho', 'Vietnam'),
    ('Nha Trang', 'Khanh Hoa', 'Vietnam'),
    ('New York', 'NY', 'USA'),
    ('San Francisco', 'CA', 'USA'),
    ('Singapore', 'Central', 'Singapore'),
    ('Tokyo', 'Tokyo', 'Japan'),
]

STREETS = [
    'Nguyen Hue', 'Le Loi', 'Tran Hung Dao', 'Hai Ba Trung', 'Ly Tu Trong',
    'Pasteur', 'Dong Khoi', 'Nam Ky Khoi Nghia', 'Vo Van Tan', 'Le Duan',
    'Pham Ngu Lao', 'Bui Vien', 'Nguyen Trai', 'Le Van Sy', 'Cach Mang Thang 8',
]

BANK_NAMES = ['Vietcombank', 'BIDV', 'Techcombank', 'VPBank', 'ACB',
              'MB Bank', 'Sacombank', 'TPBank', 'VIB', 'HDBank']

# ────────────────────── USERS ──────────────────────
# 3 admin/hr + 77 employees = ~80 total
USERS_DATA = [
    # ─── Admin & HR ───
    {"username": "admin", "email": "admin@luvina.net", "first_name": "Admin", "last_name": "System", "role": "admin"},
    {"username": "hr_manager", "email": "hr@luvina.net", "first_name": "Nguyen", "last_name": "Thi Lan", "role": "hr"},
    {"username": "hr_assistant", "email": "hr.assistant@luvina.net", "first_name": "Tran", "last_name": "Van Minh", "role": "hr"},

    # ─── IT Department (15) ───
    {"username": "it_dir_phong", "email": "phong.le@luvina.net", "first_name": "Phong", "last_name": "Le", "role": "employee"},
    {"username": "it_mgr_david", "email": "david.nguyen@luvina.net", "first_name": "David", "last_name": "Nguyen", "role": "employee"},
    {"username": "it_lead_alex", "email": "alex.tran@luvina.net", "first_name": "Alex", "last_name": "Tran", "role": "employee"},
    {"username": "john_doe", "email": "john.doe@luvina.net", "first_name": "John", "last_name": "Doe", "role": "employee"},
    {"username": "jane_smith", "email": "jane.smith@luvina.net", "first_name": "Jane", "last_name": "Smith", "role": "employee"},
    {"username": "michael_pham", "email": "michael.pham@luvina.net", "first_name": "Michael", "last_name": "Pham", "role": "employee"},
    {"username": "emily_vo", "email": "emily.vo@luvina.net", "first_name": "Emily", "last_name": "Vo", "role": "employee"},
    {"username": "kevin_bui", "email": "kevin.bui@luvina.net", "first_name": "Kevin", "last_name": "Bui", "role": "employee"},
    {"username": "lisa_dang", "email": "lisa.dang@luvina.net", "first_name": "Lisa", "last_name": "Dang", "role": "employee"},
    {"username": "chris_lam", "email": "chris.lam@luvina.net", "first_name": "Chris", "last_name": "Lam", "role": "employee"},
    {"username": "it_dev_hieu", "email": "hieu.do@luvina.net", "first_name": "Hieu", "last_name": "Do", "role": "employee"},
    {"username": "it_dev_thao", "email": "thao.phan@luvina.net", "first_name": "Thao", "last_name": "Phan", "role": "employee"},
    {"username": "it_qa_mai", "email": "mai.hoang@luvina.net", "first_name": "Mai", "last_name": "Hoang", "role": "employee"},
    {"username": "it_devops_tung", "email": "tung.vu@luvina.net", "first_name": "Tung", "last_name": "Vu", "role": "employee"},
    {"username": "it_junior_linh", "email": "linh.bui@luvina.net", "first_name": "Linh", "last_name": "Bui", "role": "employee"},

    # ─── Sales Department (12) ───
    {"username": "sales_dir_hung", "email": "hung.tran@luvina.net", "first_name": "Hung", "last_name": "Tran", "role": "employee"},
    {"username": "sales_mgr_sarah", "email": "sarah.le@luvina.net", "first_name": "Sarah", "last_name": "Le", "role": "employee"},
    {"username": "maria_garcia", "email": "maria.garcia@luvina.net", "first_name": "Maria", "last_name": "Garcia", "role": "employee"},
    {"username": "robert_hoang", "email": "robert.hoang@luvina.net", "first_name": "Robert", "last_name": "Hoang", "role": "employee"},
    {"username": "anna_duong", "email": "anna.duong@luvina.net", "first_name": "Anna", "last_name": "Duong", "role": "employee"},
    {"username": "peter_truong", "email": "peter.truong@luvina.net", "first_name": "Peter", "last_name": "Truong", "role": "employee"},
    {"username": "sales_ae_tam", "email": "tam.vo@luvina.net", "first_name": "Tam", "last_name": "Vo", "role": "employee"},
    {"username": "sales_ae_nhi", "email": "nhi.ly@luvina.net", "first_name": "Nhi", "last_name": "Ly", "role": "employee"},
    {"username": "sales_bdr_khanh", "email": "khanh.pham@luvina.net", "first_name": "Khanh", "last_name": "Pham", "role": "employee"},
    {"username": "sales_se_bao", "email": "bao.dang@luvina.net", "first_name": "Bao", "last_name": "Dang", "role": "employee"},
    {"username": "sales_rep_uyen", "email": "uyen.ngo@luvina.net", "first_name": "Uyen", "last_name": "Ngo", "role": "employee"},
    {"username": "sales_coord_vy", "email": "vy.truong@luvina.net", "first_name": "Vy", "last_name": "Truong", "role": "employee"},

    # ─── Marketing Department (10) ───
    {"username": "mkt_dir_hanh", "email": "hanh.nguyen@luvina.net", "first_name": "Hanh", "last_name": "Nguyen", "role": "employee"},
    {"username": "mkt_mgr_diana", "email": "diana.ngo@luvina.net", "first_name": "Diana", "last_name": "Ngo", "role": "employee"},
    {"username": "nancy_ly", "email": "nancy.ly@luvina.net", "first_name": "Nancy", "last_name": "Ly", "role": "employee"},
    {"username": "james_cao", "email": "james.cao@luvina.net", "first_name": "James", "last_name": "Cao", "role": "employee"},
    {"username": "emma_huynh", "email": "emma.huynh@luvina.net", "first_name": "Emma", "last_name": "Huynh", "role": "employee"},
    {"username": "mkt_seo_duc", "email": "duc.le@luvina.net", "first_name": "Duc", "last_name": "Le", "role": "employee"},
    {"username": "mkt_social_phuong", "email": "phuong.tran@luvina.net", "first_name": "Phuong", "last_name": "Tran", "role": "employee"},
    {"username": "mkt_design_tuan", "email": "tuan.dang@luvina.net", "first_name": "Tuan", "last_name": "Dang", "role": "employee"},
    {"username": "mkt_analyst_hoa", "email": "hoa.vu@luvina.net", "first_name": "Hoa", "last_name": "Vu", "role": "employee"},
    {"username": "mkt_content_nga", "email": "nga.pham@luvina.net", "first_name": "Nga", "last_name": "Pham", "role": "employee"},

    # ─── Finance Department (10) ───
    {"username": "fin_cfo_thanh", "email": "thanh.nguyen@luvina.net", "first_name": "Thanh", "last_name": "Nguyen", "role": "employee"},
    {"username": "fin_mgr_emma", "email": "emma.le@luvina.net", "first_name": "Emma", "last_name": "Le", "role": "employee"},
    {"username": "fin_acct_binh", "email": "binh.tran@luvina.net", "first_name": "Binh", "last_name": "Tran", "role": "employee"},
    {"username": "fin_acct_chi", "email": "chi.vo@luvina.net", "first_name": "Chi", "last_name": "Vo", "role": "employee"},
    {"username": "fin_analyst_dat", "email": "dat.hoang@luvina.net", "first_name": "Dat", "last_name": "Hoang", "role": "employee"},
    {"username": "fin_audit_giang", "email": "giang.bui@luvina.net", "first_name": "Giang", "last_name": "Bui", "role": "employee"},
    {"username": "fin_ap_huong", "email": "huong.dang@luvina.net", "first_name": "Huong", "last_name": "Dang", "role": "employee"},
    {"username": "fin_budget_khoa", "email": "khoa.ly@luvina.net", "first_name": "Khoa", "last_name": "Ly", "role": "employee"},
    {"username": "fin_sr_lien", "email": "lien.ngo@luvina.net", "first_name": "Lien", "last_name": "Ngo", "role": "employee"},
    {"username": "fin_intern_minh", "email": "minh.pham@luvina.net", "first_name": "Minh", "last_name": "Pham", "role": "employee"},

    # ─── Operations Department (10) ───
    {"username": "ops_coo_quang", "email": "quang.le@luvina.net", "first_name": "Quang", "last_name": "Le", "role": "employee"},
    {"username": "ops_mgr_nhu", "email": "nhu.tran@luvina.net", "first_name": "Nhu", "last_name": "Tran", "role": "employee"},
    {"username": "ops_pm_son", "email": "son.nguyen@luvina.net", "first_name": "Son", "last_name": "Nguyen", "role": "employee"},
    {"username": "ops_coord_thuy", "email": "thuy.vo@luvina.net", "first_name": "Thuy", "last_name": "Vo", "role": "employee"},
    {"username": "ops_supply_vinh", "email": "vinh.pham@luvina.net", "first_name": "Vinh", "last_name": "Pham", "role": "employee"},
    {"username": "ops_logis_xuan", "email": "xuan.le@luvina.net", "first_name": "Xuan", "last_name": "Le", "role": "employee"},
    {"username": "ops_analyst_yen", "email": "yen.hoang@luvina.net", "first_name": "Yen", "last_name": "Hoang", "role": "employee"},
    {"username": "ops_quality_an", "email": "an.bui@luvina.net", "first_name": "An", "last_name": "Bui", "role": "employee"},
    {"username": "ops_coord_bang", "email": "bang.dao@luvina.net", "first_name": "Bang", "last_name": "Dao", "role": "employee"},
    {"username": "ops_asst_cuong", "email": "cuong.do@luvina.net", "first_name": "Cuong", "last_name": "Do", "role": "employee"},

    # ─── HR Department (extra staff: 7 total with hr_manager + hr_assistant) ───
    {"username": "hr_bp_diem", "email": "diem.le@luvina.net", "first_name": "Diem", "last_name": "Le", "role": "employee"},
    {"username": "hr_recruit_giao", "email": "giao.tran@luvina.net", "first_name": "Giao", "last_name": "Tran", "role": "employee"},
    {"username": "hr_payroll_hien", "email": "hien.nguyen@luvina.net", "first_name": "Hien", "last_name": "Nguyen", "role": "employee"},
    {"username": "hr_talent_kim", "email": "kim.vo@luvina.net", "first_name": "Kim", "last_name": "Vo", "role": "employee"},
    {"username": "hr_coord_lam", "email": "lam.phan@luvina.net", "first_name": "Lam", "last_name": "Phan", "role": "employee"},
]

# Department assignments (username → dept, designation)
PROFILE_ASSIGNMENTS = {
    # HR (hr_manager and hr_assistant are hr role users, also get profiles)
    'hr_manager':       ('hr', 'Giám đốc Nhân sự'),
    'hr_assistant':     ('hr', 'Trưởng phòng Nhân sự'),
    'hr_bp_diem':       ('hr', 'Đối tác Nhân sự'),
    'hr_recruit_giao':  ('hr', 'Trưởng nhóm Tuyển dụng'),
    'hr_payroll_hien':  ('hr', 'Chuyên viên Tiền lương'),
    'hr_talent_kim':    ('hr', 'Chuyên viên Thu hút Nhân tài'),
    'hr_coord_lam':     ('hr', 'Điều phối viên Nhân sự'),
    # IT
    'it_dir_phong':     ('it', 'Phó Giám đốc Kỹ thuật'),
    'it_mgr_david':     ('it', 'Trưởng phòng Kỹ thuật'),
    'it_lead_alex':     ('it', 'Trưởng nhóm Kỹ thuật'),
    'john_doe':         ('it', 'Kỹ sư Phần mềm Cao cấp'),
    'jane_smith':       ('it', 'Kỹ sư Phần mềm'),
    'michael_pham':     ('it', 'Kỹ sư Phần mềm'),
    'emily_vo':         ('it', 'Kỹ sư DevOps'),
    'kevin_bui':        ('it', 'Kỹ sư Kiểm thử'),
    'lisa_dang':        ('it', 'Chuyên viên Phân tích Dữ liệu'),
    'chris_lam':        ('it', 'Quản trị Hệ thống'),
    'it_dev_hieu':      ('it', 'Kỹ sư Phần mềm'),
    'it_dev_thao':      ('it', 'Thiết kế viên UI/UX'),
    'it_qa_mai':        ('it', 'Kỹ sư Kiểm thử'),
    'it_devops_tung':   ('it', 'Kỹ sư DevOps'),
    'it_junior_linh':   ('it', 'Lập trình viên'),
    # Sales
    'sales_dir_hung':   ('sales', 'Giám đốc Kinh doanh'),
    'sales_mgr_sarah':  ('sales', 'Trưởng phòng Kinh doanh'),
    'maria_garcia':     ('sales', 'Chuyên viên Khách hàng Cao cấp'),
    'robert_hoang':     ('sales', 'Chuyên viên Khách hàng'),
    'anna_duong':       ('sales', 'Chuyên viên Khách hàng'),
    'peter_truong':     ('sales', 'Nhân viên Phát triển Kinh doanh'),
    'sales_ae_tam':     ('sales', 'Chuyên viên Khách hàng'),
    'sales_ae_nhi':     ('sales', 'Nhân viên Kinh doanh'),
    'sales_bdr_khanh':  ('sales', 'Nhân viên Phát triển Kinh doanh'),
    'sales_se_bao':     ('sales', 'Kỹ sư Kinh doanh'),
    'sales_rep_uyen':   ('sales', 'Nhân viên Kinh doanh'),
    'sales_coord_vy':   ('sales', 'Điều phối viên Kinh doanh'),
    # Marketing
    'mkt_dir_hanh':     ('marketing', 'Giám đốc Marketing'),
    'mkt_mgr_diana':    ('marketing', 'Trưởng phòng Marketing'),
    'nancy_ly':         ('marketing', 'Chuyên viên Chiến lược Nội dung'),
    'james_cao':        ('marketing', 'Chuyên viên Marketing Số'),
    'emma_huynh':       ('marketing', 'Quản lý Mạng Xã hội'),
    'mkt_seo_duc':      ('marketing', 'Chuyên viên SEO'),
    'mkt_social_phuong':('marketing', 'Quản lý Mạng Xã hội'),
    'mkt_design_tuan':  ('marketing', 'Thiết kế viên Thương hiệu'),
    'mkt_analyst_hoa':  ('marketing', 'Chuyên viên Phân tích Marketing'),
    'mkt_content_nga':  ('marketing', 'Chuyên viên Chiến lược Nội dung'),
    # Finance
    'fin_cfo_thanh':    ('finance', 'Giám đốc Tài chính'),
    'fin_mgr_emma':     ('finance', 'Trưởng phòng Tài chính'),
    'fin_acct_binh':    ('finance', 'Kế toán Cao cấp'),
    'fin_acct_chi':     ('finance', 'Kế toán viên'),
    'fin_analyst_dat':  ('finance', 'Chuyên viên Phân tích Tài chính'),
    'fin_audit_giang':  ('finance', 'Kiểm toán viên'),
    'fin_ap_huong':     ('finance', 'Chuyên viên Công nợ'),
    'fin_budget_khoa':  ('finance', 'Chuyên viên Ngân sách'),
    'fin_sr_lien':      ('finance', 'Kế toán Cao cấp'),
    'fin_intern_minh':  ('finance', 'Kế toán viên'),
    # Operations
    'ops_coo_quang':    ('operations', 'Giám đốc Vận hành'),
    'ops_mgr_nhu':      ('operations', 'Trưởng phòng Vận hành'),
    'ops_pm_son':       ('operations', 'Quản lý Dự án'),
    'ops_coord_thuy':   ('operations', 'Điều phối viên Dự án'),
    'ops_supply_vinh':  ('operations', 'Chuyên viên Chuỗi Cung ứng'),
    'ops_logis_xuan':   ('operations', 'Trưởng nhóm Logistics'),
    'ops_analyst_yen':  ('operations', 'Chuyên viên Phân tích Vận hành'),
    'ops_quality_an':   ('operations', 'Quản lý Chất lượng'),
    'ops_coord_bang':   ('operations', 'Điều phối viên Dự án'),
    'ops_asst_cuong':   ('operations', 'Chuyên viên Phân tích Vận hành'),
}

# Manager hierarchy: username → manager username
MANAGER_MAP = {
    # HR hierarchy:  hr_manager is director → hr_assistant manages rest
    'hr_assistant':     'hr_manager',
    'hr_bp_diem':       'hr_assistant',
    'hr_recruit_giao':  'hr_assistant',
    'hr_payroll_hien':  'hr_assistant',
    'hr_talent_kim':    'hr_assistant',
    'hr_coord_lam':     'hr_assistant',
    # IT: phong (VP) → david (mgr) → alex (lead) → devs
    'it_mgr_david':     'it_dir_phong',
    'it_lead_alex':     'it_mgr_david',
    'john_doe':         'it_lead_alex',
    'jane_smith':       'it_lead_alex',
    'michael_pham':     'it_lead_alex',
    'emily_vo':         'it_mgr_david',
    'kevin_bui':        'it_mgr_david',
    'lisa_dang':        'it_mgr_david',
    'chris_lam':        'it_mgr_david',
    'it_dev_hieu':      'it_lead_alex',
    'it_dev_thao':      'it_lead_alex',
    'it_qa_mai':        'it_mgr_david',
    'it_devops_tung':   'it_mgr_david',
    'it_junior_linh':   'it_lead_alex',
    # Sales: hung (dir) → sarah (mgr) → reps
    'sales_mgr_sarah':  'sales_dir_hung',
    'maria_garcia':     'sales_mgr_sarah',
    'robert_hoang':     'sales_mgr_sarah',
    'anna_duong':       'sales_mgr_sarah',
    'peter_truong':     'sales_mgr_sarah',
    'sales_ae_tam':     'sales_mgr_sarah',
    'sales_ae_nhi':     'sales_mgr_sarah',
    'sales_bdr_khanh':  'sales_dir_hung',
    'sales_se_bao':     'sales_dir_hung',
    'sales_rep_uyen':   'sales_mgr_sarah',
    'sales_coord_vy':   'sales_mgr_sarah',
    # Marketing: hanh (dir) → diana (mgr) → team
    'mkt_mgr_diana':    'mkt_dir_hanh',
    'nancy_ly':         'mkt_mgr_diana',
    'james_cao':        'mkt_mgr_diana',
    'emma_huynh':       'mkt_mgr_diana',
    'mkt_seo_duc':      'mkt_mgr_diana',
    'mkt_social_phuong':'mkt_mgr_diana',
    'mkt_design_tuan':  'mkt_mgr_diana',
    'mkt_analyst_hoa':  'mkt_dir_hanh',
    'mkt_content_nga':  'mkt_mgr_diana',
    # Finance: thanh (CFO) → emma_mgr → team
    'fin_mgr_emma':     'fin_cfo_thanh',
    'fin_acct_binh':    'fin_mgr_emma',
    'fin_acct_chi':     'fin_mgr_emma',
    'fin_analyst_dat':  'fin_mgr_emma',
    'fin_audit_giang':  'fin_cfo_thanh',
    'fin_ap_huong':     'fin_mgr_emma',
    'fin_budget_khoa':  'fin_mgr_emma',
    'fin_sr_lien':      'fin_cfo_thanh',
    'fin_intern_minh':  'fin_mgr_emma',
    # Operations: quang (COO) → nhu (mgr) → team
    'ops_mgr_nhu':      'ops_coo_quang',
    'ops_pm_son':       'ops_mgr_nhu',
    'ops_coord_thuy':   'ops_pm_son',
    'ops_supply_vinh':  'ops_mgr_nhu',
    'ops_logis_xuan':   'ops_mgr_nhu',
    'ops_analyst_yen':  'ops_mgr_nhu',
    'ops_quality_an':   'ops_coo_quang',
    'ops_coord_bang':   'ops_pm_son',
    'ops_asst_cuong':   'ops_mgr_nhu',
}

PASSWORD_DEFAULT = 'Employee@123'
PASSWORD_ADMIN = 'Admin@123456'
PASSWORD_HR = 'Hr@123456'

# ════════════════════════════════════════════════════════════
# ANNOUNCEMENTS  (Vietnamese)
# ════════════════════════════════════════════════════════════
ANNOUNCEMENTS_DATA = [
    {
        "title": "Chào Mừng Đến Với Employee Portal 2.0",
        "content": """Kính gửi toàn thể nhân viên,

Chúng tôi vui mừng thông báo ra mắt Employee Portal phiên bản 2.0 với nhiều tính năng mới:

1. **AI Chatbot** - Hỗ trợ trả lời câu hỏi về chính sách công ty 24/7
2. **Tìm kiếm thông minh** - Tìm kiếm tài liệu bằng AI
3. **Quản lý nghỉ phép** - Gửi và theo dõi đơn nghỉ phép trực tuyến
4. **Phiếu lương** - Xem phiếu lương hàng tháng

Trân trọng,
Ban Giám Đốc""",
        "status": "published",
        "days_ago": 28,
    },
    {
        "title": "Lịch Nghỉ Lễ Năm 2026",
        "content": """Phòng Nhân sự xin thông báo lịch nghỉ lễ năm 2026:
- 01/01: Tết Dương lịch
- 25/01 – 01/02: Tết Nguyên Đán
- 06/04: Giỗ Tổ Hùng Vương
- 30/04: Giải phóng miền Nam
- 01/05: Quốc tế Lao động
- 02/09: Quốc khánh

Phòng Nhân sự""",
        "status": "published",
        "days_ago": 60,
    },
    {
        "title": "Chương Trình Sức Khỏe & Phúc Lợi Mới",
        "content": """Chương trình phúc lợi sức khỏe mới có hiệu lực từ 01/04/2026:

**Bảo hiểm nâng cao:**
- Khám sức khỏe tổng quát hàng năm miễn phí
- Bảo hiểm nha khoa 10 triệu VNĐ/năm
- Bảo hiểm mắt 5 triệu VNĐ/năm

**Wellness:**
- Hỗ trợ gym/yoga 500.000 VNĐ/tháng
- Mental Health Day – 2 ngày/năm

Phòng Nhân sự""",
        "status": "published",
        "days_ago": 14,
    },
    {
        "title": "Chính Sách Làm Việc Từ Xa (Hybrid Work 2026)",
        "content": """Cập nhật chính sách:
- WFH tối đa 3 ngày/tuần
- Bắt buộc có mặt: Thứ Ba và Thứ Năm
- Internet ≥20 Mbps, camera bật khi họp video
- Đăng ký lịch WFH trước 17:00 Thứ Sáu hàng tuần

Ban Điều hành""",
        "status": "published",
        "days_ago": 21,
    },
    {
        "title": "Team Building Q2/2026 – Phan Thiết",
        "content": """🎉 Team Building Q2/2026!
Thời gian: 25-27/04/2026
Địa điểm: Mũi Né, Phan Thiết
Chi phí: Công ty tài trợ 100%
Đăng ký trước 10/04/2026.

HR Department""",
        "status": "published",
        "days_ago": 7,
    },
    {
        "title": "Đánh Giá Hiệu Suất Giữa Năm 2026",
        "content": """Timeline:
- 01/04 – 15/04: Nhân viên tự đánh giá
- 16/04 – 30/04: Quản lý đánh giá
- 01/05 – 10/05: Phiên 1-on-1
- 15/05: Kết quả đánh giá

Phòng Nhân sự""",
        "status": "published",
        "days_ago": 3,
    },
    {
        "title": "Nâng Cấp Hệ Thống IT – 05/04/2026",
        "content": """Thời gian bảo trì: 05/04/2026 22:00 – 06/04/2026 06:00
Hệ thống bị ảnh hưởng: Email, VPN, Portal, File sharing
Cải tiến: Tốc độ +40%, 2FA bắt buộc, AI chatbot mới.

IT Department""",
        "status": "published",
        "days_ago": 2,
    },
    {
        "title": "Chương Trình Đào Tạo Q2/2026",
        "content": """Technical: Python Advanced, AWS, Power BI
Soft Skills: Leadership, Communication, Time Management
Compliance: Security Awareness, Anti-Harassment (mandatory)

Đăng ký qua Portal > Training.
L&D Department""",
        "status": "published",
        "days_ago": 10,
    },
    {
        "title": "Tuyển Dụng Nội Bộ – Q2/2026",
        "content": """Vị trí:
1. Senior Software Engineer – IT (thỏa thuận)
2. Marketing Lead – Marketing (25-35M)
3. Financial Analyst – Finance (20-30M)

Gửi CV: hr@luvina.net trước 20/04/2026.
Phòng Tuyển dụng""",
        "status": "published",
        "days_ago": 5,
    },
    {
        "title": "Quy Định Bảo Mật Thông Tin 2026",
        "content": """Cập nhật có hiệu lực 01/04/2026:
- Mật khẩu ≥12 ký tự, đổi mỗi 60 ngày
- 2FA bắt buộc (Authenticator app)
- BYOD phải cài MDM
- Không forward email công ty ra ngoài

IT Security Team""",
        "status": "published",
        "days_ago": 1,
    },
    {
        "title": "Thông Báo Thưởng Tết 2026 (Draft)",
        "content": """Phương án thưởng Tết đang được Ban Giám Đốc xem xét. Thông tin chi tiết sẽ được công bố sau.""",
        "status": "draft",
        "days_ago": 45,
    },
    {
        "title": "Chính Sách Nghỉ Phép Cũ (Hết Hạn)",
        "content": """Chính sách nghỉ phép 2025 đã hết hiệu lực.""",
        "status": "archived",
        "days_ago": 90,
    },
]

# ════════════════════════════════════════════════════════════
# DOCUMENTS
# ════════════════════════════════════════════════════════════
DOCUMENTS_DATA = [
    {"title": "Sổ tay Nhân viên 2026", "description": "Hướng dẫn toàn diện về chính sách, phúc lợi và quy trình.", "document_type": "handbook", "file_type": "pdf", "file_size": 4_200_000},
    {"title": "Chính sách Làm việc Từ xa", "description": "Quy định làm việc kết hợp và từ xa.", "document_type": "policy", "file_type": "pdf", "file_size": 1_500_000},
    {"title": "Chính sách Bảo mật Thông tin", "description": "Quy định bảo mật toàn công ty.", "document_type": "policy", "file_type": "pdf", "file_size": 2_800_000},
    {"title": "Quy tắc Ứng xử", "description": "Quy tắc đạo đức cho toàn thể nhân viên.", "document_type": "policy", "file_type": "pdf", "file_size": 1_200_000},
    {"title": "Chính sách & Hướng dẫn Nghỉ phép", "description": "Các loại nghỉ phép và quy trình nộp đơn.", "document_type": "policy", "file_type": "pdf", "file_size": 980_000},
    {"title": "Hướng dẫn Phúc lợi & Lương thưởng", "description": "Bảo hiểm sức khỏe, hưu trí và quyền lợi.", "document_type": "handbook", "file_type": "pdf", "file_size": 3_100_000},
    {"title": "Danh mục Hội nhập Nhân viên Mới", "description": "Hướng dẫn từng bước cho nhân viên mới.", "document_type": "form", "file_type": "docx", "file_size": 450_000},
    {"title": "Mẫu Đánh giá Hiệu suất Q2 2026", "description": "Mẫu đánh giá giữa năm.", "document_type": "form", "file_type": "docx", "file_size": 380_000},
    {"title": "Chính sách Công tác & Chi phí", "description": "Quy định công tác và thanh toán chi phí.", "document_type": "policy", "file_type": "pdf", "file_size": 1_100_000},
    {"title": "Chính sách Chống Quấy rối", "description": "Chính sách về quấy rối và phân biệt đối xử nơi làm việc.", "document_type": "policy", "file_type": "pdf", "file_size": 1_800_000},
    {"title": "Chính sách Sử dụng Thiết bị CNTT", "description": "Quy định sử dụng thiết bị CNTT của công ty.", "document_type": "policy", "file_type": "pdf", "file_size": 750_000},
    {"title": "Danh mục Đào tạo Q2 2026", "description": "Các chương trình đào tạo hiện có.", "document_type": "announcement", "file_type": "pdf", "file_size": 2_500_000},
    {"title": "Kế hoạch Ứng phó Khẩn cấp", "description": "Quy trình xử lý cháy nổ, động đất và tình huống khẩn cấp.", "document_type": "handbook", "file_type": "pdf", "file_size": 1_600_000},
    {"title": "Bảo vệ Dữ liệu & Tuân thủ GDPR", "description": "Tuân thủ quy định bảo mật dữ liệu cá nhân.", "document_type": "policy", "file_type": "pdf", "file_size": 2_200_000},
    {"title": "Mẫu Thuế Nhân viên Mới W-4", "description": "Mẫu kê khai khấu trừ thuế.", "document_type": "form", "file_type": "pdf", "file_size": 320_000},
]

# ════════════════════════════════════════════════════════════
# LEAVE / ADMIN REQUESTS
# ════════════════════════════════════════════════════════════
LEAVE_REASONS = [
    "Về quê thăm gia đình", "Khám sức khỏe định kỳ", "Nghỉ phép năm",
    "Đưa con đi tiêm chủng", "Xử lý việc cá nhân", "Du lịch gia đình",
    "Tham dự đám cưới bạn", "Nghỉ ốm – cảm cúm", "Bảo trì nhà cửa",
    "Chăm sóc người thân bệnh", "Tham gia đào tạo bên ngoài",
    "Nghỉ dưỡng sức sau dự án", "Khám răng", "Xử lý giấy tờ hành chính",
    "Tham dự lễ tốt nghiệp con",
]

ADMIN_REQUEST_DATA = [
    ("employment_verification", "Xác nhận công tác cho ngân hàng", "Cần xác nhận đang làm việc tại công ty để mở tài khoản tín dụng.", "high"),
    ("salary_certificate", "Giấy xác nhận lương – Visa Nhật Bản", "Cần xác nhận lương 3 tháng gần nhất để xin visa du lịch Nhật.", "high"),
    ("experience_letter", "Đề nghị cấp giấy xác nhận kinh nghiệm", "Cần giấy xác nhận kinh nghiệm để hồ sơ học bổng MBA.", "medium"),
    ("card_replacement", "Xin cấp lại thẻ nhân viên", "Thẻ nhân viên bị mất khi di chuyển.", "medium"),
    ("salary_certificate", "Xác nhận lương cho hồ sơ vay mua nhà", "Ngân hàng yêu cầu xác nhận thu nhập.", "high"),
    ("employment_verification", "Xác nhận công tác cho con nhập học", "Trường quốc tế yêu cầu xác nhận phụ huynh đang làm việc.", "medium"),
    ("other", "Xin giấy giới thiệu khám bệnh", "Cần giấy giới thiệu để khám tại BV Quốc tế.", "low"),
    ("card_replacement", "Cấp lại thẻ ra vào (bị hỏng)", "Thẻ từ không quẹt được.", "low"),
    ("experience_letter", "Xác nhận kinh nghiệm 3 năm", "Cần cho hồ sơ chuyển nhượng nội bộ.", "medium"),
    ("salary_certificate", "Xác nhận lương cho bảo hiểm nhân thọ", "Công ty bảo hiểm yêu cầu.", "medium"),
    ("other", "Đề nghị sửa tên trên hệ thống", "Tên trên Portal sai dấu, cần chỉnh lại.", "low"),
    ("employment_verification", "Xác nhận công tác – Visa Hàn Quốc", "Cần xác nhận công tác cho visa C-3.", "high"),
]

# ════════════════════════════════════════════════════════════
# CHAT CONVERSATIONS
# ════════════════════════════════════════════════════════════
CHAT_CONVERSATIONS = [
    {
        "title": "Hỏi về chính sách nghỉ phép",
        "messages": [
            ("user", "Tôi muốn hỏi về chính sách nghỉ phép năm. Mỗi nhân viên được bao nhiêu ngày?"),
            ("assistant", "Theo chính sách Lumina:\n- Nghỉ phép năm: 12 ngày\n- Nghỉ ốm: 30 ngày (có giấy BS)\n- Nghỉ việc riêng: 3 ngày\n- Nhân viên >5 năm: thêm 2 ngày.\n\nBạn cần biết thêm gì không?"),
            ("user", "Quy trình xin nghỉ?"),
            ("assistant", "1. Vào Cổng thông tin > Yêu cầu Nghỉ phép > Tạo đơn mới\n2. Chọn loại, ngày bắt đầu/kết thúc, lý do\n3. Đơn gửi quản lý trực tiếp\n4. Chờ phê duyệt (2 ngày làm việc)\n\nLưu ý: gửi trước ≥3 ngày; >3 ngày nghỉ gửi trước 2 tuần."),
        ],
    },
    {
        "title": "Hỏi về phúc lợi bảo hiểm",
        "messages": [
            ("user", "Công ty có bảo hiểm gì cho nhân viên?"),
            ("assistant", "Lumina cung cấp:\n1. BHXH + BHYT + BHTN (bắt buộc)\n2. Bảo hiểm sức khỏe Premium: 200 triệu/năm\n3. Bảo hiểm tai nạn 24/7: 500 triệu\n4. Bảo hiểm nhân thọ: 12 tháng lương\n\nBạn cần chi tiết gói nào?"),
        ],
    },
    {
        "title": "Hỏi chính sách làm việc từ xa",
        "messages": [
            ("user", "Chính sách WFH hiện tại thế nào?"),
            ("assistant", "Hybrid Work 2026:\n- WFH tối đa 3 ngày/tuần\n- Bắt buộc có mặt: Thứ Ba & Thứ Năm\n- Internet ≥20 Mbps, camera bật khi họp\n- Đăng ký trước 17:00 Thứ Sáu mỗi tuần."),
        ],
    },
    {
        "title": "Đặt lại mật khẩu",
        "messages": [
            ("user", "Tôi quên mật khẩu email công ty, đặt lại cách nào?"),
            ("assistant", "Cách 1: Tự đặt lại tại password.luvina.net\nCách 2: Gọi phòng CNTT số nội bộ 9999\nCách 3: Đến phòng CNTT tầng 3 mang CMND\n\nMật khẩu mới: ≥12 ký tự, chữ hoa + thường + số + đặc biệt."),
        ],
    },
    {
        "title": "Tuyển dụng nội bộ công ty",
        "messages": [
            ("user", "Tôi muốn ứng tuyển Kỹ sư Phần mềm Cao cấp ở CNTT. Quy trình?"),
            ("assistant", "Điều kiện: ≥12 tháng tại Lumina, đánh giá ≥ Đạt yêu cầu.\nQuy trình:\n1. Gửi CV + thư ứng tuyển đến hr@luvina.net\n2. Bài kiểm tra Kỹ thuật\n3. Phỏng vấn Quản lý Tuyển dụng\n4. Phỏng vấn Hội đồng\n\nHạn: 20/04/2026. Ưu đãi: không thử việc, đào tạo 3 tháng."),
        ],
    },
]

QUICK_CHATS = [
    ("Lương tháng 3 có chưa?", "Phiếu lương tháng 3/2026 đã cập nhật trên Cổng thông tin > Phiếu lương."),
    ("WiFi văn phòng?", "WiFi: Lumina-Office / Lumina@2026\nGuest: Lumina-Guest / guest2026"),
    ("Phòng họp trống chiều nay?", "Tôi không truy cập được hệ thống đặt phòng. Xem lịch Outlook hoặc ứng dụng Nơi làm việc."),
    ("Xin giấy xác nhận công tác?", "Gửi email hr@luvina.net (họ tên, mã NV, mục đích). HR xử lý 2-3 ngày."),
    ("Cách đăng ký đào tạo?", "Cổng thông tin > Đào tạo > chọn khóa > Đăng ký. Mỗi người ≥1 kỹ thuật + 2 tuân thủ/quý."),
    ("Khi nào team building?", "Team Building Q2: 25-27/04/2026 tại Mũi Né. Đăng ký trước 10/04/2026 trên Cổng thông tin."),
]


# ═══════════════════════════════════════════════════════════
# EXECUTION FUNCTIONS
# ═══════════════════════════════════════════════════════════

def reset_data():
    """DESTRUCTIVE: wipe all seeded data."""
    print("\n⚠️  RESETTING ALL DATA …")
    ChatMessage.objects.all().delete()
    ChatSession.objects.all().delete()
    DocumentChunk.objects.all().delete()
    DocumentMetadata.objects.all().delete()
    Document.objects.all().delete()
    AdministrativeRequest.objects.all().delete()
    Payslip.objects.all().delete()
    LeaveRequest.objects.all().delete()
    HRAnnouncement.objects.all().delete()
    EmployeeProfile.objects.all().delete()
    User.objects.all().delete()
    print("  ✅ All data wiped.\n")


def create_users():
    print("\n" + "=" * 60)
    print("👤 CREATING USERS")
    print("=" * 60)
    users = {}
    for data in USERS_DATA:
        uname = data["username"]
        user, created = User.objects.get_or_create(
            username=uname,
            defaults={
                "email": data["email"],
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "role": data["role"],
                "is_staff": data["role"] in ("admin", "hr"),
                "is_superuser": data["role"] == "admin",
            },
        )
        if created:
            pw = PASSWORD_ADMIN if data["role"] == "admin" else PASSWORD_HR if data["role"] == "hr" else PASSWORD_DEFAULT
            user.set_password(pw)
            user.save()
            print(f"  ✅ {uname} ({data['role']})")
        else:
            print(f"  ⏭  {uname} exists")
        users[uname] = user
    print(f"  Total: {len(users)} users")
    return users


def create_profiles(users):
    print("\n" + "=" * 60)
    print("🏢 CREATING EMPLOYEE PROFILES (+manager hierarchy)")
    print("=" * 60)

    profiles = {}   # username → profile
    idx = 1

    # Pass 1: create profiles (manager=None)
    for uname, (dept, desig) in PROFILE_ASSIGNMENTS.items():
        user = users.get(uname)
        if not user:
            continue
        profile, created = EmployeeProfile.objects.get_or_create(
            user=user,
            defaults={
                "department": dept,
                "designation": desig,
                "employee_id": f"LMN-{idx:04d}",
                "date_of_joining": date(2022, 1, 1) + timedelta(days=random.randint(0, 1200)),
                "date_of_birth": date(1980, 1, 1) + timedelta(days=random.randint(0, 7300)),
                "address": f"{random.randint(1,999)} {random.choice(STREETS)} Street",
                "city": (c := random.choice(CITIES))[0],
                "state": c[1],
                "country": c[2],
                "postal_code": f"{random.randint(10000,99999)}",
                "emergency_contact": f"{random.choice(['Nguyen','Tran','Le','Pham'])} {random.choice(['Van','Thi'])} {random.choice(['An','Binh','Chi','Dung','Hoa'])}",
                "emergency_contact_phone": f"+84{random.randint(900000000,999999999)}",
                "bank_name": random.choice(BANK_NAMES),
                "bank_account_number": ''.join(random.choices(string.digits, k=12)),
                "bank_branch": f"{random.choice(CITIES)[0]} Branch",
                "bio": f"{desig} tại phòng {dept.upper()} với nhiều năm kinh nghiệm và đam mê trong lĩnh vực chuyên môn.",
            },
        )
        if created:
            print(f"  ✅ {uname}: {desig} @ {dept}")
        else:
            print(f"  ⏭  {uname} profile exists")
        profiles[uname] = profile
        idx += 1

    # Pass 2: set managers
    updated = 0
    for uname, mgr_uname in MANAGER_MAP.items():
        if uname in profiles and mgr_uname in profiles:
            p = profiles[uname]
            if p.manager_id != profiles[mgr_uname].pk:
                p.manager = profiles[mgr_uname]
                p.save(update_fields=['manager'])
                updated += 1
    print(f"  🔗 Manager links set: {updated}")
    return profiles


def create_announcements(users):
    print("\n" + "=" * 60)
    print("📢 CREATING ANNOUNCEMENTS")
    print("=" * 60)
    creators = [u for u in users.values() if u.role in ('admin', 'hr')]
    for i, data in enumerate(ANNOUNCEMENTS_DATA):
        if HRAnnouncement.objects.filter(title=data["title"]).exists():
            print(f"  ⏭  {data['title'][:50]}…")
            continue
        pub_date = NOW - timedelta(days=data["days_ago"])
        HRAnnouncement.objects.create(
            title=data["title"],
            content=data["content"],
            status=data["status"],
            created_by=creators[i % len(creators)],
            published_at=pub_date if data["status"] == "published" else None,
            expires_at=pub_date + timedelta(days=120) if data["status"] == "published" else None,
        )
        print(f"  ✅ {data['title'][:50]}…")
    print(f"  Total: {HRAnnouncement.objects.count()}")


def create_leave_requests(users):
    print("\n" + "=" * 60)
    print("🏖  CREATING LEAVE REQUESTS (60 days)")
    print("=" * 60)
    employees = [u for u in users.values() if u.role == 'employee']
    hrs = [u for u in users.values() if u.role in ('admin', 'hr')]
    leave_types = ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity']
    status_pool = (['approved'] * 45 + ['pending'] * 25 + ['rejected'] * 15 + ['cancelled'] * 15)

    if LeaveRequest.objects.count() > 100:
        print("  ⏭  Already have >100 leave requests, skipping.")
        return

    count = 0
    for emp in employees:
        num = random.randint(3, 8)
        for _ in range(num):
            start = TODAY - timedelta(days=random.randint(0, 90))
            dur = random.randint(1, 5)
            end = start + timedelta(days=dur)
            st = random.choice(status_pool)
            lt = random.choice(leave_types[:4])  # skip maternity/paternity mostly
            if random.random() < 0.03:
                lt = random.choice(['maternity', 'paternity'])

            lr = LeaveRequest(
                employee=emp,
                leave_type=lt,
                start_date=start,
                end_date=end,
                reason=random.choice(LEAVE_REASONS),
                status=st,
            )
            if st == 'approved':
                a = random.choice(hrs)
                lr.approved_by = a
                lr.approval_date = NOW - timedelta(days=random.randint(1, 14))
                lr.approval_comment = random.choice([
                    "Đã duyệt. Nghỉ ngơi vui vế!", "Đã phê duyệt.", "Đồng ý – bàn giao công việc nhé.",
                    "Đã duyệt – chúc vui!", "Đồng ý.",
                ])
            elif st == 'rejected':
                a = random.choice(hrs)
                lr.approved_by = a
                lr.approval_date = NOW - timedelta(days=random.randint(1, 14))
                lr.approval_comment = random.choice([
                    "Trùng lịch dự án, chọn ngày khác.", "Team cần bạn tuần đó.",
                    "Quá nhiều người nghỉ cùng lúc.",
                ])
            lr.save()
            count += 1
    print(f"  ✅ {count} leave requests for {len(employees)} employees")


def create_payslips(users):
    print("\n" + "=" * 60)
    print("💰 CREATING PAYSLIPS (9 months)")
    print("=" * 60)
    employees = [u for u in users.values() if u.role == 'employee']
    admin_user = next(u for u in users.values() if u.role == 'admin')

    salary_ranges = {
        'it': (18_000_000, 50_000_000),
        'hr': (15_000_000, 38_000_000),
        'sales': (14_000_000, 42_000_000),
        'marketing': (14_000_000, 38_000_000),
        'operations': (13_000_000, 35_000_000),
        'finance': (16_000_000, 45_000_000),
    }

    months = [date(2025, m, 1) for m in range(7, 13)] + [date(2026, m, 1) for m in range(1, 4)]
    count = 0

    for emp in employees:
        try:
            profile = EmployeeProfile.objects.get(user=emp)
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
            other_a = Decimal(str(random.randint(500_000, 3_000_000)))
            pf = (basic * Decimal('0.08')).quantize(Decimal('1'))
            tds = (basic * Decimal(str(random.uniform(0.05, 0.15)))).quantize(Decimal('1'))
            ins = Decimal(str(random.choice([500_000, 700_000, 1_000_000])))
            other_d = Decimal(str(random.randint(0, 500_000)))

            st = 'distributed' if month < date(2026, 3, 1) else 'finalized' if month == date(2026, 3, 1) else 'draft'
            Payslip.objects.create(
                employee=emp, month_year=month, basic_salary=basic,
                house_rent_allowance=hra, dearness_allowance=da, other_allowances=other_a,
                provident_fund=pf, tax_deducted_at_source=tds, insurance=ins, other_deductions=other_d,
                status=st, created_by=admin_user,
            )
            count += 1
    print(f"  ✅ {count} payslips")


def create_admin_requests(users, profiles):
    print("\n" + "=" * 60)
    print("📋 CREATING ADMINISTRATIVE REQUESTS")
    print("=" * 60)
    if AdministrativeRequest.objects.count() > 0:
        print("  ⏭  Already have admin requests, skipping.")
        return

    employees = [u for u in users.values() if u.role == 'employee']
    hrs = [u for u in users.values() if u.role in ('admin', 'hr')]
    statuses_pool = ['pending'] * 30 + ['in_progress'] * 15 + ['approved'] * 20 + ['completed'] * 25 + ['rejected'] * 10

    count = 0
    for rtype, title, desc, priority in ADMIN_REQUEST_DATA:
        emp = random.choice(employees)
        st = random.choice(statuses_pool)
        ar = AdministrativeRequest(
            employee=emp,
            request_type=rtype,
            title=title,
            description=desc,
            priority=priority,
            status=st,
        )
        if st in ('approved', 'completed', 'rejected'):
            ar.processed_by = random.choice(hrs)
            ar.admin_comment = random.choice([
                "Đã xử lý, vui lòng nhận tại HR.", "Hoàn tất.",
                "Đã gửi qua email.", "Từ chối – thiếu giấy tờ.",
                "Đã duyệt – liên hệ HR nhận kết quả.",
            ])
            if st == 'completed':
                ar.completed_at = NOW - timedelta(days=random.randint(1, 10))
        ar.save()
        count += 1

    # Generate extra random requests from employees
    extra_types = ['employment_verification', 'card_replacement', 'salary_certificate', 'experience_letter', 'other']
    extra_titles = {
        'employment_verification': "Xác nhận công tác",
        'card_replacement': "Cấp lại thẻ nhân viên",
        'salary_certificate': "Giấy xác nhận lương",
        'experience_letter': "Giấy xác nhận kinh nghiệm",
        'other': "Yêu cầu hành chính khác",
    }
    for emp in random.sample(employees, min(25, len(employees))):
        rtype = random.choice(extra_types)
        st = random.choice(statuses_pool)
        ar = AdministrativeRequest(
            employee=emp,
            request_type=rtype,
            title=f"{extra_titles[rtype]} – {emp.first_name} {emp.last_name}",
            description=f"Nhân viên {emp.get_full_name()} yêu cầu {extra_titles[rtype].lower()}.",
            priority=random.choice(['low', 'medium', 'high']),
            status=st,
        )
        if st in ('approved', 'completed', 'rejected'):
            ar.processed_by = random.choice(hrs)
            ar.admin_comment = "Đã xử lý." if st != 'rejected' else "Từ chối – hồ sơ chưa đầy đủ."
            if st == 'completed':
                ar.completed_at = NOW - timedelta(days=random.randint(1, 10))
        ar.save()
        count += 1

    print(f"  ✅ {count} administrative requests")


def create_documents(users):
    print("\n" + "=" * 60)
    print("📄 CREATING DOCUMENTS (+chunks)")
    print("=" * 60)
    uploaders = [u for u in users.values() if u.role in ('admin', 'hr')]

    for data in DOCUMENTS_DATA:
        if Document.objects.filter(title=data["title"]).exists():
            print(f"  ⏭  {data['title'][:50]}")
            continue
        up = random.choice(uploaders)
        doc = Document.objects.create(
            title=data["title"],
            description=data["description"],
            document_type=data["document_type"],
            file=f"documents/2026/03/{data['title'].lower().replace(' ','_')}.{data['file_type']}",
            file_size=data["file_size"],
            file_type=data["file_type"],
            uploaded_by=up,
            status="indexed",
            is_indexed=True,
            extracted_text=f"[Nội dung {data['title']}] {data['description']}",
            indexed_at=NOW - timedelta(days=random.randint(1, 30)),
        )
        DocumentMetadata.objects.create(
            document=doc,
            author=f"{up.first_name} {up.last_name}",
            keywords=", ".join(data["title"].lower().split()[:5]),
            language="en",
            page_count=random.randint(5, 50),
            word_count=random.randint(2000, 15000),
            is_confidential=random.random() < 0.2,
            tags=f"{data['document_type']}, hr, {random.choice(['important','internal','public'])}",
        )
        for ci in range(random.randint(3, 8)):
            DocumentChunk.objects.create(
                document=doc, chunk_index=ci,
                content=f"[Phần {ci}] {data['title']}: {data['description']} – Mục {ci+1}.",
                token_count=random.randint(100, 500),
            )
        print(f"  ✅ {data['title']}")
    print(f"  Total docs: {Document.objects.count()}")


def create_chat_sessions(users):
    print("\n" + "=" * 60)
    print("💬 CREATING CHAT SESSIONS")
    print("=" * 60)
    employees = [u for u in users.values() if u.role == 'employee']

    if ChatSession.objects.count() > 5:
        print("  ⏭  Already have chat sessions, skipping.")
        return

    cs = cm = 0
    for conv in CHAT_CONVERSATIONS:
        user = random.choice(employees)
        session = ChatSession.objects.create(user=user, title=conv["title"], is_active=True)
        cs += 1
        for role, content in conv["messages"]:
            ChatMessage.objects.create(
                session=session, role=role, content=content,
                tokens_used=random.randint(80, 400) if role == "assistant" else None,
            )
            cm += 1

    for q, a in QUICK_CHATS:
        user = random.choice(employees)
        session = ChatSession.objects.create(user=user, title=q[:50], is_active=True)
        cs += 1
        ChatMessage.objects.create(session=session, role="user", content=q)
        ChatMessage.objects.create(session=session, role="assistant", content=a, tokens_used=random.randint(50, 250))
        cm += 2

    print(f"  ✅ {cs} sessions, {cm} messages")


def print_summary():
    print("\n" + "=" * 60)
    print("📊 DATABASE SUMMARY")
    print("=" * 60)
    print(f"  Users:              {User.objects.count()}")
    print(f"  Employee Profiles:  {EmployeeProfile.objects.count()}")
    print(f"  Announcements:      {HRAnnouncement.objects.count()}")
    print(f"  Leave Requests:     {LeaveRequest.objects.count()}")
    print(f"  Payslips:           {Payslip.objects.count()}")
    print(f"  Admin Requests:     {AdministrativeRequest.objects.count()}")
    print(f"  Documents:          {Document.objects.count()}")
    print(f"  Document Chunks:    {DocumentChunk.objects.count()}")
    print(f"  Chat Sessions:      {ChatSession.objects.count()}")
    print(f"  Chat Messages:      {ChatMessage.objects.count()}")

    print("\n  📂 Dept breakdown:")
    for dept in DEPARTMENTS:
        c = EmployeeProfile.objects.filter(department=dept).count()
        mgrs = EmployeeProfile.objects.filter(department=dept, direct_reports__isnull=False).distinct().count()
        print(f"     {dept.upper():12s}: {c:3d} employees, {mgrs} managers")

    print("\n  🔑 Login credentials:")
    print("     Admin:    admin / Admin@123456")
    print("     HR:       hr_manager / Hr@123456")
    print("     Employee: john_doe / Employee@123")
    print("     (All employees share: Employee@123)")
    print("=" * 60)


# ═══════════════════════════════════════════════════════════
if __name__ == "__main__":
    do_reset = '--reset' in sys.argv

    print("\n🚀 Employee Portal – Comprehensive Seed Script")
    print(f"   Date: {TODAY}  |  Reset: {do_reset}\n")

    if do_reset:
        reset_data()

    with transaction.atomic():
        users = create_users()
        profiles = create_profiles(users)
        create_announcements(users)
        create_leave_requests(users)
        create_payslips(users)
        create_admin_requests(users, profiles)
        create_documents(users)
        create_chat_sessions(users)

    print_summary()
    print("\n✨ Seed completed!\n")
