import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Statistic, Tabs, Table, Tag, Spin, Typography, Empty, Divider } from 'antd'
import {
    TeamOutlined,
    DollarOutlined,
    CalendarOutlined,
    FileProtectOutlined,
    BarChartOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    MinusCircleOutlined,
    RiseOutlined,
} from '@ant-design/icons'
import api from '../../shared/services/api'
import type { Payslip } from '../../shared/types/payslip'
import type { Employee, LeaveRequest } from '../../shared/types'
import type { AdministrativeRequest } from '../../shared/types/adminRequest'
import styles from './Reports.module.css'

const { Title, Text } = Typography

/* ── Helper sub-components ──────────────────────────────────────── */
interface BarChartProps {
    items: { label: string; value: number; color: string }[]
    max: number
}
const HBarChart: React.FC<BarChartProps> = ({ items, max }) => (
    <div className={styles.barChart}>
        {items.map((item) => (
            <div key={item.label} className={styles.barRow}>
                <span className={styles.barLabel} title={item.label}>{item.label}</span>
                <div className={styles.barTrack}>
                    <div
                        className={styles.barFill}
                        style={{
                            width: max > 0 ? `${(item.value / max) * 100}%` : '0%',
                            background: item.color,
                        }}
                    />
                </div>
                <span className={styles.barValue}>{item.value}</span>
            </div>
        ))}
    </div>
)

interface TrendItem { month: string; value: number }
const TrendChart: React.FC<{ items: TrendItem[]; unit?: string }> = ({ items, unit = '' }) => {
    const peak = Math.max(...items.map((i) => i.value), 1)
    return (
        <div className={styles.trendChart}>
            {items.map((item) => (
                <div key={item.month} className={styles.trendBar}>
                    <span className={styles.trendValue}>
                        {unit === 'M'
                            ? `${(item.value / 1_000_000).toFixed(1)}M`
                            : item.value}
                    </span>
                    <div
                        className={styles.trendFill}
                        style={{ height: `${Math.max((item.value / peak) * 120, 4)}px` }}
                    />
                    <span className={styles.trendLabel}>{item.month}</span>
                </div>
            ))}
        </div>
    )
}

const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

