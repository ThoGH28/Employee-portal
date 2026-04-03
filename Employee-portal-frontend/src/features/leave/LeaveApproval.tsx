import React, { useState } from 'react'
import {
    Table, Button, Tag, Space, Modal, Form, Input, Select, Card, Spin, Empty, message,
    Descriptions, Badge, Tooltip,
} from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined, CalendarOutlined, FilterOutlined } from '@ant-design/icons'
import { useAllLeaveRequests, useApproveLeaveRequest } from '../../shared/hooks/queries'
import { useI18n } from '../../shared/context/i18n'
import { formatDate } from '../../shared/utils/helpers'
import type { LeaveRequest } from '../../shared/types'
import styles from './LeaveApproval.module.css'

const STATUS_COLOR: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'default',
}

export const LeaveApproval: React.FC = () => {
    const t = useI18n()
    const STATUS_LABEL: Record<string, string> = t.leaveStatuses as Record<string, string>
    const LEAVE_TYPE_LABEL: Record<string, string> = t.leaveTypes as Record<string, string>
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
                    message.success(actionType === 'approved' ? t.leaveApproval.approveSuccess : t.leaveApproval.rejectSuccess)
                    setIsApproveOpen(false)
                    setSelectedLeave(null)
                },
                onError: (err: any) => {
                    message.error(err?.response?.data?.detail || t.leaveApproval.actionFailed)
                },
            }
        )
    }

    const columns = [
        {
            title: t.leaveApproval.colEmployee,
            dataIndex: 'employee_name',
            key: 'employee_name',
            render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
        },
        {
            title: t.leaveApproval.colLeaveType,
            dataIndex: 'leave_type',
            key: 'leave_type',
            render: (type: string) => LEAVE_TYPE_LABEL[type] ?? type,
        },
        {
            title: t.leaveApproval.colFromDate,
            dataIndex: 'start_date',
            key: 'start_date',
            render: (d: string) => formatDate(d),
        },
        {
            title: t.leaveApproval.colToDate,
            dataIndex: 'end_date',
            key: 'end_date',
            render: (d: string) => formatDate(d),
        },
        {
            title: t.leaveApproval.colDays,
            dataIndex: 'days_count',
            key: 'days_count',
            render: (n: number) => `${n} ${t.leaveApproval.days}`,
            align: 'center' as const,
        },
        {
            title: t.leaveApproval.colStatus,
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => <Tag color={STATUS_COLOR[s]}>{STATUS_LABEL[s] ?? s}</Tag>,
        },
        {
            title: t.leaveApproval.colCreated,
            dataIndex: 'created_at',
            key: 'created_at',
            render: (d: string) => formatDate(d),
        },
        {
            title: t.leaveApproval.colActions,
            key: 'actions',
            render: (_: any, record: LeaveRequest) => (
                <Space size="small">
                    <Tooltip title={t.leaveApproval.tooltipView}>
                        <Button icon={<EyeOutlined />} size="small" onClick={() => openDetail(record)} />
                    </Tooltip>
                    {record.status === 'pending' && (
                        <>
                            <Tooltip title={t.leaveApproval.tooltipApprove}>
                                <Button
                                    icon={<CheckOutlined />}
                                    size="small"
                                    type="primary"
                                    onClick={() => openAction(record, 'approved')}
                                />
                            </Tooltip>
                            <Tooltip title={t.leaveApproval.tooltipReject}>
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
                        <span>{t.leaveApproval.cardTitle}</span>
                        {pendingCount > 0 && (
                            <Badge count={pendingCount} style={{ backgroundColor: '#f59e0b' }} />
                        )}
                    </Space>
                }
                extra={
                    <Space>
                        <FilterOutlined />
                        <Select
                            placeholder={t.leaveApproval.filterStatus}
                            allowClear
                            style={{ width: 140 }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'pending', label: t.leaveStatuses.pending },
                                { value: 'approved', label: t.leaveStatuses.approved },
                                { value: 'rejected', label: t.leaveStatuses.rejected },
                                { value: 'cancelled', label: t.leaveStatuses.cancelled },
                            ]}
                        />
                        <Select
                            placeholder={t.leaveApproval.filterLeaveType}
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
                        pagination={{ pageSize: 15, showTotal: (total) => t.leaveApproval.totalItems.replace('{n}', String(total)) }}
                    />
                ) : (
                    <Empty description={t.leaveApproval.noLeaves} style={{ padding: 40 }} />
                )}
            </Card>

            {/* Detail Modal */}
            <Modal
                title={t.leaveApproval.detailTitle}
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
                                {t.leaveApproval.btnApprove}
                            </Button>
                            <Button
                                danger
                                icon={<CloseOutlined />}
                                onClick={() => { setIsDetailOpen(false); openAction(selectedLeave!, 'rejected') }}
                            >
                                {t.leaveApproval.btnReject}
                            </Button>
                        </Space>
                    ) : (
                        <Button onClick={() => setIsDetailOpen(false)}>{t.leaveApproval.btnClose}</Button>
                    )
                }
                width={560}
            >
                {selectedLeave && (
                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label={t.leaveApproval.descEmployee}>{selectedLeave.employee_name}</Descriptions.Item>
                        <Descriptions.Item label={t.leaveApproval.descLeaveType}>{LEAVE_TYPE_LABEL[selectedLeave.leave_type] ?? selectedLeave.leave_type}</Descriptions.Item>
                        <Descriptions.Item label={t.leaveApproval.descFromDate}>{formatDate(selectedLeave.start_date)}</Descriptions.Item>
                        <Descriptions.Item label={t.leaveApproval.descToDate}>{formatDate(selectedLeave.end_date)}</Descriptions.Item>
                        <Descriptions.Item label={t.leaveApproval.descDays}>{selectedLeave.days_count} {t.leaveApproval.days}</Descriptions.Item>
                        <Descriptions.Item label={t.leaveApproval.descReason}>{selectedLeave.reason}</Descriptions.Item>
                        <Descriptions.Item label={t.leaveApproval.descStatus}>
                            <Tag color={STATUS_COLOR[selectedLeave.status]}>{STATUS_LABEL[selectedLeave.status]}</Tag>
                        </Descriptions.Item>
                        {selectedLeave.approved_by_name && (
                            <Descriptions.Item label={t.leaveApproval.descApprovedBy}>{selectedLeave.approved_by_name}</Descriptions.Item>
                        )}
                        {selectedLeave.approval_date && (
                            <Descriptions.Item label={t.leaveApproval.descApprovalDate}>{formatDate(selectedLeave.approval_date)}</Descriptions.Item>
                        )}
                        {selectedLeave.approval_comment && (
                            <Descriptions.Item label={t.leaveApproval.descComment}>{selectedLeave.approval_comment}</Descriptions.Item>
                        )}
                        <Descriptions.Item label={t.leaveApproval.descCreated}>{formatDate(selectedLeave.created_at)}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            {/* Approve / Reject Modal */}
            <Modal
                title={actionType === 'approved' ? t.leaveApproval.modalApproveTitle : t.leaveApproval.modalRejectTitle}
                open={isApproveOpen}
                onCancel={() => setIsApproveOpen(false)}
                footer={null}
            >
                {selectedLeave && (
                    <div style={{ marginBottom: 16 }}>
                        <p>
                            {t.leaveApproval.employeePrefix} <strong>{selectedLeave.employee_name}</strong> —{' '}
                            {LEAVE_TYPE_LABEL[selectedLeave.leave_type]} ({selectedLeave.days_count} {t.leaveApproval.days})
                        </p>
                        <p style={{ color: '#64748b', fontSize: 13 }}>
                            {formatDate(selectedLeave.start_date)} → {formatDate(selectedLeave.end_date)}
                        </p>
                    </div>
                )}
                <Form form={form} layout="vertical" onFinish={handleSubmitAction}>
                    <Form.Item
                        label={t.leaveApproval.commentLabel}
                        name="approval_comment"
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder={actionType === 'approved' ? t.leaveApproval.approvePlaceholder : t.leaveApproval.rejectPlaceholder}
                        />
                    </Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setIsApproveOpen(false)}>{t.leaveApproval.btnCancel}</Button>
                        <Button
                            type={actionType === 'approved' ? 'primary' : 'default'}
                            danger={actionType === 'rejected'}
                            htmlType="submit"
                            loading={isPending}
                            icon={actionType === 'approved' ? <CheckOutlined /> : <CloseOutlined />}
                        >
                            {actionType === 'approved' ? t.leaveApproval.btnApprove : t.leaveApproval.btnReject}
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </div>
    )
}
