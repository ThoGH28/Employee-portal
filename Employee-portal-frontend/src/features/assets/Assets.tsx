import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Row, Col, Card, Button, Table, Tag, Tabs, Modal, Form,
    Input, Select, DatePicker, message, Typography, Space, Badge
} from 'antd'
import { PlusOutlined, LaptopOutlined, SwapOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { assetService } from '../../shared/services/assetService'
import type { CompanyAsset } from '../../shared/types/assets'
import { useAuthStore } from '../../shared/context/store'
import { isAdminOrHR } from '../../shared/utils/permissions'

const { Title, Text } = Typography
const { TextArea } = Input

const STATUS_COLOR: Record<string, string> = {
    available: 'green', assigned: 'blue', maintenance: 'orange', retired: 'default'
}

const STATUS_LABEL: Record<string, string> = {
    available: 'Có sẵn', assigned: 'Đang sử dụng', maintenance: 'Bảo trì', retired: 'Thanh lý'
}

export const Assets: React.FC = () => {
    const { user } = useAuthStore()
    const qc = useQueryClient()
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [assignModalOpen, setAssignModalOpen] = useState(false)
    const [returnModalOpen, setReturnModalOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState<CompanyAsset | null>(null)
    const [createForm] = Form.useForm()
    const [assignForm] = Form.useForm()
    const [returnForm] = Form.useForm()

    const isHRAdmin = isAdminOrHR(user)

    const { data: assets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetService.getAssets(),
    })

    const { data: assignments = [] } = useQuery({
        queryKey: ['asset-assignments'],
        queryFn: () => assetService.getAssignments(),
    })

    const createMutation = useMutation({
        mutationFn: assetService.createAsset,
        onSuccess: () => {
            message.success('Đã thêm tài sản')
            setCreateModalOpen(false); createForm.resetFields()
            qc.invalidateQueries({ queryKey: ['assets'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi tạo tài sản'),
    })

    const assignMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => assetService.assignAsset(id, data),
        onSuccess: () => {
            message.success('Đã bàn giao tài sản')
            setAssignModalOpen(false); assignForm.resetFields(); setSelectedAsset(null)
            qc.invalidateQueries({ queryKey: ['assets', 'asset-assignments'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi bàn giao'),
    })

    const returnMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => assetService.returnAsset(id, data),
        onSuccess: () => {
            message.success('Đã thu hồi tài sản')
            setReturnModalOpen(false); returnForm.resetFields(); setSelectedAsset(null)
            qc.invalidateQueries({ queryKey: ['assets', 'asset-assignments'] })
        },
        onError: (e: any) => message.error(e?.response?.data?.detail || 'Lỗi thu hồi'),
    })

    const myAssignments = assignments.filter((a: any) => a.is_active)

    const assetColumns: ColumnsType<CompanyAsset> = [
        {
            title: 'Tài sản', dataIndex: 'name',
            render: (name: string, r: CompanyAsset) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>#{r.asset_code} · {r.model}</div>
                </div>
            )
        },
        { title: 'Loại', dataIndex: 'asset_type_display', width: 110 },
        { title: 'Serial', dataIndex: 'serial_number', width: 120 },
        { title: 'Giá trị', dataIndex: 'purchase_value', width: 120, render: (v: number) => v ? `${Number(v).toLocaleString('vi-VN')} đ` : '—' },
        {
            title: 'Trạng thái', dataIndex: 'status', width: 130,
            render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s]}</Tag>
        },
        {
            title: '', key: 'action', width: 130,
            render: (_: any, r: CompanyAsset) => (
                <Space size={4}>
                    {r.status === 'available' && (
                        <Button size="small" type="primary" icon={<SwapOutlined />}
                            onClick={() => { setSelectedAsset(r); setAssignModalOpen(true) }}>
                            Bàn giao
                        </Button>
                    )}
                    {r.status === 'assigned' && (
                        <Button size="small" danger
                            onClick={() => { setSelectedAsset(r); setReturnModalOpen(true) }}>
                            Thu hồi
                        </Button>
                    )}
                </Space>
            )
        }
    ]

    const assignmentColumns: ColumnsType<any> = [
        { title: 'Tài sản', dataIndex: 'asset_name', render: (n: string, r: any) => <div><div style={{ fontWeight: 600 }}>{n}</div><div style={{ fontSize: 12, color: '#888' }}>#{r.asset_code}</div></div> },
        { title: 'Loại', dataIndex: 'asset_type_display', width: 110 },
        { title: 'Nhân viên', dataIndex: 'employee_name', width: 150 },
        { title: 'Ngày bàn giao', dataIndex: 'assigned_date', width: 125, render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
        { title: 'Ngày trả', dataIndex: 'return_date', width: 110, render: (d: string | null) => d ? dayjs(d).format('DD/MM/YYYY') : '—' },
        { title: 'TT', dataIndex: 'is_active', width: 80, render: (v: boolean) => <Badge status={v ? 'processing' : 'default'} text={v ? 'Đang dùng' : 'Đã trả'} /> },
    ]

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>Quản lý tài sản</Title>
                    <Text type="secondary">Theo dõi và bàn giao tài sản công ty</Text>
                </div>
                {isHRAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                        Thêm tài sản
                    </Button>
                )}
            </div>

            {!isHRAdmin ? (
                // Employee view — only show their assignments
                <Card title="Tài sản được bàn giao">
                    <Table rowKey="id" dataSource={myAssignments.filter((a: any) => a.employee === user?.id)} columns={[
                        { title: 'Tài sản', dataIndex: 'asset_name', render: (n: string, r: any) => <div><div style={{ fontWeight: 600 }}>{n}</div><div style={{ fontSize: 12, color: '#888' }}>#{r.asset_code}</div></div> },
                        { title: 'Loại', dataIndex: 'asset_type_display', width: 110 },
                        { title: 'Ngày nhận', dataIndex: 'assigned_date', width: 120, render: (d: string) => dayjs(d).format('DD/MM/YYYY') },
                    ]} size="small" pagination={false} />
                </Card>
            ) : (
                <Tabs defaultActiveKey="inventory" items={[
                    {
                        key: 'inventory',
                        label: <span><LaptopOutlined /> Kho tài sản ({assets.length})</span>,
                        children: (
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Row gutter={16} style={{ marginBottom: 16 }}>
                                        {['available', 'assigned', 'maintenance', 'retired'].map(s => {
                                            const count = assets.filter((a: CompanyAsset) => a.status === s).length
                                            return (
                                                <Col span={6} key={s}>
                                                    <Card size="small" style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: 28, fontWeight: 700, color: { available: '#52c41a', assigned: '#1890ff', maintenance: '#fa8c16', retired: '#8c8c8c' }[s] }}>{count}</div>
                                                        <div style={{ fontSize: 12 }}>{STATUS_LABEL[s]}</div>
                                                    </Card>
                                                </Col>
                                            )
                                        })}
                                    </Row>
                                    <Table rowKey="id" dataSource={assets} columns={assetColumns} size="small" scroll={{ x: 800 }} pagination={{ pageSize: 15 }} />
                                </Col>
                            </Row>
                        )
                    },
                    {
                        key: 'assignments',
                        label: `Lịch sử bàn giao (${myAssignments.length})`,
                        children: (
                            <Table rowKey="id" dataSource={assignments} columns={assignmentColumns} size="small" scroll={{ x: 700 }} pagination={{ pageSize: 15 }} />
                        )
                    }
                ]} />
            )}

            {/* Create Asset Modal */}
            <Modal
                title="Thêm tài sản mới"
                open={createModalOpen}
                onCancel={() => { setCreateModalOpen(false); createForm.resetFields() }}
                footer={null} destroyOnClose width={520}
            >
                <Form form={createForm} layout="vertical" onFinish={v => createMutation.mutate({
                    ...v, purchase_date: v.purchase_date?.format('YYYY-MM-DD')
                })}>
                    <Row gutter={16}>
                        <Col span={16}><Form.Item name="name" label="Tên tài sản" rules={[{ required: true }]}><Input /></Form.Item></Col>
                        <Col span={8}><Form.Item name="asset_code" label="Mã tài sản" rules={[{ required: true }]}><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="asset_type" label="Loại" rules={[{ required: true }]}>
                            <Select options={[
                                { value: 'laptop', label: 'Laptop' }, { value: 'desktop', label: 'Máy tính bàn' },
                                { value: 'phone', label: 'Điện thoại' }, { value: 'tablet', label: 'Máy tính bảng' },
                                { value: 'vehicle', label: 'Phương tiện' }, { value: 'furniture', label: 'Nội thất' },
                                { value: 'other', label: 'Khác' },
                            ]} />
                        </Form.Item></Col>
                        <Col span={12}><Form.Item name="status" label="Trạng thái" initialValue="available">
                            <Select options={[
                                { value: 'available', label: 'Có sẵn' }, { value: 'assigned', label: 'Đang sử dụng' },
                                { value: 'maintenance', label: 'Bảo trì' }, { value: 'retired', label: 'Thanh lý' },
                            ]} />
                        </Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="model" label="Model"><Input /></Form.Item></Col>
                        <Col span={12}><Form.Item name="serial_number" label="Serial"><Input /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="purchase_date" label="Ngày mua"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="purchase_value" label="Giá trị (đ)"><Input type="number" /></Form.Item></Col>
                    </Row>
                    <Form.Item name="notes" label="Ghi chú"><TextArea rows={2} /></Form.Item>
                    <Button type="primary" htmlType="submit" loading={createMutation.isPending} block>Thêm tài sản</Button>
                </Form>
            </Modal>

            {/* Assign Asset Modal */}
            <Modal
                title={`Bàn giao: ${selectedAsset?.name}`}
                open={assignModalOpen}
                onCancel={() => { setAssignModalOpen(false); assignForm.resetFields(); setSelectedAsset(null) }}
                footer={null} destroyOnClose
            >
                <Form form={assignForm} layout="vertical" onFinish={v => assignMutation.mutate({
                    id: selectedAsset!.id, data: { ...v, assigned_date: v.assigned_date?.format('YYYY-MM-DD') }
                })}>
                    <Form.Item name="employee" label="Nhân viên nhận" rules={[{ required: true }]}><Input placeholder="ID nhân viên" type="number" /></Form.Item>
                    <Form.Item name="assigned_date" label="Ngày bàn giao" rules={[{ required: true }]} initialValue={dayjs()}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú"><TextArea rows={2} /></Form.Item>
                    <Button type="primary" htmlType="submit" loading={assignMutation.isPending} block>Xác nhận bàn giao</Button>
                </Form>
            </Modal>

            {/* Return Asset Modal */}
            <Modal
                title={`Thu hồi: ${selectedAsset?.name}`}
                open={returnModalOpen}
                onCancel={() => { setReturnModalOpen(false); returnForm.resetFields(); setSelectedAsset(null) }}
                footer={null} destroyOnClose
            >
                <Form form={returnForm} layout="vertical" onFinish={v => returnMutation.mutate({
                    id: selectedAsset!.id, data: { ...v, return_date: v.return_date?.format('YYYY-MM-DD') }
                })}>
                    <Form.Item name="return_date" label="Ngày thu hồi" rules={[{ required: true }]} initialValue={dayjs()}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="condition_on_return" label="Tình trạng khi thu hồi">
                        <Select options={[
                            { value: 'good', label: 'Tốt' }, { value: 'damaged', label: 'Hư hỏng' }, { value: 'lost', label: 'Mất' }
                        ]} defaultValue="good" />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú"><TextArea rows={2} /></Form.Item>
                    <Button danger htmlType="submit" loading={returnMutation.isPending} block>Xác nhận thu hồi</Button>
                </Form>
            </Modal>
        </div>
    )
}
