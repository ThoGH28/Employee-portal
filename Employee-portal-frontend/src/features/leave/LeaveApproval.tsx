import React, { useState } from 'react'
import {
    Table, Button, Tag, Space, Modal, Form, Input, Select, Card, Spin, Empty, message,
    Descriptions, Badge, Tooltip,
} from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined, CalendarOutlined, FilterOutlined } from '@ant-design/icons'
import { useAllLeaveRequests, useApproveLeaveRequest } from '../../shared/hooks/queries'
import { formatDate } from '../../shared/utils/helpers'
import type { LeaveRequest } from '../../shared/types'
import styles from './LeaveApproval.module.css'

const STATUS_COLOR: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'default',
}

const STATUS_LABEL: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy',
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
    sick: 'Nghỉ ốm',
    casual: 'Nghỉ việc riêng',
    earned: 'Nghỉ phép năm',
    maternity: 'Nghỉ thai sản',
    paternity: 'Nghỉ chăm con',
    unpaid: 'Nghỉ không lương',
}

export const LeaveApproval: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<string | undefined>('pending')
    const [leaveTypeFilter, setLeaveTypeFilter] = useState<string | undefined>(undefined)
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isApproveOpen, setIsApproveOpen] = useState(false)
    const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved')
    const [form] = Form.useForm()

    const { data: leaves = [], isLoading } = useAllLeaveRequests({
        status: statusFilter,
        leave_type: leaveTypeFilter,
    })

    const { mutate: approveLeave, isPending } = useApproveLeaveRequest()

    const openDetail = (record: LeaveRequest) => {
        setSelectedLeave(record)
        setIsDetailOpen(true)
    }

    const openAction = (record: LeaveRequest, type: 'approved' | 'rejected') => {
        setSelectedLeave(record)
        setActionType(type)
        form.resetFields()
        setIsApproveOpen(true)
    }

    const handleSubmitAction = (values: { approval_comment: string }) => {
        if (!selectedLeave) return
        approveLeave(
            { id: selectedLeave.id, data: { status: actionType, approval_comment: values.approval_comment ?? '' } },
            {
                onSuccess: () => {
                    message.success(actionType === 'approved' ? 'Đã duyệt đơn nghỉ phép' : 'Đã từ chối đơn nghỉ phép')
                    setIsApproveOpen(false)
                    setSelectedLeave(null)
                },
                onError: (err: any) => {
                    message.error(err?.response?.data?.detail || 'Thao tác thất bại')
                },
            }
        )
    }

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: 'employee_name',
            key: 'employee_name',
            render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
        },
        {
            title: 'Loại nghỉ',
            dataIndex: 'leave_type',
            key: 'leave_type',
            render: (type: string) => LEAVE_TYPE_LABEL[type] ?? type,
        },
        {
            title: 'Từ ngày',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (d: string) => formatDate(d),
        },
        {
            title: 'Đến ngày',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (d: string) => formatDate(d),
        },
        {
            title: 'Số ngày',
            dataIndex: 'days_count',
            key: 'days_count',
            render: (n: number) => `${n} ngày`,
            align: 'center' as const,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s] ?? s}</Tag>,
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (d: string) => formatDate(d),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: LeaveRequest) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button icon={<EyeOutlined />} size="small" onClick={() => openDetail(record)} />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Duyệt">
                                <Button
                                    icon={<CheckOutlined />}
                                    size="small"
                                    type="primary"
                                    onClick={() => openAction(record, 'approved')}
                                />
                            </Tooltip>
                            <Tooltip title="Từ chối">
                                <Button
                                    icon={<CloseOutlined />}
                                    size="small"
                                    danger
                                    onClick={() => openAction(record, 'rejected')}
                                />
                            </Tooltip>
                        </>
                    )}
                </Space>
            ),
        },
    ]

    const pendingCount = leaves?.filter(l => l.status === 'pending').length

    return (
        <div className={styles.container}>
            <Card
                title={
                    <Space>
                        <CalendarOutlined />
                        <span>Duyệt Đơn Nghỉ Phép</span>
                        {pendingCount > 0 && (
                            <Badge count={pendingCount} style={{ backgroundColor: '#f59e0b' }} />
                        )}
                    </Space>
                }
                extra={
                    <Space>
                        <FilterOutlined />
                        <Select
                            placeholder="Trạng thái"
                            allowClear
                            style={{ width: 140 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'pending', label: 'Chờ duyệt' },
                                { value: 'approved', label: 'Đã duyệt' },
                                { value: 'rejected', label: 'Từ chối' },
                                { value: 'cancelled', label: 'Đã hủy' },
                            ]}
                        />
                        <Select
                            placeholder="Loại nghỉ"
                            allowClear
                            style={{ width: 160 }}
                            value={leaveTypeFilter}
                            onChange={setLeaveTypeFilter}
                            options={Object.entries(LEAVE_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l }))}
                        />
                    </Space>
                }
            >
                {isLoading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}><Spin /></div>
                ) : leaves.length > 0 ? (
                    <Table
                        dataSource={leaves}
                        columns={columns}
                        rowKey="id"
                        scroll={{ x: 800 }}
                        pagination={{ pageSize: 15, showTotal: (total) => `Tổng ${total} đơn` }}
                    />
                ) : (
                    <Empty description="Không có đơn nghỉ phép nào" style={{ padding: 40 }} />
                )}
            </Card>

            {/* Detail Modal */}
            <Modal
                title="Chi tiết đơn nghỉ phép"
                open={isDetailOpen}
                onCancel={() => setIsDetailOpen(false)}
                footer={
                    selectedLeave?.status === 'pending' ? (
                        <Space>
                            <Button
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={() => { setIsDetailOpen(false); openAction(selectedLeave!, 'approved') }}
                            >
                                Duyệt
                            </Button>
                            <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => { setIsDetailOpen(false); openAction(selectedLeave!, 'rejected') }}
                            >
                                Từ chối
                            </Button>
                        </Space>
                    ) : (
                        <Button onClick={() => setIsDetailOpen(false)}>Đóng</Button>
                    )
                }
                width={560}
            >
                {selectedLeave && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Nhân viên">{selectedLeave.employee_name}</Descriptions.Item>
                        <Descriptions.Item label="Loại nghỉ">{LEAVE_TYPE_LABEL[selectedLeave.leave_type] ?? selectedLeave.leave_type}</Descriptions.Item>
                        <Descriptions.Item label="Từ ngày">{formatDate(selectedLeave.start_date)}</Descriptions.Item>
                        <Descriptions.Item label="Đến ngày">{formatDate(selectedLeave.end_date)}</Descriptions.Item>
                        <Descriptions.Item label="Số ngày">{selectedLeave.days_count} ngày</Descriptions.Item>
                        <Descriptions.Item label="Lý do">{selectedLeave.reason}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={STATUS_COLOR[selectedLeave.status]}>{STATUS_LABEL[selectedLeave.status]}</Tag>
                        </Descriptions.Item>
                        {selectedLeave.approved_by_name && (
                            <Descriptions.Item label="Người duyệt">{selectedLeave.approved_by_name}</Descriptions.Item>
                        )}
                        {selectedLeave.approval_date && (
                            <Descriptions.Item label="Ngày duyệt">{formatDate(selectedLeave.approval_date)}</Descriptions.Item>
                        )}
                        {selectedLeave.approval_comment && (
                            <Descriptions.Item label="Nhận xét">{selectedLeave.approval_comment}</Descriptions.Item>
                        )}
                        <Descriptions.Item label="Ngày tạo">{formatDate(selectedLeave.created_at)}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Approve / Reject Modal */}
            <Modal
                title={actionType === 'approved' ? 'Duyệt đơn nghỉ phép' : 'Từ chối đơn nghỉ phép'}
                open={isApproveOpen}
                onCancel={() => setIsApproveOpen(false)}
                footer={null}
            >
                {selectedLeave && (
                    <div style={{ marginBottom: 16 }}>
                        <p>
                            Nhân viên: <strong>{selectedLeave.employee_name}</strong> —{' '}
                            {LEAVE_TYPE_LABEL[selectedLeave.leave_type]} ({selectedLeave.days_count} ngày)
                        </p>
                        <p style={{ color: '#64748b', fontSize: 13 }}>
                            {formatDate(selectedLeave.start_date)} → {formatDate(selectedLeave.end_date)}
                        </p>
                    </div>
                )}
                <Form form={form} layout="vertical" onFinish={handleSubmitAction}>
                    <Form.Item
                        label="Nhận xét (không bắt buộc)"
                        name="approval_comment"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder={actionType === 'approved' ? 'Ghi chú khi duyệt...' : 'Lý do từ chối...'}
                        />
                    </Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setIsApproveOpen(false)}>Hủy</Button>
                        <Button
                            type={actionType === 'approved' ? 'primary' : 'default'}
                            danger={actionType === 'rejected'}
                            htmlType="submit"
                            loading={isPending}
                            icon={actionType === 'approved' ? <CheckOutlined /> : <CloseOutlined />}
                        >
                            {actionType === 'approved' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </div>
    )
}
