import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Card, Button, Table, Tag, Tabs, Space, Statistic,
    Modal, Form, TimePicker, DatePicker, Input, Select, message, Typography
} from 'antd'
import {
    ClockCircleOutlined, LoginOutlined, LogoutOutlined, PlusOutlined,
    CheckCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { attendanceService } from '../../shared/services/attendanceService'
import type { AttendanceRecord, OvertimeRequest } from '../../shared/types/attendance'
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

export const Attendance: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const [otModalOpen, setOtModalOpen] = useState(false)
    const [approveModalOpen, setApproveModalOpen] = useState(false)
    const [selectedOT, setSelectedOT] = useState<OvertimeRequest | null>(null)
    const [form] = Form.useForm()
    const [approveForm] = Form.useForm()

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

    const clockInMutation = useMutation({
        mutationFn: attendanceService.clockIn,
        onSuccess: () => { message.success('Đã chấm công vào'); qc.invalidateQueries({ queryKey: ['attendance-today'] }) },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi chấm công vào'),
    })

    const clockOutMutation = useMutation({
        mutationFn: attendanceService.clockOut,
        onSuccess: () => { message.success('Đã chấm công ra'); qc.invalidateQueries({ queryKey: ['attendance-today'] }) },
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

    const recordColumns: ColumnsType<AttendanceRecord> = [
        { title: 'Ngày', dataIndex: 'date', width: 110 },
        { title: 'Vào', dataIndex: 'clock_in', width: 90, render: v => v || '—' },
        { title: 'Ra', dataIndex: 'clock_out', width: 90, render: v => v || '—' },
        { title: 'Giờ làm', dataIndex: 'work_hours', width: 90, render: v => `${v}h` },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 110,
            render: s => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
        },
        { title: 'Ghi chú', dataIndex: 'notes', ellipsis: true },
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

            {/* Clock Card */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Hôm nay"
                            value={todayRecord ? STATUS_LABEL[todayRecord.status] : 'Chưa chấm công'}
                            prefix={<ClockCircleOutlined />}
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
                            scroll={{ x: 600 }}
                            size="small"
                        />
                    )
                },
                {
                    key: 'overtime',
                    label: `Tăng ca (${overtimeRequests.filter(r => r.status === 'pending').length} chờ)`,
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
                }
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
        </div>
    )
}
