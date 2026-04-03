import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Button, Table, Tag, Modal, Form, Input, Select, DatePicker,
    message, Typography, Space, Radio, Rate, Divider, Progress, List
} from 'antd'
import { PlusOutlined, FormOutlined, BarChartOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { surveyService } from '../../shared/services/surveyService'
import type { Survey, SurveyQuestion } from '../../shared/types/survey'
import { useAuthStore } from '../../shared/context/store'
import { isAdminOrHR } from '../../shared/utils/permissions'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

export const Surveys: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const isHRAdmin = isAdminOrHR(user)

    const [createOpen, setCreateOpen] = useState(false)
    const [takeOpen, setTakeOpen] = useState(false)
    const [resultsOpen, setResultsOpen] = useState(false)
    const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [createForm] = Form.useForm()

    const { data: surveys = [] } = useQuery({
        queryKey: ['surveys'],
        queryFn: () => surveyService.getSurveys(),
    })

    const { data: surveyDetail } = useQuery({
        queryKey: ['survey-detail', selectedSurvey?.id],
        queryFn: () => selectedSurvey ? surveyService.getSurvey(selectedSurvey.id) : null,
        enabled: !!selectedSurvey && (takeOpen || resultsOpen),
    })

    const createMutation = useMutation({
        mutationFn: (values: any) => surveyService.createSurvey({
            title: values.title,
            description: values.description,
            is_anonymous: values.is_anonymous ?? false,
            target_department: values.target_department ?? 'all',
            start_date: values.dateRange[0]?.format('YYYY-MM-DD'),
            end_date: values.dateRange[1]?.format('YYYY-MM-DD'),
        }),
        onSuccess: () => {
            message.success('Đã tạo khảo sát')
            setCreateOpen(false); createForm.resetFields()
            qc.invalidateQueries({ queryKey: ['surveys'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi tạo khảo sát'),
    })

    const submitMutation = useMutation({
        mutationFn: ({ surveyId, answers: ans }: { surveyId: string; answers: any[] }) =>
            surveyService.submitResponse(surveyId, { answers: ans } as any),
        onSuccess: () => {
            message.success('Đã gửi câu trả lời thành công!')
            setTakeOpen(false); setAnswers({}); setSelectedSurvey(null)
            qc.invalidateQueries({ queryKey: ['surveys'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi gửi câu trả lời'),
    })

    const handleSubmitSurvey = () => {
        if (!surveyDetail || !selectedSurvey) return
        const questions: SurveyQuestion[] = (surveyDetail as any).questions || []
        const requiredQ = questions.filter(q => q.is_required)
        const missing = requiredQ.filter(q => answers[q.id] === undefined || answers[q.id] === '' || answers[q.id] === null)
        if (missing.length > 0) {
            message.warning(`Vui lòng trả lời ${missing.length} câu hỏi bắt buộc`)
            return
        }
        const ans = questions.map(q => ({
            question: q.id,
            text_answer: q.question_type === 'text' ? answers[q.id] : undefined,
            rating_answer: q.question_type === 'rating' ? answers[q.id] : undefined,
            choice_answer: q.question_type === 'single_choice' ? answers[q.id] : undefined,
            multi_answer: q.question_type === 'multi_choice' ? answers[q.id] : undefined,
        }))
        submitMutation.mutate({ surveyId: selectedSurvey.id, answers: ans })
    }

    const columns: ColumnsType<Survey> = [
        {
            title: 'Tiêu đề', dataIndex: 'title',
            render: (t: string, r: Survey) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{t}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.target_department}</div>
                </div>
            )
        },
        { title: 'Bắt đầu', dataIndex: 'start_date', width: 105 },
        { title: 'Kết thúc', dataIndex: 'end_date', width: 105 },
        {
            title: 'TT', dataIndex: 'status', width: 100,
            render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? 'Đang mở' : 'Đã đóng'}</Tag>
        },
        { title: 'Phản hồi', dataIndex: 'response_count', width: 80 },
        {
            title: '', key: 'actions', width: 140,
            render: (_: any, r: Survey) => (
                <Space size={4}>
                    {r.status === 'active' && (
                        <Button size="small" type="primary" icon={<FormOutlined />}
                            onClick={() => { setSelectedSurvey(r); setTakeOpen(true) }}>
                            Tham gia
                        </Button>
                    )}
                    {isHRAdmin && (
                        <Button size="small" icon={<BarChartOutlined />}
                            onClick={() => { setSelectedSurvey(r); setResultsOpen(true) }}>
                            Kết quả
                        </Button>
                    )}
                </Space>
            )
        }
    ]

    const renderQuestion = (q: SurveyQuestion, index: number) => {
        const label = <span>{index + 1}. {q.text}{q.is_required && <span style={{ color: 'red' }}> *</span>}</span>
        switch (q.question_type) {
            case 'text':
                return (
                    <div key={q.id} style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 8 }}>{label}</div>
                        <TextArea rows={3} value={answers[q.id] || ''} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} />
                    </div>
                )
            case 'rating':
                return (
                    <div key={q.id} style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 8 }}>{label}</div>
                        <Rate value={answers[q.id]} onChange={v => setAnswers(p => ({ ...p, [q.id]: v }))} />
                    </div>
                )
            case 'single_choice':
                return (
                    <div key={q.id} style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 8 }}>{label}</div>
                        <Radio.Group value={answers[q.id]} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}>
                            <Space direction="vertical">
                                {(q.choices || []).map((c: string) => <Radio key={c} value={c}>{c}</Radio>)}
                            </Space>
                        </Radio.Group>
                    </div>
                )
            case 'multi_choice':
                return (
                    <div key={q.id} style={{ marginBottom: 20 }}>
                        <div style={{ marginBottom: 8 }}>{label}</div>
                        <Select
                            mode="multiple" style={{ width: '100%' }}
                            options={(q.choices || []).map((c: string) => ({ value: c, label: c }))}
                            value={answers[q.id] || []}
                            onChange={v => setAnswers(p => ({ ...p, [q.id]: v }))}
                        />
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Khảo sát nội bộ</Title>
                    <Text type="secondary">Thu thập ý kiến và phản hồi từ nhân viên</Text>
                </div>
                {isHRAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                        Tạo khảo sát
                    </Button>
                )}
            </div>

            <Table rowKey="id" dataSource={surveys} columns={columns} size="small" scroll={{ x: 700 }} pagination={{ pageSize: 15 }} />

            {/* Create Survey Modal */}
            <Modal title="Tạo khảo sát" open={createOpen} onCancel={() => { setCreateOpen(false); createForm.resetFields() }} footer={null} destroyOnClose>
                <Form form={createForm} layout="vertical" onFinish={createMutation.mutate}>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="dateRange" label="Thời gian khảo sát" rules={[{ required: true }]}>
                        <RangePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="target_department" label="Đối tượng" initialValue="all">
                                <Select options={[
                                    { value: 'all', label: 'Tất cả' }, { value: 'hr', label: 'Nhân sự' },
                                    { value: 'it', label: 'CNTT' }, { value: 'sales', label: 'Kinh doanh' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_anonymous" label="Ẩn danh?" initialValue={false}>
                                <Select options={[{ value: false, label: 'Không ẩn danh' }, { value: true, label: 'Ẩn danh' }]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Button type="primary" htmlType="submit" loading={createMutation.isPending} block>Tạo khảo sát</Button>
                </Form>
            </Modal>

            {/* Take Survey Modal */}
            <Modal
                title={selectedSurvey?.title}
                open={takeOpen}
                onCancel={() => { setTakeOpen(false); setAnswers({}); setSelectedSurvey(null) }}
                onOk={handleSubmitSurvey}
                okText="Gửi câu trả lời"
                okButtonProps={{ loading: submitMutation.isPending }}
                destroyOnClose width={600}
            >
                {selectedSurvey?.description && (
                    <Paragraph type="secondary">{selectedSurvey.description}</Paragraph>
                )}
                {selectedSurvey?.is_anonymous && <Tag color="purple" style={{ marginBottom: 16 }}>Ẩn danh</Tag>}
                <Divider />
                {surveyDetail && ((surveyDetail as any).questions || []).map((q: SurveyQuestion, i: number) => renderQuestion(q, i))}
            </Modal>

            {/* Results Modal */}
            <Modal
                title={`Kết quả: ${selectedSurvey?.title}`}
                open={resultsOpen}
                onCancel={() => { setResultsOpen(false); setSelectedSurvey(null) }}
                footer={null} destroyOnClose width={640}
            >
                {surveyDetail && (
                    <div>
                        <Text type="secondary">Tổng phản hồi: <strong>{selectedSurvey?.response_count}</strong></Text>
                        <Divider />
                        {((surveyDetail as any).results || (surveyDetail as any).questions || []).map((q: any, i: number) => (
                            <div key={q.id} style={{ marginBottom: 24 }}>
                                <Text strong>{i + 1}. {q.question_text || q.text}</Text>
                                {q.stats && (
                                    <div style={{ marginTop: 8 }}>
                                        {q.question_type === 'rating' && q.stats.avg !== undefined && (
                                            <div><Rate disabled allowHalf value={q.stats.avg} /> <Text type="secondary">({q.stats.avg?.toFixed(1)})</Text></div>
                                        )}
                                        {(q.question_type === 'single_choice' || q.question_type === 'multi_choice') && q.stats.choices && (
                                            Object.entries(q.stats.choices).map(([choice, count]: [string, any]) => (
                                                <div key={choice} style={{ marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Text style={{ fontSize: 12 }}>{choice}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{count} phản hồi</Text>
                                                    </div>
                                                    <Progress percent={Math.round((count / (selectedSurvey?.response_count || 1)) * 100)} showInfo={false} size="small" />
                                                </div>
                                            ))
                                        )}
                                        {q.question_type === 'text' && q.stats.sample_answers && (
                                            <List size="small" dataSource={q.stats.sample_answers} renderItem={(a: any) => <List.Item><Text style={{ fontSize: 12 }}>{a}</Text></List.Item>} />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    )
}
