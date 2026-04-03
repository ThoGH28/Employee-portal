import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Button, Table, Tag, Tabs, Modal, Form,
    Input, Select, InputNumber, Slider, message, Typography, Progress, Space, Tooltip
} from 'antd'
import { PlusOutlined, EditOutlined, TrophyOutlined, StarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { performanceService } from '../../shared/services/performanceService'
import type { KPIGoal, PerformanceReview } from '../../shared/types/performance'
import { useAuthStore } from '../../shared/context/store'
import { isAdminOrHR, isDeptManagerOrAbove } from '../../shared/utils/permissions'

const { Title, Text } = Typography
const { TextArea } = Input

const PERIOD_OPTIONS = [
    { value: 'q1', label: 'Quý 1' },
    { value: 'q2', label: 'Quý 2' },
    { value: 'q3', label: 'Quý 3' },
    { value: 'q4', label: 'Quý 4' },
    { value: 'h1', label: '6 tháng đầu' },
    { value: 'h2', label: '6 tháng cuối' },
    { value: 'annual', label: 'Cả năm' },
]

const SCORE_COLOR = (s: number) => {
    if (s >= 4.5) return '#52c41a'
    if (s >= 3.5) return '#1890ff'
    if (s >= 2.5) return '#fa8c16'
    return '#ff4d4f'
}

export const Performance: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const [kpiModalOpen, setKpiModalOpen] = useState(false)
    const [editKpi, setEditKpi] = useState<KPIGoal | null>(null)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [editReview, setEditReview] = useState<PerformanceReview | null>(null)
    const [ackModalOpen, setAckModalOpen] = useState(false)
    const [ackReview, setAckReview] = useState<PerformanceReview | null>(null)
    const [kpiForm] = Form.useForm()
    const [reviewForm] = Form.useForm()
    const [ackForm] = Form.useForm()

    const isManager = isDeptManagerOrAbove(user)
    const isHRAdmin = isAdminOrHR(user)
    const currentYear = new Date().getFullYear()

    const { data: kpiGoals = [] } = useQuery({
        queryKey: ['kpi-goals'],
        queryFn: () => performanceService.getKPIGoals(),
    })

    const { data: reviews = [] } = useQuery({
        queryKey: ['performance-reviews'],
        queryFn: () => performanceService.getReviews(),
    })

    const kpiMutation = useMutation({
        mutationFn: (data: any) => editKpi
            ? performanceService.updateKPIGoal(editKpi.id, data)
            : performanceService.createKPIGoal(data),
        onSuccess: () => {
            message.success(editKpi ? 'Đã cập nhật KPI' : 'Đã tạo KPI')
            setKpiModalOpen(false); setEditKpi(null); kpiForm.resetFields()
            qc.invalidateQueries({ queryKey: ['kpi-goals'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi lưu KPI'),
    })

    const reviewMutation = useMutation({
        mutationFn: (data: any) => editReview
            ? performanceService.updateReview(editReview.id, data)
            : performanceService.createReview(data),
        onSuccess: () => {
            message.success(editReview ? 'Đã cập nhật đánh giá' : 'Đã tạo đánh giá')
            setReviewModalOpen(false); setEditReview(null); reviewForm.resetFields()
            qc.invalidateQueries({ queryKey: ['performance-reviews'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi lưu đánh giá'),
    })

    const ackMutation = useMutation({
        mutationFn: ({ id, comments }: { id: string; comments: string }) =>
            performanceService.acknowledgeReview(id, comments),
        onSuccess: () => {
            message.success('Đã xác nhận đánh giá')
            setAckModalOpen(false); setAckReview(null); ackForm.resetFields()
            qc.invalidateQueries({ queryKey: ['performance-reviews'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi xác nhận'),
    })

    const openEditKpi = (kpi: KPIGoal) => {
        setEditKpi(kpi)
        kpiForm.setFieldsValue({ ...kpi })
        setKpiModalOpen(true)
    }

    const openEditReview = (review: PerformanceReview) => {
        setEditReview(review)
        reviewForm.setFieldsValue({ ...review })
        setReviewModalOpen(true)
    }

    const kpiColumns: ColumnsType<KPIGoal> = [
        { title: 'KPI', dataIndex: 'title', ellipsis: true },
        ...(isManager ? [{ title: 'Nhân viên', dataIndex: 'employee_name', width: 140 }] : []),
        { title: 'Năm', dataIndex: 'year', width: 70 },
        { title: 'Kỳ', dataIndex: 'period_display', width: 100 },
        {
            title: 'Tiến độ', key: 'progress', width: 160,
            render: (_: any, r: KPIGoal) => (
                <Tooltip title={`${r.actual_value} / ${r.target_value} ${r.unit}`}>
                    <Progress
                        percent={Math.min(100, r.achievement_rate)}
                        size="small"
                        status={r.achievement_rate >= 100 ? 'success' : 'active'}
                    />
                </Tooltip>
            )
        },
        { title: 'Hoàn thành', dataIndex: 'achievement_rate', width: 100, render: (v: number) => `${v}%` },
        {
            title: 'TT', dataIndex: 'status', width: 110,
            render: (s: string, r: KPIGoal) => <Tag color={s === 'active' ? 'blue' : s === 'completed' ? 'green' : 'default'}>{r.status_display}</Tag>
        },
        {
            title: '', key: 'action', width: 60,
            render: (_: any, r: KPIGoal) => <Button size="small" icon={<EditOutlined />} onClick={() => openEditKpi(r)} />
        }
    ]

    const reviewColumns: ColumnsType<PerformanceReview> = [
        ...(isManager ? [{ title: 'Nhân viên', dataIndex: 'employee_name', width: 140 }] : []),
        { title: 'Kỳ đánh giá', dataIndex: 'review_period', width: 120 },
        { title: 'Năm', dataIndex: 'year', width: 70 },
        {
            title: 'Điểm tổng', dataIndex: 'overall_score', width: 100,
            render: (v: number) => <span style={{ fontWeight: 700, color: SCORE_COLOR(v) }}>{v}/5</span>
        },
        {
            title: 'TT', dataIndex: 'status', width: 120,
            render: (s: string, r: PerformanceReview) => <Tag color={s === 'submitted' ? 'blue' : s === 'acknowledged' ? 'green' : 'default'}>{r.status_display}</Tag>
        },
        {
            title: '', key: 'action', width: 120,
            render: (_: any, r: PerformanceReview) => (
                <Space>
                    {(isManager || isHRAdmin) && (
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEditReview(r)} />
                    )}
                    {r.status === 'submitted' && r.employee === user?.id && (
                        <Button size="small" type="primary" onClick={() => { setAckReview(r); setAckModalOpen(true) }}>Xác nhận</Button>
                    )}
                </Space>
            )
        }
    ]

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Hiệu suất & KPI</Title>
                    <Text type="secondary">Theo dõi mục tiêu và đánh giá định kỳ</Text>
                </div>
                <Space>
                    {isManager && (
                        <Button icon={<StarOutlined />} onClick={() => { setEditReview(null); reviewForm.resetFields(); setReviewModalOpen(true) }}>
                            Tạo đánh giá
                        </Button>
                    )}
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditKpi(null); kpiForm.resetFields(); setKpiModalOpen(true) }}>
                        Thêm KPI
                    </Button>
                </Space>
            </div>

            <Tabs defaultActiveKey="kpi" items={[
                {
                    key: 'kpi',
                    label: <span><TrophyOutlined /> KPI Goals ({kpiGoals.length})</span>,
                    children: (
                        <Table rowKey="id" dataSource={kpiGoals} columns={kpiColumns} size="small" scroll={{ x: 700 }} pagination={{ pageSize: 10 }} />
                    )
                },
                {
                    key: 'reviews',
                    label: <span><StarOutlined /> Đánh giá ({reviews.filter(r => r.status === 'submitted').length} chờ)</span>,
                    children: (
                        <Table rowKey="id" dataSource={reviews} columns={reviewColumns} size="small" scroll={{ x: 700 }} pagination={{ pageSize: 10 }} />
                    )
                }
            ]} />

            {/* KPI Modal */}
            <Modal
                title={editKpi ? 'Cập nhật KPI' : 'Thêm KPI mới'}
                open={kpiModalOpen}
                onCancel={() => { setKpiModalOpen(false); setEditKpi(null); kpiForm.resetFields() }}
                footer={null} destroyOnClose
            >
                <Form form={kpiForm} layout="vertical" onFinish={v => kpiMutation.mutate(v)}>
                    <Form.Item name="title" label="Tên KPI" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="year" label="Năm" rules={[{ required: true }]} initialValue={currentYear}>
                                <InputNumber min={2020} max={2030} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="period" label="Kỳ" rules={[{ required: true }]}>
                                <Select options={PERIOD_OPTIONS} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="target_value" label="Mục tiêu" rules={[{ required: true }]}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="actual_value" label="Thực tế" initialValue={0}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="unit" label="Đơn vị">
                                <Input placeholder="%, VNĐ, đơn..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="weight" label="Trọng số (%)" initialValue={100}>
                        <Slider min={1} max={100} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={kpiMutation.isPending} block>Lưu</Button>
                </Form>
            </Modal>

            {/* Review Modal */}
            <Modal
                title={editReview ? 'Cập nhật đánh giá' : 'Tạo đánh giá hiệu suất'}
                open={reviewModalOpen}
                onCancel={() => { setReviewModalOpen(false); setEditReview(null); reviewForm.resetFields() }}
                footer={null} width={600} destroyOnClose
            >
                <Form form={reviewForm} layout="vertical" onFinish={v => reviewMutation.mutate(v)}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="review_period" label="Kỳ (vd: Q1-2026)" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="year" label="Năm" rules={[{ required: true }]} initialValue={currentYear}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    {isManager && (
                        <Form.Item name="employee" label="Nhân viên" rules={[{ required: !editReview }]}>
                            <Input placeholder="Employee ID" />
                        </Form.Item>
                    )}
                    {(['work_quality', 'work_efficiency', 'teamwork', 'initiative'] as const).map(field => (
                        <Form.Item key={field} name={field} label={{
                            work_quality: 'Chất lượng công việc', work_efficiency: 'Hiệu quả làm việc',
                            teamwork: 'Làm việc nhóm', initiative: 'Chủ động sáng tạo'
                        }[field]} initialValue={3} rules={[{ required: true }]}>
                            <Slider min={1} max={5} marks={{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }} />
                        </Form.Item>
                    ))}
                    <Form.Item name="strengths" label="Điểm mạnh"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="areas_for_improvement" label="Cần cải thiện"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="goals_next_period" label="Mục tiêu kỳ sau"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="reviewer_comments" label="Nhận xét của người đánh giá"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="status" label="Trạng thái" initialValue="draft">
                        <Select options={[{ value: 'draft', label: 'Nháp' }, { value: 'submitted', label: 'Gửi ngay' }]} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={reviewMutation.isPending} block>Lưu</Button>
                </Form>
            </Modal>

            {/* Acknowledge Modal */}
            <Modal
                title="Xác nhận đánh giá hiệu suất"
                open={ackModalOpen}
                onCancel={() => { setAckModalOpen(false); ackForm.resetFields() }}
                footer={null} destroyOnClose
            >
                {ackReview && (
                    <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                        <div><strong>{ackReview.review_period} {ackReview.year}</strong></div>
                        <div>Điểm tổng: <strong style={{ color: SCORE_COLOR(ackReview.overall_score) }}>{ackReview.overall_score}/5</strong></div>
                        {ackReview.reviewer_comments && <div style={{ marginTop: 4, color: '#666' }}>{ackReview.reviewer_comments}</div>}
                    </div>
                )}
                <Form form={ackForm} layout="vertical" onFinish={v => ackReview && ackMutation.mutate({ id: ackReview.id, comments: v.employee_comments })}>
                    <Form.Item name="employee_comments" label="Ý kiến của bạn (tùy chọn)">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={ackMutation.isPending} block>Xác nhận & Ký tên điện tử</Button>
                </Form>
            </Modal>
        </div>
    )
}
