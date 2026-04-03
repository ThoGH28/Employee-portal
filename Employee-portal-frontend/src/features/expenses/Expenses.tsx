import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Card, Button, Table, Tag, Modal, Form,
    Input, Select, DatePicker, InputNumber, message, Typography, Space, Divider, Statistic, Upload
} from 'antd'
import { PlusOutlined, UploadOutlined, WalletOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { expenseService } from '../../shared/services/expenseService'
import type { ExpenseReport } from '../../shared/types/expenses'
import { useAuthStore } from '../../shared/context/store'
import { isAdminOrHR } from '../../shared/utils/permissions'

const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_COLOR: Record<string, string> = {
    draft: 'default', submitted: 'processing', approved: 'success', rejected: 'error', paid: 'cyan'
}
const STATUS_LABEL: Record<string, string> = {
    draft: 'Nháp', submitted: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', paid: 'Đã thanh toán'
}

const CATEGORY_LABEL: Record<string, string> = {
    travel: 'Di chuyển', accommodation: 'Lưu trú', meal: 'Ăn uống',
    entertainment: 'Tiếp khách', supplies: 'Văn phòng phẩm', training: 'Đào tạo', other: 'Khác'
}

export const Expenses: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const isHRAdmin = isAdminOrHR(user)

    const [createReportOpen, setCreateReportOpen] = useState(false)
    const [addItemOpen, setAddItemOpen] = useState(false)
    const [viewReportOpen, setViewReportOpen] = useState(false)
    const [processOpen, setProcessOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<ExpenseReport | null>(null)
    const [reportForm] = Form.useForm()
    const [itemForm] = Form.useForm()
    const [processForm] = Form.useForm()

    const { data: reports = [] } = useQuery({
        queryKey: ['expense-reports'],
        queryFn: () => expenseService.getReports(),
    })

    const { data: reportDetail } = useQuery({
        queryKey: ['expense-report-detail', selectedReport?.id],
        queryFn: () => selectedReport ? expenseService.getReport(selectedReport.id) : null,
        enabled: !!selectedReport && viewReportOpen,
    })

    const createReportMutation = useMutation({
        mutationFn: (values: any) => expenseService.createReport({
            title: values.title, description: values.description
        }),
        onSuccess: () => {
            message.success('Đã tạo phiếu chi phí')
            setCreateReportOpen(false); reportForm.resetFields()
            qc.invalidateQueries({ queryKey: ['expense-reports'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi tạo phiếu'),
    })

    const addItemMutation = useMutation({
        mutationFn: (values: any) => {
            const fd = new FormData()
            Object.entries(values).forEach(([k, v]) => {
                if (v === undefined || v === null) return
                if (k === 'receipt' && v && (v as any).fileList?.length > 0) {
                    fd.append(k, (v as any).fileList[0].originFileObj)
                } else if (k === 'expense_date') {
                    if (v) fd.append(k, (v as any).format('YYYY-MM-DD'))
                } else {
                    fd.append(k, String(v))
                }
            })
            fd.append('report', String(selectedReport!.id))
            return expenseService.addItem(fd)
        },
        onSuccess: () => {
            message.success('Đã thêm chi phí')
            setAddItemOpen(false); itemForm.resetFields()
            qc.invalidateQueries({ queryKey: ['expense-reports', 'expense-report-detail', selectedReport?.id] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi thêm chi phí'),
    })

    const submitMutation = useMutation({
        mutationFn: expenseService.submitReport,
        onSuccess: () => {
            message.success('Đã nộp phiếu chi phí')
            setViewReportOpen(false)
            qc.invalidateQueries({ queryKey: ['expense-reports'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi nộp phiếu'),
    })

    const processMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => expenseService.processReport(id, data),
        onSuccess: () => {
            message.success('Đã xử lý phiếu')
            setProcessOpen(false); processForm.resetFields(); setSelectedReport(null)
            qc.invalidateQueries({ queryKey: ['expense-reports'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi xử lý'),
    })

    const fmtMoney = (v: number | string) => `${Number(v).toLocaleString('vi-VN')} đ`

    const reportColumns: ColumnsType<ExpenseReport> = [
        {
            title: 'Tiêu đề', dataIndex: 'title', ellipsis: true,
            render: (title: string, r: ExpenseReport) => (
                <Button type="link" style={{ padding: 0 }} onClick={() => { setSelectedReport(r); setViewReportOpen(true) }}>{title}</Button>
            )
        },
        { title: 'Thời gian', key: 'period', width: 160, render: (_: any, r: ExpenseReport) => `${(r as any).from_date ?? ''} → ${(r as any).to_date ?? ''}` },
        { title: 'Tổng (đ)', dataIndex: 'total_amount', width: 130, render: fmtMoney },
        {
            title: 'TT', dataIndex: 'status', width: 120,
            render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
        },
        {
            title: '', key: 'actions', width: 130,
            render: (_: any, r: ExpenseReport) => (
                <Space size={4}>
                    {isHRAdmin && r.status === 'submitted' && (
                        <Button size="small" type="primary" onClick={() => { setSelectedReport(r); setProcessOpen(true) }}>Xử lý</Button>
                    )}
                    {!isHRAdmin && r.status === 'draft' && (
                        <Button size="small" onClick={() => { setSelectedReport(r); setAddItemOpen(true) }}>+ Chi phí</Button>
                    )}
                </Space>
            )
        }
    ]

    const totalApproved = reports.filter((r: ExpenseReport) => r.status === 'approved' || r.status === 'paid')
        .reduce((s: number, r: ExpenseReport) => s + Number(r.total_amount), 0)
    const totalPending = reports.filter((r: ExpenseReport) => r.status === 'submitted')
        .reduce((s: number, r: ExpenseReport) => s + Number(r.total_amount), 0)

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý chi phí</Title>
                    <Text type="secondary">Phiếu chi phí công tác, tiếp khách và các khoản thanh toán</Text>
                </div>
                {!isHRAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateReportOpen(true)}>
                        Tạo phiếu chi phí
                    </Button>
                )}
            </div>

            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}><Card size="small"><Statistic title="Chờ duyệt" value={reports.filter((r: ExpenseReport) => r.status === 'submitted').length} suffix="phiếu" valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />} /></Card></Col>
                <Col span={6}><Card size="small"><Statistic title="Đã duyệt" value={reports.filter((r: ExpenseReport) => r.status === 'approved').length} suffix="phiếu" valueStyle={{ color: '#52c41a' }} prefix={<CheckOutlined />} /></Card></Col>
                <Col span={6}><Card size="small"><Statistic title="Tổng đã duyệt" value={totalApproved.toLocaleString('vi-VN')} suffix="đ" valueStyle={{ color: '#722ed1' }} prefix={<WalletOutlined />} /></Card></Col>
                <Col span={6}><Card size="small"><Statistic title="Đang chờ TT" value={totalPending.toLocaleString('vi-VN')} suffix="đ" valueStyle={{ color: '#fa8c16' }} /></Card></Col>
            </Row>

            <Table rowKey="id" dataSource={reports} columns={reportColumns} size="small" scroll={{ x: 700 }} pagination={{ pageSize: 15 }} />

            {/* Create Report Modal */}
            <Modal title="Tạo phiếu chi phí" open={createReportOpen} onCancel={() => { setCreateReportOpen(false); reportForm.resetFields() }} footer={null} destroyOnClose>
                <Form form={reportForm} layout="vertical" onFinish={createReportMutation.mutate}>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><TextArea rows={2} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="from_date" label="Từ ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="to_date" label="Đến ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Button type="primary" htmlType="submit" loading={createReportMutation.isPending} block>Tạo phiếu</Button>
                </Form>
            </Modal>

            {/* Add Expense Item Modal */}
            <Modal title="Thêm chi phí" open={addItemOpen} onCancel={() => { setAddItemOpen(false); itemForm.resetFields() }} footer={null} destroyOnClose>
                <Form form={itemForm} layout="vertical" onFinish={addItemMutation.mutate}>
                    <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
                        <Select options={Object.entries(CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="amount" label="Số tiền (đ)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="expense_date" label="Ngày" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="vendor" label="Nhà cung cấp"><Input /></Form.Item>
                    <Form.Item name="receipt" label="Hóa đơn">
                        <Upload beforeUpload={() => false} maxCount={1}><Button icon={<UploadOutlined />}>Chọn file</Button></Upload>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={addItemMutation.isPending} block>Thêm</Button>
                </Form>
            </Modal>

            {/* View Report Modal */}
            <Modal
                title={selectedReport?.title}
                open={viewReportOpen}
                onCancel={() => { setViewReportOpen(false); setSelectedReport(null) }}
                footer={selectedReport?.status === 'draft' ? [
                    <Button key="submit" type="primary" loading={submitMutation.isPending} onClick={() => submitMutation.mutate(selectedReport!.id)}>
                        Nộp phiếu
                    </Button>
                ] : null}
                destroyOnClose width={640}
            >
                {reportDetail && (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <Tag color={STATUS_COLOR[reportDetail.status]}>{STATUS_LABEL[reportDetail.status]}</Tag>
                            <Text type="secondary" style={{ marginLeft: 8 }}>{(reportDetail as any).from_date} → {(reportDetail as any).to_date}</Text>
                        </div>
                        <Table rowKey="id" dataSource={(reportDetail as any).items || []} size="small" pagination={false}
                            columns={[
                                { title: 'Mô tả', dataIndex: 'description' },
                                { title: 'Danh mục', dataIndex: 'category', width: 100, render: (c: string) => CATEGORY_LABEL[c] || c },
                                { title: 'Ngày', dataIndex: 'expense_date', width: 100 },
                                { title: 'Số tiền', dataIndex: 'amount', width: 110, render: fmtMoney },
                            ]}
                        />
                        <Divider />
                        <div style={{ textAlign: 'right' }}>
                            <Text strong>Tổng cộng: </Text>
                            <Text strong style={{ fontSize: 16 }}>{fmtMoney(reportDetail.total_amount)}</Text>
                        </div>
                    </>
                )}
            </Modal>

            {/* Process Report Modal */}
            <Modal title="Xử lý phiếu chi phí" open={processOpen} onCancel={() => { setProcessOpen(false); processForm.resetFields() }} footer={null} destroyOnClose>
                <Form form={processForm} layout="vertical" onFinish={v => processMutation.mutate({ id: selectedReport!.id, data: v })}>
                    <Form.Item name="action" label="Hành động" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'approve', label: 'Phê duyệt' },
                            { value: 'reject', label: 'Từ chối' },
                            { value: 'pay', label: 'Đánh dấu đã thanh toán' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="reviewer_notes" label="Ghi chú"><TextArea rows={2} /></Form.Item>
                    <Button type="primary" htmlType="submit" loading={processMutation.isPending} block>Xác nhận</Button>
                </Form>
            </Modal>
        </div>
    )
}
