import React, { useState } from 'react'
import { Row, Col, Spin, Empty, Modal, Form, Input, DatePicker, Button, Select, message } from 'antd'
import {
    CheckCircleOutlined,
    TeamOutlined,
    ClockCircleOutlined,
    MailOutlined,
    CalendarOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useEmployeeProfile, useLeaveBalance, useAnnouncements, useCreateLeaveRequest } from '../../shared/hooks/queries'
import { formatDate } from '../../shared/utils/helpers'
import type { LeaveRequestPayload } from '../../shared/types'
import styles from './Dashboard.module.css'

/* ── Stat Card ──────────────────────────────────────────────────── */
interface StatCardProps {
    label: string
    value: React.ReactNode
    icon: React.ReactNode
    color?: string
    bgLight?: string
    accentA?: string
    accentB?: string
    glow?: string
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    color = 'var(--brand-black)',
    bgLight,
    accentA,
    accentB,
    glow,
}) => (
    <div
        className={styles.statCard}
        style={{
            '--card-accent-a': accentA || color,
            '--card-accent-b': accentB || color,
            '--card-glow': glow || `${color}18`,
        } as React.CSSProperties}
    >
        <div
            className={styles.statIconWrap}
            style={{
                backgroundColor: bgLight || `${color}14`,
                color,
            }}
        >
            {icon}
        </div>
        <p className={styles.statLabel}>{label}</p>
        <h3 className={styles.statValue}>{value}</h3>
    </div>
)

/* ── Announcement Card ──────────────────────────────────────────── */
const AnnouncementCard: React.FC<{ announcement: any; onClick: () => void }> = ({ announcement, onClick }) => (
    <div className={styles.announcementItem} onClick={onClick} style={{ cursor: 'pointer' }}>
        <p className={styles.announcementTitle}>{announcement.title}</p>
        <p className={styles.announcementBody}>
            {announcement.content?.substring(0, 110)}…
        </p>
        <span className={styles.announcementDate}>{formatDate(announcement.created_at)}</span>
    </div>
)

