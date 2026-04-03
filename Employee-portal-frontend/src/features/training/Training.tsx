import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Button, Table, Tag, Tabs, Modal, Form,
    Input, Select, DatePicker, InputNumber, message, Typography, Space, Upload
} from 'antd'
import { PlusOutlined, UploadOutlined, SafetyCertificateOutlined, BookOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { trainingService } from '../../shared/services/trainingService'
import type { TrainingProgram } from '../../shared/types/training'
import { useAuthStore } from '../../shared/context/store'
import { isAdminOrHR } from '../../shared/utils/permissions'

const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_COLOR: Record<string, string> = {
    upcoming: 'blue', ongoing: 'green', completed: 'default', cancelled: 'red'
}

export const Training: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const [programModalOpen, setProgramModalOpen] = useState(false)
    const [certModalOpen, setCertModalOpen] = useState(false)
    const [programForm] = Form.useForm()
    const [certForm] = Form.useForm()

    const isHRAdmin = isAdminOrHR(user)

    const { data: programs = [] } = useQuery({
        queryKey: ['training-programs'],
        queryFn: () => trainingService.getPrograms(),
    })

    const { data: myEnrollments = [] } = useQuery({
        queryKey: ['my-enrollments'],
        queryFn: () => trainingService.getMyEnrollments(),
    })

    const { data: certificates = [] } = useQuery({
        queryKey: ['certificates'],
        queryFn: () => trainingService.getCertificates(),
    })

    const enrolledProgramIds = new Set(myEnrollments.filter(e => e.status === 'enrolled').map(e => e.program))

    const programMutation = useMutation({
        mutationFn: trainingService.createProgram,
        onSuccess: () => {
            message.success('Đã tạo chương trình đào tạo')
            setProgramModalOpen(false); programForm.resetFields()
            qc.invalidateQueries({ queryKey: ['training-programs'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi tạo chương trình'),
    })

    const enrollMutation = useMutation({
        mutationFn: trainingService.enroll,
        onSuccess: () => { message.success('Đã đăng ký thành công'); qc.invalidateQueries({ queryKey: ['training-programs', 'my-enrollments'] }) },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi đăng ký'),
    })

    const unenrollMutation = useMutation({
        mutationFn: trainingService.unenroll,
        onSuccess: () => { message.success('Đã hủy đăng ký'); qc.invalidateQueries({ queryKey: ['training-programs', 'my-enrollments'] }) },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi hủy'),
    })

    const certMutation = useMutation({
        mutationFn: (values: any) => {
            const fd = new FormData()
            Object.entries(values).forEach(([k, v]) => {
                if (v === undefined || v === null) return
                if (k === 'certificate_file' && v && (v as any).fileList?.length > 0) {
                    fd.append(k, (v as any).fileList[0].originFileObj)
                } else if (k === 'issue_date' || k === 'expiry_date') {
                    if (v) fd.append(k, (v as any).format('YYYY-MM-DD'))
                } else {
                    fd.append(k, String(v))
                }
            })
            return trainingService.createCertificate(fd)
        },
        onSuccess: () => {
            message.success('Đã thêm chứng chỉ')
            setCertModalOpen(false); certForm.resetFields()
            qc.invalidateQueries({ queryKey: ['certificates'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi thêm chứng chỉ'),
    })

    const programColumns: ColumnsType<TrainingProgram> = [
        {
            title: 'Chương trình', dataIndex: 'title', ellipsis: true,
            render: (title: string, r: TrainingProgram) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.instructor} · {r.location}</div>
                </div>
            )
        },
        { title: 'Bắt đầu', dataIndex: 'start_date', width: 105 },
        { title: 'Kết thúc', dataIndex: 'end_date', width: 105 },
        {
            title: 'Số chỗ', key: 'slots', width: 100,
            render: (_: any, r: TrainingProgram) => `${r.enrolled_count}/${r.max_participants}`
        },
        {
            title: 'TT', dataIndex: 'status', width: 110,
            render: (s: string, r: TrainingProgram) => <Tag color={STATUS_COLOR[s]}>{r.status_display}</Tag>
        },
        {
            title: '', key: 'action', width: 100,
            render: (_: any, r: TrainingProgram) => {
                const isEnrolled = enrolledProgramIds.has(r.id)
                if (r.status === 'cancelled' || r.status === 'completed') return null
                return isEnrolled ? (
                    <Button size="small" danger onClick={() => unenrollMutation.mutate(r.id)}>Hủy đăng ký</Button>
                ) : (
                    <Button size="small" type="primary" onClick={() => enrollMutation.mutate(r.id)}
                        disabled={r.enrolled_count >= r.max_participants}>
                        Đăng ký
                    </Button>
                )
            }
        }
    ]

    const certColumns: ColumnsType<any> = [
        { title: 'Chứng chỉ', dataIndex: 'title' },
        { title: 'Cấp bởi', dataIndex: 'issuer' },
        { title: 'Ngày cấp', dataIndex: 'issue_date', width: 110 },
        {
            title: 'Hết hạn', dataIndex: 'expiry_date', width: 110,
            render: (d: string | null) => {
                if (!d) return <Tag color="green">Không hết hạn</Tag>
                const isExpired = dayjs(d).isBefore(dayjs())
                return <Tag color={isExpired ? 'red' : 'green'}>{d}</Tag>
            }
        },
        {
            title: 'File', dataIndex: 'certificate_file', width: 80,
            render: (f: string | null) => f ? <a href={f} target="_blank" rel="noreferrer">Xem</a> : '—'
        }
    ]

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Đào tạo & Phát triển</Title>
                    <Text type="secondary">Chương trình học, đăng ký và chứng chỉ</Text>
                </div>
                <Space>
                    <Button icon={<SafetyCertificateOutlined />} onClick={() => setCertModalOpen(true)}>
                        Thêm chứng chỉ
                    </Button>
                    {isHRAdmin && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setProgramModalOpen(true)}>
                            Tạo chương trình
                        </Button>
                    )}
                </Space>
            </div>

            <Tabs defaultActiveKey="programs" items={[
                {
                    key: 'programs',
                    label: <span><BookOutlined /> Chương trình ({programs.length})</span>,
                    children: (
                        <Table rowKey="id" dataSource={programs} columns={programColumns} size="small" scroll={{ x: 700 }} pagination={{ pageSize: 10 }} />
                    )
                },
                {
                    key: 'my-enrollments',
                    label: `Đã đăng ký (${myEnrollments.filter(e => e.status === 'enrolled').length})`,
                    children: (
                        <Table rowKey="id" dataSource={myEnrollments} size="small" pagination={{ pageSize: 10 }} columns={[
                            { title: 'Chương trình', dataIndex: 'program_title' },
                            { title: 'Ngày đăng ký', dataIndex: 'enrolled_at', width: 130, render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                            { title: 'TT', dataIndex: 'status_display', width: 120, render: (s: string, r: any) => <Tag color={r.status === 'completed' ? 'green' : r.status === 'enrolled' ? 'blue' : 'default'}>{s}</Tag> },
                            { title: 'Điểm', dataIndex: 'score', width: 80, render: (s: number | null) => s ?? '—' },
                        ]} />
                    )
                },
                {
                    key: 'certificates',
                    label: <span><SafetyCertificateOutlined /> Chứng chỉ ({certificates.length})</span>,
                    children: (
                        <Table rowKey="id" dataSource={certificates} columns={certColumns} size="small" pagination={{ pageSize: 10 }} />
                    )
                }
            ]} />

            {/* Create Program Modal */}
            <Modal
                title="Tạo chương trình đào tạo"
                open={programModalOpen}
                onCancel={() => { setProgramModalOpen(false); programForm.resetFields() }}
                footer={null} destroyOnClose width={560}
            >
                <Form form={programForm} layout="vertical" onFinish={v => programMutation.mutate({
                    ...v,
                    start_date: v.start_date?.format('YYYY-MM-DD'),
                    end_date: v.end_date?.format('YYYY-MM-DD'),
                })}>
                    <Form.Item name="title" label="Tên chương trình" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Mô tả"><TextArea rows={2} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="instructor" label="Giảng viên" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="location" label="Địa điểm / Link"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="end_date" label="Ngày kết thúc" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="max_participants" label="Số lượng tối đa" initialValue={30}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="target_department" label="Phòng ban" initialValue="all">
                            <Select options={[
                                { value: 'all', label: 'Tất cả' }, { value: 'hr', label: 'Nhân sự' },
                                { value: 'it', label: 'CNTT' }, { value: 'sales', label: 'Kinh doanh' },
                                { value: 'marketing', label: 'Marketing' }, { value: 'operations', label: 'Vận hành' },
                                { value: 'finance', label: 'Tài chính' },
                            ]} />
                        </Form.Item></Col>
                    </Row>
                    <Button type="primary" htmlType="submit" loading={programMutation.isPending} block>Tạo chương trình</Button>
                </Form>
            </Modal>

            {/* Add Certificate Modal */}
            <Modal
                title="Thêm chứng chỉ"
                open={certModalOpen}
                onCancel={() => { setCertModalOpen(false); certForm.resetFields() }}
                footer={null} destroyOnClose
            >
                <Form form={certForm} layout="vertical" onFinish={certMutation.mutate}>
                    <Form.Item name="title" label="Tên chứng chỉ" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="issuer" label="Tổ chức cấp" rules={[{ required: true }]}><Input /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="issue_date" label="Ngày cấp" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="expiry_date" label="Ngày hết hạn"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>
                    <Form.Item name="description" label="Mô tả"><TextArea rows={2} /></Form.Item>
                    <Form.Item name="certificate_file" label="File chứng chỉ">
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Chọn file</Button>
                        </Upload>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={certMutation.isPending} block>Thêm</Button>
                </Form>
            </Modal>
        </div>
    )
}
