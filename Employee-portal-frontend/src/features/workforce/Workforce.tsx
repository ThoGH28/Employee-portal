import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Card, Button, Table, Tag, Tabs, Modal, Form,
    Input, Select, DatePicker, InputNumber, message, Typography, Space, Calendar, Badge, Upload
} from 'antd'
import { PlusOutlined, UploadOutlined, HomeOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { workforceService } from '../../shared/services/workforceService'
import type { WFHRequest, Contract, PublicHoliday } from '../../shared/types/workforce'
import { useAuthStore } from '../../shared/context/store'
import { isAdminOrHR, isDeptManager } from '../../shared/utils/permissions'

const { Title, Text } = Typography
const { TextArea } = Input

const WFH_STATUS_COLOR: Record<string, string> = {
    pending: 'processing', approved: 'success', rejected: 'error', cancelled: 'default'
}
const WFH_STATUS_LABEL: Record<string, string> = {
    pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', cancelled: 'Đã hủy'
}

export const Workforce: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const isHRAdmin = isAdminOrHR(user)
    const isManager = isDeptManager(user)
    const canApproveWFH = isHRAdmin || isManager

    const [wfhModalOpen, setWfhModalOpen] = useState(false)
    const [contractModalOpen, setContractModalOpen] = useState(false)
    const [holidayModalOpen, setHolidayModalOpen] = useState(false)
    const [wfhForm] = Form.useForm()
    const [contractForm] = Form.useForm()
    const [holidayForm] = Form.useForm()

    const { data: wfhRequests = [] } = useQuery({
        queryKey: ['wfh-requests'],
        queryFn: () => workforceService.getWFHRequests(),
    })

    const { data: contracts = [] } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => workforceService.getContracts(),
        enabled: isHRAdmin,
    })

    const { data: holidays = [] } = useQuery({
        queryKey: ['public-holidays'],
        queryFn: () => workforceService.getHolidays(),
    })

    const wfhMutation = useMutation({
        mutationFn: (values: any) => workforceService.createWFHRequest({
            ...values,
            start_date: values.start_date?.format('YYYY-MM-DD'),
            end_date: values.end_date?.format('YYYY-MM-DD'),
        }),
        onSuccess: () => {
            message.success('Đã gửi yêu cầu WFH')
            setWfhModalOpen(false); wfhForm.resetFields()
            qc.invalidateQueries({ queryKey: ['wfh-requests'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi tạo yêu cầu'),
    })

    const approveWFHMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: string }) =>
            workforceService.approveWFH(id, { status: action }),
        onSuccess: () => {
            message.success('Đã xử lý yêu cầu WFH')
            qc.invalidateQueries({ queryKey: ['wfh-requests'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi'),
    })

    const cancelWFHMutation = useMutation({
        mutationFn: workforceService.cancelWFH,
        onSuccess: () => {
            message.success('Đã hủy yêu cầu WFH')
            qc.invalidateQueries({ queryKey: ['wfh-requests'] })
        },
    })

    const contractMutation = useMutation({
        mutationFn: (values: any) => {
            const fd = new FormData()
            Object.entries(values).forEach(([k, v]) => {
                if (v === undefined || v === null) return
                if (k === 'contract_file' && v && (v as any).fileList?.length > 0) {
                    fd.append(k, (v as any).fileList[0].originFileObj)
                } else if (k === 'start_date' || k === 'end_date') {
                    if (v) fd.append(k, (v as any).format('YYYY-MM-DD'))
                } else {
                    fd.append(k, String(v))
                }
            })
            return workforceService.createContract(fd)
        },
        onSuccess: () => {
            message.success('Đã thêm hợp đồng')
            setContractModalOpen(false); contractForm.resetFields()
            qc.invalidateQueries({ queryKey: ['contracts'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi thêm hợp đồng'),
    })

    const holidayMutation = useMutation({
        mutationFn: (values: any) => workforceService.createHoliday({
            ...values, date: values.date?.format('YYYY-MM-DD')
        }),
        onSuccess: () => {
            message.success('Đã thêm ngày lễ')
            setHolidayModalOpen(false); holidayForm.resetFields()
            qc.invalidateQueries({ queryKey: ['public-holidays'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi thêm ngày lễ'),
    })

    const deleteHolidayMutation = useMutation({
        mutationFn: workforceService.deleteHoliday,
        onSuccess: () => { message.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['public-holidays'] }) },
    })

    const dateCellRender = (date: dayjs.Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD')
        const holiday = holidays.find((h: PublicHoliday) => h.date === dateStr)
        if (holiday) return <Badge status="error" text={holiday.name} style={{ fontSize: 10 }} />
        return null
    }

    const wfhColumns: ColumnsType<WFHRequest> = [
        { title: 'Nhân viên', dataIndex: 'employee_name', width: 140 },
        { title: 'Từ ngày', dataIndex: 'start_date', width: 105 },
        { title: 'Đến ngày', dataIndex: 'end_date', width: 105 },
        { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
        {
            title: 'TT', dataIndex: 'status', width: 120,
            render: (s: string) => <Tag color={WFH_STATUS_COLOR[s]}>{WFH_STATUS_LABEL[s]}</Tag>
        },
        {
            title: '', key: 'actions', width: 160,
            render: (_: any, r: WFHRequest) => (
                <Space size={4}>
                    {canApproveWFH && r.status === 'pending' && (
                        <>
                            <Button size="small" type="primary" onClick={() => approveWFHMutation.mutate({ id: String(r.id), action: 'approved' })}>Duyệt</Button>
                            <Button size="small" danger onClick={() => approveWFHMutation.mutate({ id: String(r.id), action: 'rejected' })}>Từ chối</Button>
                        </>
                    )}
                    {!canApproveWFH && r.status === 'pending' && (
                        <Button size="small" onClick={() => cancelWFHMutation.mutate(String(r.id))}>Hủy</Button>
                    )}
                </Space>
            )
        }
    ]

    const contractColumns: ColumnsType<Contract> = [
        { title: 'Nhân viên', dataIndex: 'employee_name', width: 140 },
        { title: 'Loại', dataIndex: 'contract_type_display', width: 130 },
        { title: 'Ngày bắt đầu', dataIndex: 'start_date', width: 110 },
        { title: 'Ngày kết thúc', dataIndex: 'end_date', width: 110, render: (d: string | null) => d ?? <Tag color="green">Không HĐ</Tag> },
        { title: 'Lương cơ bản', dataIndex: 'basic_salary', width: 130, render: (v: number) => `${Number(v).toLocaleString('vi-VN')} đ` },
        {
            title: 'File', dataIndex: 'contract_file', width: 60,
            render: (f: string | null) => f ? <a href={f} target="_blank" rel="noreferrer">Xem</a> : '—'
        },
        {
            title: 'TT', dataIndex: 'is_active', width: 80,
            render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Hiệu lực' : 'Hết hạn'}</Tag>
        }
    ]

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Lao động & Hợp đồng</Title>
                    <Text type="secondary">WFH, hợp đồng lao động và lịch nghỉ lễ</Text>
                </div>
            </div>

            <Tabs defaultActiveKey="wfh" items={[
                {
                    key: 'wfh',
                    label: <span><HomeOutlined /> WFH ({wfhRequests.filter((r: WFHRequest) => r.status === 'pending').length} chờ duyệt)</span>,
                    children: (
                        <>
                            <div style={{ marginBottom: 12, textAlign: 'right' }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setWfhModalOpen(true)}>
                                    Đăng ký WFH
                                </Button>
                            </div>
                            <Table rowKey="id" dataSource={wfhRequests} columns={wfhColumns} size="small" scroll={{ x: 700 }} pagination={{ pageSize: 15 }} />
                        </>
                    )
                },
                ...(isHRAdmin ? [{
                    key: 'contracts',
                    label: <span><FileTextOutlined /> Hợp đồng ({contracts.length})</span>,
                    children: (
                        <>
                            <div style={{ marginBottom: 12, textAlign: 'right' }}>
                                <Button type="primary" icon={<PlusOutlined />} onClick={() => setContractModalOpen(true)}>
                                    Thêm hợp đồng
                                </Button>
                            </div>
                            <Table rowKey="id" dataSource={contracts} columns={contractColumns} size="small" scroll={{ x: 900 }} pagination={{ pageSize: 15 }} />
                        </>
                    )
                }] : []),
                {
                    key: 'holidays',
                    label: <span><CalendarOutlined /> Lịch nghỉ lễ ({holidays.length})</span>,
                    children: (
                        <Row gutter={16}>
                            <Col xs={24} lg={16}>
                                <Card size="small">
                                    <Calendar fullscreen={false} cellRender={dateCellRender} />
                                </Card>
                            </Col>
                            <Col xs={24} lg={8}>
                                <Card title="Danh sách ngày lễ" extra={isHRAdmin && <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setHolidayModalOpen(true)}>Thêm</Button>}>
                                    <Table rowKey="id" dataSource={holidays} size="small" pagination={false}
                                        columns={[
                                            { title: 'Ngày', dataIndex: 'date', width: 100 },
                                            { title: 'Tên', dataIndex: 'name' },
                                            { title: 'TT', dataIndex: 'is_paid', width: 70, render: (v: boolean) => <Tag color={v ? 'green' : 'default'} style={{ fontSize: 10 }}>{v ? 'Có TL' : 'KTL'}</Tag> },
                                            ...(isHRAdmin ? [{
                                                title: '', key: 'del', width: 40,
                                                render: (_: any, r: PublicHoliday) => (
                                                    <Button size="small" type="text" danger onClick={() => deleteHolidayMutation.mutate(r.id)}>X</Button>
                                                )
                                            }] : [])
                                        ]}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    )
                }
            ]} />

            {/* WFH Modal */}
            <Modal title="Đăng ký làm việc từ xa (WFH)" open={wfhModalOpen} onCancel={() => { setWfhModalOpen(false); wfhForm.resetFields() }} footer={null} destroyOnClose>
                <Form form={wfhForm} layout="vertical" onFinish={wfhMutation.mutate}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="start_date" label="Từ ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="Đến ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
                    <Button type="primary" htmlType="submit" loading={wfhMutation.isPending} block>Gửi yêu cầu</Button>
                </Form>
            </Modal>

            {/* Contract Modal */}
            <Modal title="Thêm hợp đồng" open={contractModalOpen} onCancel={() => { setContractModalOpen(false); contractForm.resetFields() }} footer={null} destroyOnClose width={520}>
                <Form form={contractForm} layout="vertical" onFinish={contractMutation.mutate}>
                    <Form.Item name="employee" label="Nhân viên (ID)" rules={[{ required: true }]}><Input type="number" /></Form.Item>
                    <Form.Item name="contract_type" label="Loại hợp đồng" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'probation', label: 'Thử việc' }, { value: 'fixed', label: 'Có thời hạn' },
                            { value: 'indefinite', label: 'Không thời hạn' }, { value: 'part_time', label: 'Bán thời gian' },
                            { value: 'freelance', label: 'Cộng tác viên' },
                        ]} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="Ngày kết thúc"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="basic_salary" label="Lương cơ bản (đ)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
                    <Form.Item name="notes" label="Ghi chú"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="contract_file" label="File hợp đồng">
                        <Upload beforeUpload={() => false} maxCount={1}><Button icon={<UploadOutlined />}>Chọn file</Button></Upload>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={contractMutation.isPending} block>Lưu hợp đồng</Button>
                </Form>
            </Modal>

            {/* Holiday Modal */}
            <Modal title="Thêm ngày nghỉ lễ" open={holidayModalOpen} onCancel={() => { setHolidayModalOpen(false); holidayForm.resetFields() }} footer={null} destroyOnClose>
                <Form form={holidayForm} layout="vertical" onFinish={holidayMutation.mutate}>
                    <Form.Item name="name" label="Tên ngày lễ" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="date" label="Ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="is_paid" label="Có lương?" initialValue={true}>
                        <Select options={[{ value: true, label: 'Có lương' }, { value: false, label: 'Không lương' }]} />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả"><TextArea rows={2} /></Form.Item>
                    <Button type="primary" htmlType="submit" loading={holidayMutation.isPending} block>Thêm</Button>
                </Form>
            </Modal>
        </div>
    )
}
