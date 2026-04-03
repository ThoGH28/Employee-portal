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
import { useI18n } from '../../shared/context/i18n'
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
    const t = useI18n()
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
                message.success(t.dashboard.leaveSuccess)
                form.resetFields()
                setLeaveModalOpen(false)
            },
            onError: (error: any) => {
                message.error(error.response?.data?.message || t.dashboard.leaveSuccess)
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
                <h1>{t.dashboard.greeting.replace('{name}', profile?.user?.first_name || profile?.first_name || '')}</h1>
                <p>{t.dashboard.subtitle}</p>
            </div>
            <div className={styles.headerButtons}>
                <button className={styles.btnSecondary} onClick={() => setLeaveModalOpen(true)}>
                    <CalendarOutlined />
                    {t.dashboard.btnLeave}
                </button>
                <button className={styles.btnPrimary} onClick={() => navigate('/requests')}>
                    <PlusOutlined />
                    {t.dashboard.btnNewRequest}
                </button>
            </div>
        </div>

        {/* ── Stats ──────────────────────────────────────── */}
        <Row gutter={[18, 18]} style={{ marginBottom: 36 }} className={styles.statsRow}>
            <Col xs={12} sm={12} md={6}>
                <StatCard
                    label={t.dashboard.statDept}
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
                    label={t.dashboard.statLeaveRemaining}
                    value={`${leaveBalance?.remaining ?? 0} ${t.dashboard.daysLeft}`}
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
                    label={t.dashboard.statPending}
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
                    label={t.dashboard.statEmail}
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
                <p className={styles.sectionTitle}>{t.dashboard.sectionLeave}</p>

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
                                {t.dashboard.annualLeaveLabel}
                            </span>
                            <span style={{
                                fontSize: 22,
                                fontWeight: 800,
                                fontFamily: 'Manrope, sans-serif',
                                letterSpacing: '-0.03em',
                                color: 'var(--brand-black)',
                            }}>
                                {leaveBalance?.remaining ?? 0}
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-gray-400)', marginLeft: 4 }}>{t.dashboard.daysLeft}</span>
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
                            <span>{t.dashboard.daysUsed} <strong style={{ color: 'var(--brand-black)' }}>{leaveBalance?.used ?? 0}</strong></span>
                            <span>{t.dashboard.daysTotal} <strong style={{ color: 'var(--brand-black)' }}>{leaveBalance?.total ?? 0}</strong></span>
                        </div>
                    </div>
                )}
            </Col>

            {/* Announcements */}
            <Col xs={24} md={8}>
                <p className={styles.sectionTitle}>{t.dashboard.sectionAnnounce}</p>

                <div className={styles.announcementsScroll}>
                    {announcementsLoading ? (
                        <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
                    ) : announcementsData?.results?.length ? (
                        announcementsData.results.slice(0, 5).map((a: any) => (
                            <AnnouncementCard key={a.id} announcement={a} onClick={() => setSelectedAnnouncement(a)} />
                        ))
                    ) : (
                        <Empty description={t.dashboard.noAnnouncements} />
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
            title={t.dashboard.leaveModalTitle}
            open={leaveModalOpen}
            onCancel={() => setLeaveModalOpen(false)}
            footer={null}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={onLeaveSubmit}>
                <Form.Item
                    label={t.dashboard.leaveTypeLabel}
                    name="leave_type"
                    rules={[{ required: true, message: t.dashboard.leaveTypeRequired }]}
                >
                    <Select placeholder={t.dashboard.leaveTypePlaceholder}>
                        <Select.Option value="sick">{t.leaveTypes.sick}</Select.Option>
                        <Select.Option value="casual">{t.leaveTypes.casual}</Select.Option>
                        <Select.Option value="earned">{t.leaveTypes.earned}</Select.Option>
                        <Select.Option value="maternity">{t.leaveTypes.maternity}</Select.Option>
                        <Select.Option value="paternity">{t.leaveTypes.paternity}</Select.Option>
                        <Select.Option value="unpaid">{t.leaveTypes.unpaid}</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item
                    label={t.dashboard.startDateLabel}
                    name="start_date"
                    rules={[{ required: true, message: t.dashboard.startDateRequired }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    label={t.dashboard.endDateLabel}
                    name="end_date"
                    rules={[{ required: true, message: t.dashboard.endDateRequired }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                    label={t.dashboard.reasonLabel}
                    name="reason"
                    rules={[{ required: true, message: t.dashboard.reasonRequired }]}
                >
                    <Input.TextArea rows={4} placeholder={t.dashboard.reasonPlaceholder} />
                </Form.Item>
                <Button type="primary" htmlType="submit" block loading={leaveSubmitting}>
                    {t.dashboard.submitLeave}
                </Button>
            </Form>
        </Modal>
    </>
    )
}