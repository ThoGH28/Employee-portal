import React, { useState } from 'react'
import { Collapse, Tag, Typography, Input, Divider, Badge } from 'antd'
import {
    DashboardOutlined,
    SolutionOutlined,
    DollarOutlined,
    FileProtectOutlined,
    ApartmentOutlined,
    FileTextOutlined,
    BarChartOutlined,
    TeamOutlined,
    RobotOutlined,
    SearchOutlined,
    QuestionCircleOutlined,
    BookOutlined,
    BulbOutlined,
    SafetyCertificateOutlined,
    DownloadOutlined,
    EditOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons'
import styles from './UserManual.module.css'

const { Title, Paragraph, Text } = Typography

const PlusIcon = () => <span>+</span>

interface ManualSection {
    id: string
    icon: React.ReactNode
    title: string
    color: string
    badge?: string
    items: {
        title: string
        content: React.ReactNode
    }[]
}

const sections: ManualSection[] = [
    {
        id: 'dashboard',
        icon: <DashboardOutlined />,
        title: 'Trang chủ',
        color: '#6366f1',
        items: [
            {
                title: 'Tổng quan trang chủ',
                content: (
                    <>
                        <Paragraph>
                            Trang chủ hiển thị tóm tắt thông tin quan trọng của nhân viên, bao gồm:
                        </Paragraph>
                        <ul>
                            <li><b>Thẻ thống kê:</b> Số ngày phép còn lại, số yêu cầu đang chờ, thông báo mới và lịch làm việc.</li>
                            <li><b>Thông báo:</b> Danh sách các thông báo nội bộ mới nhất từ công ty.</li>
                            <li><b>Tạo yêu cầu nhanh:</b> Nút <Tag color="blue">+ Tạo yêu cầu</Tag> để tạo đơn xin nghỉ phép ngay từ trang chủ.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Tạo yêu cầu nghỉ phép',
                content: (
                    <>
                        <Paragraph>
                            Nhấn nút <Tag color="blue"><PlusIcon /> Tạo yêu cầu</Tag> trên trang chủ hoặc vào mục <b>Yêu cầu nghỉ phép</b> từ menu.
                        </Paragraph>
                        <ol>
                            <li>Chọn <b>Loại nghỉ phép</b> (Nghỉ phép năm, Nghỉ ốm, Nghỉ không lương…).</li>
                            <li>Chọn <b>Ngày bắt đầu</b> và <b>Ngày kết thúc</b>.</li>
                            <li>Nhập <b>Lý do</b> nghỉ phép.</li>
                            <li>Nhấn <Tag color="blue">Gửi yêu cầu</Tag> để hoàn tất.</li>
                        </ol>
                        <Paragraph type="secondary">
                            <BulbOutlined /> Sau khi gửi, yêu cầu sẽ chờ phê duyệt từ quản lý của bạn.
                        </Paragraph>
                    </>
                ),
            },
        ],
    },
    {
        id: 'profile',
        icon: <SolutionOutlined />,
        title: 'Hồ sơ cá nhân',
        color: '#0ea5e9',
        items: [
            {
                title: 'Xem thông tin cá nhân',
                content: (
                    <>
                        <Paragraph>
                            Tại mục <b>Hồ sơ cá nhân</b>, bạn có thể xem toàn bộ thông tin:
                        </Paragraph>
                        <ul>
                            <li>Họ tên, số điện thoại, email liên lạc.</li>
                            <li>Chức vụ, phòng ban, ngày vào công ty.</li>
                            <li>Ảnh đại diện hiển thị trên hệ thống.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Cập nhật thông tin',
                content: (
                    <>
                        <Paragraph>
                            Nhấn nút <Tag icon={<EditOutlined />} color="orange">Chỉnh sửa</Tag> để cập nhật:
                        </Paragraph>
                        <ul>
                            <li><b>Số điện thoại</b> cá nhân.</li>
                            <li><b>Địa chỉ</b> liên lạc.</li>
                            <li><b>Tài khoản ngân hàng</b> nhận lương.</li>
                        </ul>
                        <Paragraph type="warning">
                            <SafetyCertificateOutlined /> Một số thông tin như họ tên, chức vụ chỉ có thể thay đổi bởi bộ phận HR.
                        </Paragraph>
                    </>
                ),
            },
            {
                title: 'Đổi mật khẩu',
                content: (
                    <ol>
                        <li>Cuộn xuống phần <b>Bảo mật tài khoản</b>.</li>
                        <li>Nhập <b>Mật khẩu hiện tại</b>.</li>
                        <li>Nhập <b>Mật khẩu mới</b> (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số).</li>
                        <li>Xác nhận lại mật khẩu mới và nhấn <Tag color="blue">Lưu thay đổi</Tag>.</li>
                    </ol>
                ),
            },
        ],
    },
    {
        id: 'payslips',
        icon: <DollarOutlined />,
        title: 'Phiếu lương',
        color: '#10b981',
        items: [
            {
                title: 'Xem phiếu lương',
                content: (
                    <>
                        <Paragraph>
                            Mục <b>Phiếu lương</b> hiển thị danh sách tất cả phiếu lương theo từng tháng.
                        </Paragraph>
                        <ul>
                            <li>Chọn <b>năm</b> để lọc phiếu lương theo năm.</li>
                            <li>Nhấn vào dòng phiếu lương để xem chi tiết: lương cơ bản, phụ cấp, khấu trừ và lương thực nhận.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Tải phiếu lương',
                content: (
                    <>
                        <Paragraph>
                            Nhấn nút <Tag icon={<DownloadOutlined />} color="green">Tải PDF</Tag> trên phiếu lương để tải về máy tính.
                        </Paragraph>
                        <Paragraph type="secondary">
                            File PDF được bảo mật và chỉ dành cho nhân viên sở hữu phiếu lương đó.
                        </Paragraph>
                    </>
                ),
            },
        ],
    },
    {
        id: 'requests',
        icon: <FileProtectOutlined />,
        title: 'Yêu cầu',
        color: '#f59e0b',
        badge: 'Nhân viên & Quản lý',
        items: [
            {
                title: 'Danh sách yêu cầu của tôi',
                content: (
                    <>
                        <Paragraph>
                            Tại tab <b>Yêu cầu của tôi</b>, bạn thấy toàn bộ yêu cầu đã gửi với trạng thái:
                        </Paragraph>
                        <ul>
                            <li><Tag color="gold">Chờ duyệt</Tag> — Yêu cầu đang chờ quản lý xem xét.</li>
                            <li><Tag icon={<CheckCircleOutlined />} color="green">Đã duyệt</Tag> — Yêu cầu được chấp thuận.</li>
                            <li><Tag icon={<CloseCircleOutlined />} color="red">Từ chối</Tag> — Yêu cầu bị từ chối (có thể xem lý do).</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Phê duyệt yêu cầu (Quản lý)',
                content: (
                    <>
                        <Paragraph>
                            Người dùng có vai trò <Tag color="volcano">Quản lý</Tag> hoặc <Tag color="red">Admin</Tag> có thể:
                        </Paragraph>
                        <ol>
                            <li>Chọn tab <b>Chờ duyệt</b> để xem các yêu cầu cần xử lý.</li>
                            <li>Nhấn <Tag icon={<EyeOutlined />} color="blue">Xem</Tag> để xem chi tiết.</li>
                            <li>Nhấn <Tag icon={<CheckCircleOutlined />} color="green">Duyệt</Tag> hoặc <Tag icon={<CloseCircleOutlined />} color="red">Từ chối</Tag> và nhập lý do nếu cần.</li>
                        </ol>
                    </>
                ),
            },
        ],
    },
    {
        id: 'org-chart',
        icon: <ApartmentOutlined />,
        title: 'Sơ đồ tổ chức',
        color: '#8b5cf6',
        items: [
            {
                title: 'Xem sơ đồ tổ chức',
                content: (
                    <>
                        <Paragraph>
                            Sơ đồ tổ chức hiển thị cấu trúc phòng ban và quan hệ báo cáo giữa các nhân viên.
                        </Paragraph>
                        <ul>
                            <li>Nhấn vào <b>nút mũi tên</b> (+/−) để mở rộng hoặc thu gọn từng nhánh.</li>
                            <li>Nhấn vào <b>thẻ nhân viên</b> để xem thông tin chi tiết.</li>
                            <li>Dùng nút <b>Thu gọn tất cả / Mở rộng tất cả</b> để quản lý toàn bộ sơ đồ.</li>
                        </ul>
                    </>
                ),
            },
        ],
    },
    {
        id: 'documents',
        icon: <FileTextOutlined />,
        title: 'Tài liệu',
        color: '#ec4899',
        items: [
            {
                title: 'Tìm kiếm tài liệu',
                content: (
                    <>
                        <Paragraph>
                            Sử dụng thanh tìm kiếm <Tag icon={<SearchOutlined />}>Tìm kiếm</Tag> để tra cứu tài liệu nội bộ.
                        </Paragraph>
                        <ul>
                            <li>Nhập từ khóa liên quan (tên tài liệu, nội dung, chủ đề).</li>
                            <li>Nhấn <b>Enter</b> hoặc nút <b>Tìm kiếm</b>.</li>
                            <li>Kết quả hiển thị kèm đoạn trích nội dung liên quan.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Tải tài liệu',
                content: (
                    <Paragraph>
                        Nhấn biểu tượng <Tag icon={<DownloadOutlined />} color="green">Tải về</Tag> bên cạnh tài liệu để tải file về máy. Một số tài liệu có thể yêu cầu quyền truy cập từ bộ phận IT.
                    </Paragraph>
                ),
            },
        ],
    },
    {
        id: 'reports',
        icon: <BarChartOutlined />,
        title: 'Báo cáo',
        color: '#14b8a6',
        badge: 'Quản lý & HR',
        items: [
            {
                title: 'Xem báo cáo',
                content: (
                    <>
                        <Paragraph>
                            Mục <b>Báo cáo</b> chỉ hiển thị với người dùng có vai trò <Tag color="orange">Quản lý</Tag>, <Tag color="red">Admin</Tag> hoặc <Tag color="purple">HR</Tag>.
                        </Paragraph>
                        <ul>
                            <li><b>Báo cáo nghỉ phép:</b> Tổng hợp số ngày nghỉ theo phòng ban và nhân viên.</li>
                            <li><b>Báo cáo lương:</b> Tổng quỹ lương theo tháng/quý/năm.</li>
                            <li><b>Báo cáo nhân sự:</b> Biến động nhân sự, tuyển dụng và nghỉ việc.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Xuất báo cáo',
                content: (
                    <ol>
                        <li>Chọn loại báo cáo và khoảng thời gian.</li>
                        <li>Nhấn <Tag icon={<DownloadOutlined />} color="green">Xuất Excel</Tag> hoặc <Tag icon={<DownloadOutlined />} color="red">Xuất PDF</Tag>.</li>
                        <li>File sẽ được tải về máy tự động.</li>
                    </ol>
                ),
            },
        ],
    },
    {
        id: 'admin',
        icon: <TeamOutlined />,
        title: 'Quản trị',
        color: '#ef4444',
        badge: 'Chỉ Admin',
        items: [
            {
                title: 'Quản lý nhân viên',
                content: (
                    <>
                        <Paragraph>
                            Tab <b>Nhân viên</b> trong trang Quản trị cho phép:
                        </Paragraph>
                        <ul>
                            <li>Xem, thêm, chỉnh sửa và vô hiệu hóa tài khoản nhân viên.</li>
                            <li>Phân công phòng ban và chức vụ.</li>
                            <li>Đặt lại mật khẩu tài khoản.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Quản lý phiếu lương',
                content: (
                    <>
                        <Paragraph>
                            Tab <b>Phiếu lương</b> trong Quản trị:
                        </Paragraph>
                        <ul>
                            <li>Tạo phiếu lương hàng tháng cho từng nhân viên.</li>
                            <li>Nhập lương cơ bản, phụ cấp, khấu trừ bảo hiểm và thuế.</li>
                            <li>Đánh dấu phiếu lương đã thanh toán.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Quản lý tài liệu',
                content: (
                    <>
                        <Paragraph>
                            Tab <b>Tài liệu</b> trong Quản trị:
                        </Paragraph>
                        <ul>
                            <li>Upload tài liệu nội bộ (PDF, DOCX, XLSX…).</li>
                            <li>Thiết lập quyền truy cập theo vai trò.</li>
                            <li>Xóa hoặc cập nhật tài liệu cũ.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Phân quyền người dùng',
                content: (
                    <>
                        <Paragraph>Hệ thống gồm các vai trò:</Paragraph>
                        <ul>
                            <li><Tag color="red">Admin</Tag> — Toàn quyền quản trị hệ thống.</li>
                            <li><Tag color="orange">Manager</Tag> — Quản lý phòng ban, duyệt yêu cầu, xem báo cáo.</li>
                            <li><Tag color="purple">HR</Tag> — Quản lý nhân sự, phiếu lương và báo cáo.</li>
                            <li><Tag color="blue">Employee</Tag> — Xem thông tin cá nhân, gửi yêu cầu và tra cứu tài liệu.</li>
                        </ul>
                    </>
                ),
            },
        ],
    },
    {
        id: 'chatbot',
        icon: <RobotOutlined />,
        title: 'Trợ lý AI',
        color: '#6366f1',
        badge: 'Tính năng mới',
        items: [
            {
                title: 'Sử dụng chatbot',
                content: (
                    <>
                        <Paragraph>
                            Trợ lý AI (chatbot) có thể giúp bạn tra cứu thông tin nhanh chóng mà không cần điều hướng qua các menu.
                        </Paragraph>
                        <ul>
                            <li>Nhấn biểu tượng <Tag icon={<RobotOutlined />} color="blue">Chat</Tag> ở góc phải màn hình để mở chatbot.</li>
                            <li>Đặt câu hỏi bằng tiếng Việt hoặc tiếng Anh về chính sách công ty, quy trình nghỉ phép, thông tin nhân viên…</li>
                            <li>Chatbot sẽ tìm kiếm trong tài liệu nội bộ và trả lời kèm nguồn tham khảo.</li>
                        </ul>
                    </>
                ),
            },
            {
                title: 'Ví dụ câu hỏi',
                content: (
                    <ul>
                        <li>"Chính sách nghỉ phép năm của công ty là gì?"</li>
                        <li>"Quy trình xin thôi việc như thế nào?"</li>
                        <li>"Các khoản phụ cấp xe tôi được hưởng?"</li>
                        <li>"Liên hệ bộ phận IT ở đâu?"</li>
                    </ul>
                ),
            },
        ],
    },
]

export const UserManual: React.FC = () => {
    const [searchText, setSearchText] = useState('')
    const [activeKeys, setActiveKeys] = useState<string[]>([])

    const filtered = sections
        .map((section) => ({
            ...section,
            items: section.items.filter(
                (item) =>
                    !searchText ||
                    item.title.toLowerCase().includes(searchText.toLowerCase())
            ),
        }))
        .filter((section) => section.items.length > 0)

    const handleSearch = (value: string) => {
        setSearchText(value)
        if (value) {
            setActiveKeys(sections.map((s) => s.id))
        } else {
            setActiveKeys([])
        }
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <BookOutlined />
                    </div>
                    <div>
                        <Title level={2} style={{ color: '#fff', margin: 0 }}>
                            Hướng dẫn sử dụng
                        </Title>
                        <Paragraph style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: 15 }}>
                            Tìm hiểu cách sử dụng tất cả tính năng của Cổng thông tin nhân viên
                        </Paragraph>
                    </div>
                </div>
                <div className={styles.searchWrap}>
                    <Input
                        size="large"
                        placeholder="Tìm kiếm hướng dẫn..."
                        prefix={<SearchOutlined style={{ color: '#6366f1' }} />}
                        allowClear
                        className={styles.searchInput}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Quick nav */}
            <div className={styles.quickNav}>
                <Text type="secondary" style={{ fontSize: 13, marginBottom: 10, display: 'block' }}>
                    <QuestionCircleOutlined /> Chuyển nhanh đến:
                </Text>
                <div className={styles.navTags}>
                    {sections.map((s) => (
                        <Tag
                            key={s.id}
                            className={styles.navTag}
                            style={{ borderColor: s.color, color: s.color, cursor: 'pointer' }}
                            onClick={() => {
                                const el = document.getElementById(`section-${s.id}`)
                                el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }}
                        >
                            <span style={{ marginRight: 4 }}>{s.icon}</span>
                            {s.title}
                        </Tag>
                    ))}
                </div>
            </div>

            {/* Sections */}
            <div className={styles.sectionsWrap}>
                {filtered.length === 0 ? (
                    <div className={styles.empty}>
                        <QuestionCircleOutlined style={{ fontSize: 48, color: '#94a3b8' }} />
                        <Paragraph style={{ color: '#64748b', marginTop: 12 }}>
                            Không tìm thấy nội dung phù hợp với "<b>{searchText}</b>"
                        </Paragraph>
                    </div>
                ) : (
                    filtered.map((section) => (
                        <div key={section.id} id={`section-${section.id}`} className={styles.section}>
                            {/* Section heading */}
                            <div className={styles.sectionHeader} style={{ borderLeftColor: section.color }}>
                                <span className={styles.sectionIconWrap} style={{ backgroundColor: `${section.color}18`, color: section.color }}>
                                    {section.icon}
                                </span>
                                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                                    {section.title}
                                </Title>
                                {section.badge && (
                                    <Badge
                                        count={section.badge}
                                        style={{ backgroundColor: section.color, fontSize: 11 }}
                                    />
                                )}
                            </div>

                            <Collapse
                                ghost
                                activeKey={activeKeys}
                                onChange={(keys) => setActiveKeys(keys as string[])}
                                className={styles.collapse}
                                items={section.items.map((item, idx) => ({
                                    key: `${section.id}-${idx}`,
                                    label: (
                                        <Text strong style={{ fontSize: 14, color: '#334155' }}>
                                            {item.title}
                                        </Text>
                                    ),
                                    children: (
                                        <div className={styles.panelContent}>
                                            <Typography>{item.content}</Typography>
                                        </div>
                                    ),
                                }))}
                            />

                            <Divider style={{ margin: '8px 0 0' }} />
                        </div>
                    ))
                )}
            </div>

            {/* Footer tip */}
            <div className={styles.footer}>
                <BulbOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
                <Text type="secondary">
                    Cần hỗ trợ thêm? Liên hệ bộ phận IT qua email <Text strong>it-support@company.com</Text> hoặc sử dụng <Text strong>Trợ lý AI</Text> ở góc phải màn hình.
                </Text>
            </div>
        </div>
    )
}