/* ── Main component ─────────────────────────────────────────────── */
export const Reports: React.FC = () => {
    const { data: payslips = [], isLoading: loadingPayslips } = useQuery<Payslip[]>({
        queryKey: ['reports-payslips'],
        queryFn: async () => {
            const res = await api.get('/employees/payslips/', { params: { page_size: 1000 } })
            const d = res.data
            return Array.isArray(d) ? d : (d.results ?? [])
        },
        staleTime: 1000 * 60 * 5,
    })

    const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
        queryKey: ['reports-employees'],
        queryFn: async () => {
            const res = await api.get('/employees/profiles/', { params: { page_size: 1000 } })
            const d = res.data
            return Array.isArray(d) ? d : (d.results ?? [])
        },
        staleTime: 1000 * 60 * 5,
    })

    const { data: leaveData = [], isLoading: loadingLeaves } = useQuery<LeaveRequest[]>({
        queryKey: ['reports-leaves'],
        queryFn: async () => {
            const res = await api.get('/employees/leave/', { params: { page_size: 1000 } })
            const d = res.data
            return Array.isArray(d) ? d : (d.results ?? [])
        },
        staleTime: 1000 * 60 * 5,
    })

    const { data: requestData = [], isLoading: loadingRequests } = useQuery<AdministrativeRequest[]>({
        queryKey: ['reports-admin-requests'],
        queryFn: async () => {
            const res = await api.get('/employees/admin-requests/', { params: { page_size: 1000 } })
            const d = res.data
            return Array.isArray(d) ? d : (d.results ?? [])
        },
        staleTime: 1000 * 60 * 5,
    })

    const isLoading = loadingPayslips || loadingEmployees || loadingLeaves || loadingRequests

    /* ── Derived: Employees ─────────────────────────────────────── */
    const deptMap = useMemo(() => {
        const map = new Map<string, number>()
        employees.forEach((e) => {
            const dept = e.department || 'Chưa phân công'
            map.set(dept, (map.get(dept) ?? 0) + 1)
        })
        return [...map.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value, color: '#6366f1' }))
    }, [employees])

    /* ── Derived: Payslips ──────────────────────────────────────── */
    const {
        totalPay,
        avgSalary,
        payByMonth,
        payByStatus,
    } = useMemo(() => {
        const totalPay = payslips.reduce((s, p) => s + Number(p.net_salary ?? 0), 0)
        const avgSalary = payslips.length ? totalPay / payslips.length : 0

        // Group by month_year ("2024-01-01" DateField) - take last 6 months
        const monthMap = new Map<string, number>()
        payslips.forEach((p) => {
            const key = p.month_year?.slice(0, 7) ?? 'N/A'  // "2024-01"
            monthMap.set(key, (monthMap.get(key) ?? 0) + Number(p.net_salary ?? 0))
        })
        const payByMonth: TrendItem[] = [...monthMap.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6)
            .map(([month, value]) => ({ month: month.slice(-2), value })) // "01".."12"

        const statusMap = { draft: 0, finalized: 0, distributed: 0 }
        payslips.forEach((p) => {
            if (p.status in statusMap) statusMap[p.status as keyof typeof statusMap]++
        })
        const payByStatus = [
            { label: 'Bản nháp', value: statusMap.draft, color: '#94a3b8' },
            { label: 'Đã hoàn thiện', value: statusMap.finalized, color: '#6366f1' },
            { label: 'Đã phát hành', value: statusMap.distributed, color: '#22c55e' },
        ]

        return { totalPay, avgSalary, payByMonth, payByStatus }
    }, [payslips])

    /* ── Derived: Leaves ────────────────────────────────────────── */
    const {
        leaveByStatus,
        leaveByType,
    } = useMemo(() => {
        const statusCounts = { pending: 0, approved: 0, rejected: 0, cancelled: 0 }
        leaveData.forEach((l) => {
            const s = l.status as keyof typeof statusCounts
            if (s in statusCounts) statusCounts[s]++
        })
        const leaveByStatus = [
            { label: 'Chờ duyệt', value: statusCounts.pending, color: '#f59e0b' },
            { label: 'Đã duyệt', value: statusCounts.approved, color: '#22c55e' },
            { label: 'Từ chối', value: statusCounts.rejected, color: '#ef4444' },
            { label: 'Đã hủy', value: statusCounts.cancelled, color: '#94a3b8' },
        ]

        const typeMap = new Map<string, number>()
        leaveData.forEach((l) => {
            const label = leaveTypeLabel(l.leave_type)
            typeMap.set(label, (typeMap.get(label) ?? 0) + 1)
        })
        const leaveByType = [...typeMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value, color: '#0ea5e9' }))

        return { leaveByStatus, leaveByType }
    }, [leaveData])

    /* ── Derived: Admin requests ────────────────────────────────── */
    const {
        requestByStatus,
        requestByType,
    } = useMemo(() => {
        const statusCounts = { pending: 0, in_progress: 0, approved: 0, rejected: 0, completed: 0 }
        requestData.forEach((r) => {
            const s = r.status as keyof typeof statusCounts
            if (s in statusCounts) statusCounts[s]++
        })
        const requestByStatus = [
            { label: 'Chờ xử lý', value: statusCounts.pending, color: '#f59e0b' },
            { label: 'Đang xử lý', value: statusCounts.in_progress, color: '#6366f1' },
            { label: 'Đã duyệt', value: statusCounts.approved, color: '#22c55e' },
            { label: 'Từ chối', value: statusCounts.rejected, color: '#ef4444' },
            { label: 'Hoàn thành', value: statusCounts.completed, color: '#14b8a6' },
        ]

        const typeMap = new Map<string, number>()
        requestData.forEach((r) => {
            const label = r.request_type_display || r.request_type
            typeMap.set(label, (typeMap.get(label) ?? 0) + 1)
        })
        const requestByType = [...typeMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value, color: '#8b5cf6' }))

        return { requestByStatus, requestByType }
    }, [requestData])

    /* ── Tables ─────────────────────────────────────────────────── */
    const leaveColumns = [
        { title: 'Nhân viên', dataIndex: 'employee_name', key: 'employee_name' },
        {
            title: 'Loại nghỉ', dataIndex: 'leave_type', key: 'leave_type',
            render: (v: string) => leaveTypeLabel(v),
        },
        { title: 'Bắt đầu', dataIndex: 'start_date', key: 'start_date' },
        { title: 'Kết thúc', dataIndex: 'end_date', key: 'end_date' },
        { title: 'Số ngày', dataIndex: 'days_count', key: 'days_count' },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (v: string) => leaveStatusTag(v),
        },
    ]

    const requestColumns = [
        { title: 'Nhân viên', dataIndex: 'employee_name', key: 'employee_name' },
        { title: 'Loại yêu cầu', dataIndex: 'request_type_display', key: 'request_type_display' },
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title', ellipsis: true },
        {
            title: 'Ưu tiên', dataIndex: 'priority', key: 'priority',
            render: (v: string) => priorityTag(v),
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (v: string) => requestStatusTag(v),
        },
        {
            title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at',
            render: (v: string) => v ? v.split('T')[0] : '',
        },
    ]

    /* ── Render ─────────────────────────────────────────────────── */
    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 360 }}>
                <Spin size="large" tip="Đang tải báo cáo..." />
            </div>
        )
    }

    const maxDept = deptMap[0]?.value ?? 1
    const maxPayStatus = Math.max(...payByStatus.map((s) => s.value), 1)
    const maxLeaveType = leaveByType[0]?.value ?? 1
    const maxReqType = requestByType[0]?.value ?? 1

    const tabs = [
        {
            key: 'overview',
            label: <span><BarChartOutlined /> Tổng quan</span>,
            children: (
                <Row gutter={[20, 20]}>
                    {/* KPI cards */}
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.sectionCard} bodyStyle={{ padding: 20 }}>
                            <div className={styles.kpiInner}>
                                <div className={styles.kpiIcon} style={{ background: '#ede9fe', color: '#7c3aed' }}>
                                    <TeamOutlined />
                                </div>
                                <div className={styles.kpiText}>
                                    <Statistic title="Tổng nhân viên" value={employees.length} />
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.sectionCard} bodyStyle={{ padding: 20 }}>
                            <div className={styles.kpiInner}>
                                <div className={styles.kpiIcon} style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    <DollarOutlined />
                                </div>
                                <div className={styles.kpiText}>
                                    <Statistic
                                        title="Tổng quỹ lương"
                                        value={totalPay}
                                        formatter={(v) => fmtCurrency(Number(v))}
                                    />
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.sectionCard} bodyStyle={{ padding: 20 }}>
                            <div className={styles.kpiInner}>
                                <div className={styles.kpiIcon} style={{ background: '#fef9c3', color: '#ca8a04' }}>
                                    <CalendarOutlined />
                                </div>
                                <div className={styles.kpiText}>
                                    <Statistic title="Yêu cầu nghỉ phép" value={leaveData.length} suffix="đơn" />
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card className={styles.sectionCard} bodyStyle={{ padding: 20 }}>
                            <div className={styles.kpiInner}>
                                <div className={styles.kpiIcon} style={{ background: '#fce7f3', color: '#be185d' }}>
                                    <FileProtectOutlined />
                                </div>
                                <div className={styles.kpiText}>
                                    <Statistic title="Yêu cầu hành chính" value={requestData.length} suffix="đơn" />
                                </div>
                            </div>
                        </Card>
                    </Col>

                    {/* Summary blocks */}
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title={<><CalendarOutlined style={{ color: '#f59e0b', marginRight: 8 }} />Trạng thái nghỉ phép</>}>
                            <div className={styles.statusGrid}>
                                {leaveByStatus.map((s) => (
                                    <div key={s.label} className={styles.statusItem}>
                                        <div className={styles.statusCount} style={{ color: s.color }}>{s.value}</div>
                                        <div className={styles.statusDesc}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title={<><FileProtectOutlined style={{ color: '#8b5cf6', marginRight: 8 }} />Trạng thái yêu cầu hành chính</>}>
                            <div className={styles.statusGrid}>
                                {requestByStatus.map((s) => (
                                    <div key={s.label} className={styles.statusItem}>
                                        <div className={styles.statusCount} style={{ color: s.color }}>{s.value}</div>
                                        <div className={styles.statusDesc}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>

                    {/* Payroll trend */}
                    <Col xs={24}>
                        <Card
                            className={styles.sectionCard}
                            title={<><RiseOutlined style={{ color: '#22c55e', marginRight: 8 }} />Xu hướng quỹ lương 6 tháng gần nhất</>}
                        >
                            {payByMonth.length > 0 ? (
                                <TrendChart items={payByMonth} unit="M" />
                            ) : (
                                <Empty description="Chưa có dữ liệu phiếu lương" />
                            )}
                        </Card>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'employees',
            label: <span><TeamOutlined /> Nhân sự</span>,
            children: (
                <Row gutter={[20, 20]}>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Nhân viên theo phòng ban">
                            {deptMap.length > 0 ? (
                                <HBarChart items={deptMap} max={maxDept} />
                            ) : (
                                <Empty description="Không có dữ liệu" />
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Thống kê nhanh">
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Statistic title="Tổng nhân viên" value={employees.length} prefix={<TeamOutlined />} />
                                </Col>
                                <Col span={12}>
                                    <Statistic title="Số phòng ban" value={deptMap.length} prefix={<BarChartOutlined />} />
                                </Col>
                                <Col span={24}>
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        Lương trung bình: <Text strong>{fmtCurrency(avgSalary)}</Text>
                                    </Text>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'leaves',
            label: <span><CalendarOutlined /> Nghỉ phép</span>,
            children: (
                <Row gutter={[20, 20]}>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Theo trạng thái">
                            <HBarChart items={leaveByStatus} max={Math.max(...leaveByStatus.map((s) => s.value), 1)} />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Theo loại nghỉ">
                            {leaveByType.length > 0 ? (
                                <HBarChart items={leaveByType} max={maxLeaveType} />
                            ) : (
                                <Empty description="Không có dữ liệu" />
                            )}
                        </Card>
                    </Col>
                    <Col xs={24}>
                        <Card className={styles.sectionCard} title="Danh sách yêu cầu nghỉ phép">
                            {leaveData.length === 0 ? (
                                <Empty description="Chưa có yêu cầu nghỉ phép nào" />
                            ) : (
                                <Table
                                    dataSource={leaveData}
                                    columns={leaveColumns}
                                    rowKey="id"
                                    size="small"
                                    pagination={{ pageSize: 10, showSizeChanger: false }}
                                    scroll={{ x: 700 }}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'payroll',
            label: <span><DollarOutlined /> Lương</span>,
            children: (
                <Row gutter={[20, 20]}>
                    <Col xs={24} md={8}>
                        <Card className={styles.sectionCard} bodyStyle={{ padding: 20 }}>
                            <Statistic title="Tổng quỹ lương" value={totalPay} formatter={(v) => fmtCurrency(Number(v))} prefix={<DollarOutlined />} />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card className={styles.sectionCard} bodyStyle={{ padding: 20 }}>
                            <Statistic title="Lương trung bình" value={avgSalary} formatter={(v) => fmtCurrency(Number(v))} />
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card className={styles.sectionCard} bodyStyle={{ padding: 20 }}>
                            <Statistic title="Tổng số phiếu lương" value={payslips.length} suffix="phiếu" />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Theo trạng thái phiếu lương">
                            <HBarChart items={payByStatus} max={maxPayStatus} />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Xu hướng tổng lương theo tháng">
                            {payByMonth.length > 0 ? (
                                <TrendChart items={payByMonth} unit="M" />
                            ) : (
                                <Empty description="Chưa có dữ liệu" />
                            )}
                        </Card>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'requests',
            label: <span><FileProtectOutlined /> Yêu cầu</span>,
            children: (
                <Row gutter={[20, 20]}>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Theo trạng thái">
                            <HBarChart items={requestByStatus} max={Math.max(...requestByStatus.map((s) => s.value), 1)} />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card className={styles.sectionCard} title="Theo loại yêu cầu">
                            {requestByType.length > 0 ? (
                                <HBarChart items={requestByType} max={maxReqType} />
                            ) : (
                                <Empty description="Không có dữ liệu" />
                            )}
                        </Card>
                    </Col>
                    <Col xs={24}>
                        <Card className={styles.sectionCard} title="Danh sách yêu cầu hành chính">
                            {requestData.length === 0 ? (
                                <Empty description="Chưa có yêu cầu hành chính nào" />
                            ) : (
                                <Table
                                    dataSource={requestData}
                                    columns={requestColumns}
                                    rowKey="id"
                                    size="small"
                                    pagination={{ pageSize: 10, showSizeChanger: false }}
                                    scroll={{ x: 800 }}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            ),
        },
    ]

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <BarChartOutlined />
                    </div>
                    <div>
                        <Title level={2} style={{ color: '#fff', margin: 0 }}>
                            Báo cáo
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                            Tổng hợp dữ liệu nhân sự, lương, nghỉ phép và yêu cầu hành chính
                        </Text>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <Tabs items={tabs} size="large" />
            </div>
        </div>
    )
}

/* ── Label helpers ──────────────────────────────────────────────── */
const LEAVE_TYPE_LABELS: Record<string, string> = {
    sick: 'Nghỉ ốm',
    casual: 'Nghỉ việc riêng',
    earned: 'Nghỉ phép năm',
    maternity: 'Nghỉ thai sản',
    paternity: 'Nghỉ chăm con',
    unpaid: 'Nghỉ không lương',
}
const leaveTypeLabel = (t: string) => LEAVE_TYPE_LABELS[t] ?? t

const leaveStatusTag = (s: string) => {
    const map: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
        pending: { color: 'gold', label: 'Chờ duyệt', icon: <ClockCircleOutlined /> },
        approved: { color: 'green', label: 'Đã duyệt', icon: <CheckCircleOutlined /> },
        rejected: { color: 'red', label: 'Từ chối', icon: <CloseCircleOutlined /> },
        cancelled: { color: 'default', label: 'Đã hủy', icon: <MinusCircleOutlined /> },
    }
    const cfg = map[s] ?? { color: 'default', label: s, icon: null }
    return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>
}

const requestStatusTag = (s: string) => {
    const map: Record<string, { color: string; label: string }> = {
        pending: { color: 'gold', label: 'Chờ xử lý' },
        in_progress: { color: 'blue', label: 'Đang xử lý' },
        approved: { color: 'green', label: 'Đã duyệt' },
        rejected: { color: 'red', label: 'Từ chối' },
        completed: { color: 'cyan', label: 'Hoàn thành' },
    }
    const cfg = map[s] ?? { color: 'default', label: s }
    return <Tag color={cfg.color}>{cfg.label}</Tag>
}

const priorityTag = (p: string) => {
    const map: Record<string, { color: string; label: string }> = {
        low: { color: 'default', label: 'Thấp' },
        medium: { color: 'orange', label: 'Trung bình' },
        high: { color: 'red', label: 'Cao' },
    }
    const cfg = map[p] ?? { color: 'default', label: p }
    return <Tag color={cfg.color}>{cfg.label}</Tag>
}

