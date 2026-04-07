import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Card, Button, Table, Tag, Tabs, Space, Statistic, Alert,
    Modal, Form, TimePicker, DatePicker, Input, Select, message, Typography
} from 'antd'
import {
    ClockCircleOutlined, LoginOutlined, LogoutOutlined, PlusOutlined,
    CheckCircleOutlined, WarningOutlined, DollarOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { attendanceService } from '../../shared/services/attendanceService'
import type { AttendanceRecord, OvertimeRequest, LatePardon } from '../../shared/types/attendance'
import { useAuthStore } from '../../shared/context/store'
import { isDeptManagerOrAbove } from '../../shared/utils/permissions'

const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_COLOR: Record<string, string> = {
    present: 'green', absent: 'red', late: 'orange', wfh: 'blue', half_day: 'purple'
}
const STATUS_LABEL: Record<string, string> = {
    present: 'Có mặt', absent: 'Vắng', late: 'Muộn', wfh: 'WFH', half_day: 'Nửa ngày'
}
const OT_STATUS_COLOR: Record<string, string> = {
    pending: 'orange', approved: 'green', rejected: 'red', cancelled: 'default'
}
const PARDON_COLOR: Record<string, string> = {
    pending: 'orange', approved: 'green', rejected: 'red'
}
const PARDON_LABEL: Record<string, string> = {
    pending: 'Chờ duyệt', approved: 'Đã tha', rejected: 'Bị phạt'
}

const fmtVND = (v: number | string) =>
    `${Number(v).toLocaleString('vi-VN')} VND`

export const Attendance: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const [otModalOpen, setOtModalOpen] = useState(false)
    const [approveModalOpen, setApproveModalOpen] = useState(false)
    const [selectedOT, setSelectedOT] = useState<OvertimeRequest | null>(null)
    const [pardonModalOpen, setPardonModalOpen] = useState(false)
    const [pardonRecord, setPardonRecord] = useState<AttendanceRecord | null>(null)
    const [approvePardonModalOpen, setApprovePardonModalOpen] = useState(false)
    const [selectedPardon, setSelectedPardon] = useState<LatePardon | null>(null)
    const [form] = Form.useForm()
    const [approveForm] = Form.useForm()
    const [pardonForm] = Form.useForm()
    const [approvePardonForm] = Form.useForm()

    const isManager = isDeptManagerOrAbove(user)

    const { data: todayRecord } = useQuery({
        queryKey: ['attendance-today'],
        queryFn: () => attendanceService.getToday(),
        retry: false,
        refetchInterval: 60000,
    })

    const { data: summaryData } = useQuery({
        queryKey: ['attendance-summary'],
        queryFn: () => attendanceService.getSummary().catch(() => null),
        retry: false,
    })

    const { data: myRecords = [] } = useQuery({
        queryKey: ['attendance-records'],
        queryFn: () => attendanceService.getMyRecords({ ordering: '-date' }).catch(() => []),
        retry: false,
    })

    const { data: overtimeRequests = [] } = useQuery({
        queryKey: ['overtime-requests'],
        queryFn: () => attendanceService.getOvertimeRequests({ ordering: '-date' }).catch(() => []),
        retry: false,
    })

    const { data: latePardons = [] } = useQuery({
        queryKey: ['late-pardons'],
        queryFn: () => attendanceService.getLatePardons({ ordering: '-created_at' }).catch(() => []),
        retry: false,
    })

    const clockInMutation = useMutation({
        mutationFn: attendanceService.clockIn,
        onSuccess: (data) => {
            if ((data as any).late_warning) {
                message.warning((data as any).late_warning, 6)
            } else {
                message.success('Đã chấm công vào')
            }
            qc.invalidateQueries({ queryKey: ['attendance-today'] })
            qc.invalidateQueries({ queryKey: ['attendance-records'] })
            qc.invalidateQueries({ queryKey: ['attendance-summary'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi chấm công vào'),
    })

    const clockOutMutation = useMutation({
        mutationFn: attendanceService.clockOut,
        onSuccess: () => {
            message.success('Đã chấm công ra')
            qc.invalidateQueries({ queryKey: ['attendance-today'] })
            qc.invalidateQueries({ queryKey: ['attendance-records'] })
            qc.invalidateQueries({ queryKey: ['attendance-summary'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi chấm công ra'),
    })

    const otMutation = useMutation({
        mutationFn: attendanceService.createOvertimeRequest,
        onSuccess: () => {
            message.success('Đã gửi đơn tăng ca')
            setOtModalOpen(false)
            form.resetFields()
            qc.invalidateQueries({ queryKey: ['overtime-requests'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi gửi đơn'),
    })

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => attendanceService.approveOvertime(id, data),
        onSuccess: () => {
            message.success('Đã xử lý đơn tăng ca')
            setApproveModalOpen(false)
            approveForm.resetFields()
            qc.invalidateQueries({ queryKey: ['overtime-requests'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi xử lý'),
    })

    const pardonMutation = useMutation({
        mutationFn: (data: { attendance_record: string; reason: string }) =>
            attendanceService.createLatePardon(data),
        onSuccess: () => {
            message.success('Đã gửi đơn xin tha tội')
            setPardonModalOpen(false)
            pardonForm.resetFields()
            qc.invalidateQueries({ queryKey: ['late-pardons'] })
            qc.invalidateQueries({ queryKey: ['attendance-records'] })
            qc.invalidateQueries({ queryKey: ['attendance-today'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi gửi đơn xin tha'),
    })

    const approvePardonMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => attendanceService.approvePardon(id, data),
        onSuccess: () => {
            message.success('Đã xử lý đơn xin tha tội')
            setApprovePardonModalOpen(false)
            approvePardonForm.resetFields()
            qc.invalidateQueries({ queryKey: ['late-pardons'] })
            qc.invalidateQueries({ queryKey: ['attendance-records'] })
            qc.invalidateQueries({ queryKey: ['attendance-today'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi xử lý'),
    })

    const handleOTSubmit = (values: any) => {
        otMutation.mutate({
            date: values.date.format('YYYY-MM-DD'),
            start_time: values.start_time.format('HH:mm:ss'),
            end_time: values.end_time.format('HH:mm:ss'),
            reason: values.reason,
        })
    }

    const handleApprove = (values: any) => {
        if (!selectedOT) return
        approveMutation.mutate({ id: selectedOT.id, data: values })
    }

    const handlePardonSubmit = (values: any) => {
        if (!pardonRecord) return
        pardonMutation.mutate({ attendance_record: pardonRecord.id, reason: values.reason })
    }

    const handleApprovePardon = (values: any) => {
        if (!selectedPardon) return
        approvePardonMutation.mutate({ id: selectedPardon.id, data: values })
    }

    const recordColumns: ColumnsType<AttendanceRecord> = [
        { title: 'Ngày', dataIndex: 'date', width: 110 },
        { title: 'Vào', dataIndex: 'clock_in', width: 90, render: v => v || '—' },
        { title: 'Ra', dataIndex: 'clock_out', width: 90, render: v => v || '—' },
        { title: 'Giờ làm', dataIndex: 'work_hours', width: 90, render: v => `${v}h` },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 120,
            render: (s, r) => (
                <Space size={4}>
                    <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
                    {s === 'late' && r.pardon_status && (
                        <Tag color={PARDON_COLOR[r.pardon_status]}>{PARDON_LABEL[r.pardon_status]}</Tag>
                    )}
                </Space>
            )
        },
        {
            title: 'Phạt', dataIndex: 'penalty_amount', width: 110,
            render: (v, r) => r.status === 'late'
                ? <span style={{ color: v > 0 ? '#cf1322' : '#52c41a', fontWeight: 600 }}>
                    {v > 0 ? `-${fmtVND(v)}` : 'Miễn phạt'}
                </span>
                : '—'
        },
        {
            title: '', key: 'pardon', width: 120,
            render: (_, r) => r.status === 'late' && !r.has_pardon_request
                ? <Button size="small" type="dashed" icon={<WarningOutlined />}
                    onClick={() => { setPardonRecord(r); setPardonModalOpen(true) }}>
                    Xin tha tội
                </Button>
                : null
        },
        { title: 'Ghi chú', dataIndex: 'notes', ellipsis: true },
    ]

    // Pardon columns for manager tab
    const pardonColumns: ColumnsType<LatePardon> = [
        { title: 'Ngày', dataIndex: 'date', width: 110 },
        ...(isManager ? [{ title: 'Nhân viên', dataIndex: 'employee_name', width: 150 }] : []),
        { title: 'Muộn', dataIndex: 'late_minutes', width: 80, render: (v: number) => `${v} phút` },
        { title: 'Tiền phạt', dataIndex: 'penalty_amount', width: 120, render: (v: any) => fmtVND(v) },
        { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 110,
            render: (s: string, r: LatePardon) => <Tag color={PARDON_COLOR[s]}>{r.status_display}</Tag>
        },
        ...(isManager ? [{
            title: '', key: 'action', width: 90,
            render: (_: any, r: LatePardon) => r.status === 'pending' ? (
                <Button size="small" onClick={() => { setSelectedPardon(r); setApprovePardonModalOpen(true) }}>Duyệt</Button>
            ) : null
        }] : []),
    ]

    const otColumns: ColumnsType<OvertimeRequest> = [
        { title: 'Ngày', dataIndex: 'date', width: 110 },
        ...(isManager ? [{ title: 'Nhân viên', dataIndex: 'employee_name', width: 150 }] : []),
        { title: 'Từ', dataIndex: 'start_time', width: 80 },
        { title: 'Đến', dataIndex: 'end_time', width: 80 },
        { title: 'Giờ OT', dataIndex: 'hours', width: 80, render: (v: number) => `${v}h` },
        { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 120,
            render: (s, r) => <Tag color={OT_STATUS_COLOR[s]}>{r.status_display}</Tag>
        },
        ...(isManager ? [{
            title: '', key: 'action', width: 80,
            render: (_: any, r: OvertimeRequest) => r.status === 'pending' ? (
                <Button size="small" onClick={() => { setSelectedOT(r); setApproveModalOpen(true) }}>Duyệt</Button>
            ) : null
        }] : []),
    ]

    return (
        <div style={{ padding: 0, animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Chấm công</Title>
                    <Text type="secondary">Theo dõi giờ làm và tăng ca</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setOtModalOpen(true)}>
                    Đăng ký tăng ca
                </Button>
            </div>

            {/* Late warning banner for today */}
            {todayRecord?.status === 'late' && (
                <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginBottom: 16 }}
                    message={
                        <span>
                            Hôm nay bạn vào muộn <strong>{todayRecord.late_minutes} phút</strong>.{' '}
                            {todayRecord.has_pardon_request
                                ? <>Đơn xin tha tội: <Tag color={PARDON_COLOR[todayRecord.pardon_status!]}>{PARDON_LABEL[todayRecord.pardon_status!]}</Tag></>
                                : todayRecord.penalty_amount > 0
                                    ? <>Bạn sẽ bị phạt <strong style={{ color: '#cf1322' }}>{fmtVND(todayRecord.penalty_amount)}</strong>. Hãy gửi đơn xin tha tội để được miễn phạt.</>
                                    : 'Đã được miễn phạt.'
                            }
                        </span>
                    }
                    action={
                        !todayRecord.has_pardon_request && todayRecord.penalty_amount > 0
                            ? <Button size="small" danger onClick={() => { setPardonRecord(todayRecord); setPardonModalOpen(true) }}>
                                Xin tha tội
                            </Button>
                            : undefined
                    }
                />
            )}

            {/* Clock Card */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Hôm nay"
                            value={todayRecord ? STATUS_LABEL[todayRecord.status] : 'Chưa chấm công'}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={todayRecord?.status === 'late' ? { color: '#fa8c16' } : undefined}
                        />
                        <Space style={{ marginTop: 12 }}>
                            <Button
                                type="primary" icon={<LoginOutlined />}
                                loading={clockInMutation.isPending}
                                disabled={!!todayRecord?.clock_in}
                                onClick={() => clockInMutation.mutate()}
                            >Vào</Button>
                            <Button
                                icon={<LogoutOutlined />}
                                loading={clockOutMutation.isPending}
                                disabled={!todayRecord?.clock_in || !!todayRecord?.clock_out}
                                onClick={() => clockOutMutation.mutate()}
                            >Ra</Button>
                        </Space>
                        {todayRecord?.clock_in && (
                            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                                Vào: {todayRecord.clock_in}
                                {todayRecord.clock_out && ` · Ra: ${todayRecord.clock_out}`}
                                {todayRecord.work_hours > 0 && ` · ${todayRecord.work_hours}h`}
                            </div>
                        )}
                        {todayRecord?.status === 'late' && todayRecord.penalty_amount > 0 && (
                            <div style={{ marginTop: 6, fontSize: 11, color: '#cf1322' }}>
                                <DollarOutlined /> Tiền phạt: {fmtVND(todayRecord.penalty_amount)}
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Card><Statistic title="Ngày có mặt" value={summaryData?.present ?? 0} valueStyle={{ color: '#52c41a' }} /></Card>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Card><Statistic title="Ngày vắng" value={summaryData?.absent ?? 0} valueStyle={{ color: '#ff4d4f' }} /></Card>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Card><Statistic title="Đi muộn" value={summaryData?.late ?? 0} valueStyle={{ color: '#fa8c16' }} /></Card>
                </Col>
                <Col xs={12} sm={6} lg={4}>
                    <Card><Statistic title="WFH" value={summaryData?.wfh ?? 0} valueStyle={{ color: '#1890ff' }} /></Card>
                </Col>
                <Col xs={12} sm={6} lg={2}>
                    <Card><Statistic title="Tổng giờ" value={summaryData?.total_hours ?? 0} suffix="h" /></Card>
                </Col>
            </Row>

            <Tabs defaultActiveKey="records" items={[
                {
                    key: 'records',
                    label: 'Lịch sử chấm công',
                    children: (
                        <Table
                            rowKey="id"
                            dataSource={myRecords}
                            columns={recordColumns}
                            pagination={{ pageSize: 20 }}
                            scroll={{ x: 750 }}
                            size="small"
                        />
                    )
                },
                {
                    key: 'overtime',
                    label: `Tăng ca (${overtimeRequests.filter((r: OvertimeRequest) => r.status === 'pending').length} chờ)`,

                    children: (
                        <Table
                            rowKey="id"
                            dataSource={overtimeRequests}
                            columns={otColumns}
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 700 }}
                            size="small"
                        />
                    )
                },
                {
                    key: 'pardons',
                    label: `Xin tha tội (${latePardons.filter((p: LatePardon) => p.status === 'pending').length} chờ)`,
                    children: (
                        <Table
                            rowKey="id"
                            dataSource={latePardons}
                            columns={pardonColumns}
                            pagination={{ pageSize: 10 }}
                            scroll={{ x: 700 }}
                            size="small"
                        />
                    )
                },
            ]} />

            {/* OT Request Modal */}
            <Modal
                title="Đăng ký tăng ca"
                open={otModalOpen}
                onCancel={() => { setOtModalOpen(false); form.resetFields() }}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleOTSubmit}>
                    <Form.Item name="date" label="Ngày tăng ca" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="start_time" label="Giờ bắt đầu" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="end_time" label="Giờ kết thúc" rules={[{ required: true }]}>
                                <TimePicker format="HH:mm" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}>
                        <TextArea rows={3} placeholder="Mô tả công việc cần làm thêm..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={otMutation.isPending} block>
                        Gửi đơn
                    </Button>
                </Form>
            </Modal>

            {/* Approve OT Modal */}
            <Modal
                title="Xử lý đơn tăng ca"
                open={approveModalOpen}
                onCancel={() => { setApproveModalOpen(false); approveForm.resetFields() }}
                footer={null}
                destroyOnClose
            >
                {selectedOT && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                        <div><strong>{selectedOT.employee_name}</strong> — {selectedOT.date}</div>
                        <div>{selectedOT.start_time} → {selectedOT.end_time} ({selectedOT.hours}h)</div>
                        <div style={{ color: '#666', marginTop: 4 }}>{selectedOT.reason}</div>
                    </div>
                )}
                <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
                    <Form.Item name="status" label="Quyết định" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'approved', label: '✅ Duyệt' },
                            { value: 'rejected', label: '❌ Từ chối' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="approval_comment" label="Ghi chú">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Row gutter={8}>
                        <Col span={12}>
                            <Button icon={<CheckCircleOutlined />} type="primary" htmlType="submit" loading={approveMutation.isPending} block>Xác nhận</Button>
                        </Col>
                        <Col span={12}>
                            <Button onClick={() => setApproveModalOpen(false)} block>Hủy</Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Late Pardon Request Modal */}
            <Modal
                title={<><WarningOutlined style={{ color: '#fa8c16', marginRight: 8 }} />Xin tha tội – đi muộn</>}
                open={pardonModalOpen}
                onCancel={() => { setPardonModalOpen(false); pardonForm.resetFields() }}
                footer={null}
                destroyOnClose
            >
                {pardonRecord && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
                        <div>Ngày: <strong>{pardonRecord.date}</strong></div>
                        <div>Giờ vào: <strong>{pardonRecord.clock_in}</strong> (muộn {pardonRecord.late_minutes} phút)</div>
                        <div style={{ color: '#cf1322', marginTop: 4 }}>
                            Tiền phạt nếu không được tha: <strong>{fmtVND(pardonRecord.penalty_amount)}</strong>
                        </div>
                    </div>
                )}
                <Form form={pardonForm} layout="vertical" onFinish={handlePardonSubmit}>
                    <Form.Item name="reason" label="Lý do xin tha tội" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
                        <TextArea rows={4} placeholder="Giải thích lý do đi muộn và lý do xin miễn phạt..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={pardonMutation.isPending} block>
                        Gửi đơn xin tha tội
                    </Button>
                </Form>
            </Modal>

            {/* Approve Pardon Modal (Manager/HR) */}
            <Modal
                title="Xử lý đơn xin tha tội"
                open={approvePardonModalOpen}
                onCancel={() => { setApprovePardonModalOpen(false); approvePardonForm.resetFields() }}
                footer={null}
                destroyOnClose
            >
                {selectedPardon && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                        <div><strong>{selectedPardon.employee_name}</strong> — {selectedPardon.date}</div>
                        <div>Đi muộn: <strong>{selectedPardon.late_minutes} phút</strong> — Tiền phạt: <strong style={{ color: '#cf1322' }}>{fmtVND(selectedPardon.penalty_amount)}</strong></div>
                        <div style={{ color: '#666', marginTop: 4 }}>{selectedPardon.reason}</div>
                    </div>
                )}
                <Form form={approvePardonForm} layout="vertical" onFinish={handleApprovePardon}>
                    <Form.Item name="status" label="Quyết định" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'approved', label: '✅ Tha tội – miễn phạt' },
                            { value: 'rejected', label: '❌ Không tha – giữ phạt' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="approval_comment" label="Ghi chú">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Row gutter={8}>
                        <Col span={12}>
                            <Button icon={<CheckCircleOutlined />} type="primary" htmlType="submit" loading={approvePardonMutation.isPending} block>Xác nhận</Button>
                        </Col>
                        <Col span={12}>
                            <Button onClick={() => setApprovePardonModalOpen(false)} block>Hủy</Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    )
}