/* ── Dashboard ──────────────────────────────────────────────────── */
export const Dashboard: React.FC = () => {
    const navigate = useNavigate()
    const [leaveModalOpen, setLeaveModalOpen] = useState(false)
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null)
    const [form] = Form.useForm()
    const { data: profile, isLoading: profileLoading } = useEmployeeProfile()
    const { data: leaveBalance, isLoading: leaveLoading } = useLeaveBalance()
    const { data: announcementsData, isLoading: announcementsLoading } = useAnnouncements()
    const { mutate: createLeave, isPending: leaveSubmitting } = useCreateLeaveRequest()

    const onLeaveSubmit = (values: any) => {
        const data: LeaveRequestPayload = {
            leave_type: values.leave_type,
            start_date: values.start_date.format('YYYY-MM-DD'),
            end_date: values.end_date.format('YYYY-MM-DD'),
            reason: values.reason,
        }
        createLeave(data, {
            onSuccess: () => {
                message.success('Gửi yêu cầu nghỉ phép thành công')
                form.resetFields()
                setLeaveModalOpen(false)
            },
            onError: (error: any) => {
                message.error(error.response?.data?.message || 'Gửi yêu cầu thất bại')
            },
        })
    }

    const usedPct = leaveBalance
        ? Math.min(((leaveBalance.used ?? 0) / (leaveBalance.total || 1)) * 100, 100)
        : 0

    if (profileLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }} />

    return (<>        <div className={styles.dashboardContainer}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className={styles.header}>
            <div className={styles.headerContent}>
                <h1>Chào buổi sáng, {profile?.user?.first_name || profile?.first_name || 'bạn'} 👋</h1>
                <p>Tổng quan những gì đang diễn ra hôm nay.</p>
            </div>
            <div className={styles.headerButtons}>
                <button className={styles.btnSecondary} onClick={() => setLeaveModalOpen(true)}>
                    <CalendarOutlined />
                    Đăng ký Nghỉ phép
                </button>
                <button className={styles.btnPrimary} onClick={() => navigate('/requests')}>
                    <PlusOutlined />
                    Yêu cầu Mới
                </button>
            </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <Row gutter={[18, 18]} style={{ marginBottom: 36 }} className={styles.statsRow}>
            <Col xs={12} sm={12} md={6}>
                <StatCard
                    label="Phòng ban"
                    value={profile?.department || 'N/A'}
                    icon={<TeamOutlined />}
                    color="#3B82F6"
                    bgLight="#EFF6FF"
                    accentA="#3B82F6"
                    accentB="#6366F1"
                    glow="rgba(59,130,246,0.08)"
                />
            </Col>
            <Col xs={12} sm={12} md={6}>
                <StatCard
                    label="Số ngày nghỉ còn lại"
                    value={`${leaveBalance?.remaining ?? 0} ngày`}
                    icon={<CheckCircleOutlined />}
                    color="#10B981"
                    bgLight="#ECFDF5"
                    accentA="#10B981"
                    accentB="#059669"
                    glow="rgba(16,185,129,0.08)"
                />
            </Col>
            <Col xs={12} sm={12} md={6}>
                <StatCard
                    label="Yêu cầu chờ duyệt"
                    value={leaveBalance?.pending ?? 0}
                    icon={<ClockCircleOutlined />}
                    color="#8B5CF6"
                    bgLight="#F5F3FF"
                    accentA="#8B5CF6"
                    accentB="#C084FC"
                    glow="rgba(139,92,246,0.08)"
                />
            </Col>
            <Col xs={12} sm={12} md={6}>
                <StatCard
                    label="Email"
                    value={profile?.user?.email?.split('@')[0] || profile?.email?.split('@')[0] || 'N/A'}
                    icon={<MailOutlined />}
                    color="#F59E0B"
                    bgLight="#FFFBEB"
                    accentA="#F59E0B"
                    accentB="#F97316"
                    glow="rgba(245,158,11,0.08)"
                />
            </Col>
        </Row>

        {/* ── Leave Balance + Announcements ───────────────── */}
        <Row gutter={[24, 24]}>

            {/* Leave balance */}
            <Col xs={24} md={16}>
                <p className={styles.sectionTitle}>Số ngày nghỉ phép</p>

                {leaveLoading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
                ) : (
                    <div className={styles.leaveBalanceCard}>
                        {/* Row label + remaining */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 4,
                        }}>
                            <span style={{
                                fontSize: 12,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                color: 'var(--brand-gray-500)',
                            }}>
                                Nghỉ phép Năm
                            </span>
                            <span style={{
                                fontSize: 22,
                                fontWeight: 800,
                                fontFamily: 'Manrope, sans-serif',
                                letterSpacing: '-0.03em',
                                color: 'var(--brand-black)',
                            }}>
                                {leaveBalance?.remaining ?? 0}
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-gray-400)', marginLeft: 4 }}>ngày còn lại</span>
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className={styles.progressTrack}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${usedPct}%` }}
                            />
                        </div>

                        {/* Meta */}
                        <div className={styles.progressMeta}>
                            <span>Đã dùng: <strong style={{ color: 'var(--brand-black)' }}>{leaveBalance?.used ?? 0}</strong> ngày</span>
                            <span>Tổng: <strong style={{ color: 'var(--brand-black)' }}>{leaveBalance?.total ?? 0}</strong> ngày</span>
                        </div>
                    </div>
                )}
            </Col>

            {/* Announcements */}
            <Col xs={24} md={8}>
                <p className={styles.sectionTitle}>Thông báo</p>

                <div className={styles.announcementsScroll}>
                    {announcementsLoading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
                    ) : announcementsData?.results?.length ? (
                        announcementsData.results.slice(0, 5).map((a: any) => (
                            <AnnouncementCard key={a.id} announcement={a} onClick={() => setSelectedAnnouncement(a)} />
                        ))
                    ) : (
                        <Empty description="Không có thông báo" />
                    )}
                </div>
            </Col>
        </Row>

    </div>

        {/* ── Announcement Detail Modal ──────────────────── */}
        <Modal
            title={selectedAnnouncement?.title}
            open={!!selectedAnnouncement}
            onCancel={() => setSelectedAnnouncement(null)}
            footer={null}
            destroyOnClose
        >
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--brand-gray-700)', lineHeight: 1.7 }}>
                {selectedAnnouncement?.content}
            </p>
            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--brand-gray-400)' }}>
                {selectedAnnouncement?.created_at && formatDate(selectedAnnouncement.created_at)}
            </p>
        </Modal>

        {/* ── Leave Request Modal ────────────────────────── */}
        <Modal
            title="Đăng ký Nghỉ phép"
            open={leaveModalOpen}
            onCancel={() => setLeaveModalOpen(false)}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={onLeaveSubmit}>
                <Form.Item
                    label="Loại nghỉ phép"
                    name="leave_type"
                    rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ phép' }]}
                >
                    <Select placeholder="Chọn loại nghỉ phép">
                        <Select.Option value="sick">Nghỉ ốm</Select.Option>
                        <Select.Option value="casual">Nghỉ việc riêng</Select.Option>
                        <Select.Option value="earned">Nghỉ phép năm</Select.Option>
                        <Select.Option value="maternity">Nghỉ thai sản</Select.Option>
                        <Select.Option value="paternity">Nghỉ chăm con</Select.Option>
                        <Select.Option value="unpaid">Nghỉ không lương</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label="Ngày bắt đầu"
                    name="start_date"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    label="Ngày kết thúc"
                    name="end_date"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    label="Lý do"
                    name="reason"
                    rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
                >
                    <Input.TextArea rows={4} placeholder="Nhập lý do xin nghỉ" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block loading={leaveSubmitting}>
                    Gửi Yêu cầu
                </Button>
            </Form>
        </Modal>
    </>
    )
}