import React, { useState } from 'react'
import { Form, Input, DatePicker, Button, Card, Table, message, Modal, Spin, Empty, Tag, Select } from 'antd'
import { CalendarOutlined, PlusOutlined } from '@ant-design/icons'
import { useMyLeaveRequests, useCreateLeaveRequest, useLeaveBalance } from '../../shared/hooks/queries'
import { formatDate } from '../../shared/utils/helpers'
import type { LeaveRequestPayload } from '../../shared/types'
import styles from './LeaveRequestForm.module.css'

export const LeaveRequestForm: React.FC = () => {
    const [form] = Form.useForm()
    const [isModalVisible, setIsModalVisible] = useState(false)
    const { data: requests, isLoading } = useMyLeaveRequests()
    const { data: balance } = useLeaveBalance()
    const { mutate: createRequest, isPending } = useCreateLeaveRequest()

    const onFinish = (values: any) => {
        const data: LeaveRequestPayload = {
            leave_type: values.leave_type,
            start_date: values.start_date.format('YYYY-MM-DD'),
            end_date: values.end_date.format('YYYY-MM-DD'),
            reason: values.reason,
        }

        createRequest(data, {
            onSuccess: () => {
                message.success('Gửi yêu cầu nghỉ phép thành công')
                form.resetFields()
                setIsModalVisible(false)
            },
            onError: (error: any) => {
                message.error(error.response?.data?.message || 'Gửi yêu cầu thất bại')
            },
        })
    }

    const columns = [
        {
            title: 'Ngày bắt đầu',
            dataIndex: 'start_date',
            render: (text: string) => formatDate(text),
        },
        {
            title: 'Ngày kết thúc',
            dataIndex: 'end_date',
            render: (text: string) => formatDate(text),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (status: string) => {
                const colorMap: Record<string, string> = { approved: 'green', rejected: 'red', pending: 'orange' }
                return <Tag color={colorMap[status] || 'default'}>{status.toUpperCase()}</Tag>
            },
        },
    ]

    return (
        <div className={styles.leaveContainer}>
            <Card title={<><CalendarOutlined /> Số ngày nghỉ còn lại</>} className={styles.balanceCard}>
                <div className={styles.balanceStats}>
                    <div className={styles.balanceStat}>
                        <span>Còn lại</span>
                        <span>{balance?.remaining ?? 0} ngày</span>
                    </div>
                    <div className={styles.balanceStat}>
                        <span>Tổng</span>
                        <span>{balance?.total ?? 0} ngày</span>
                    </div>
                    <div className={styles.balanceActions}>
                        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalVisible(true)}>
                            Xin Nghỉ phép
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Request Form Modal */}
            <Modal
                title="Xin Nghỉ phép"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Loại nghỉ phép"
                        name="leave_type"
                        rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ phép' }]}
                    >
                        <Select placeholder="Chọn loại nghỉ phép">
                            <Select.Option value="sick">Nghỉ ốm</Select.Option>
                            <Select.Option value="casual">Nghỉ việc riêng</Select.Option>
                            <Select.Option value="earned">Nghỉ phép năm</Select.Option>
                            <Select.Option value="maternity">Nghỉ thai sản</Select.Option>
                            <Select.Option value="paternity">Nghỉ chăm con</Select.Option>
                            <Select.Option value="unpaid">Nghỉ không lương</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Ngày bắt đầu"
                        name="start_date"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Ngày kết thúc"
                        name="end_date"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Lý do"
                        name="reason"
                        rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Nhập lý do xin nghỉ" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block loading={isPending}>
                        Gửi Yêu cầu
                    </Button>
                </Form>
            </Modal>

            {/* Requests Table */}
            <Card title={<><CalendarOutlined /> Danh sách Nghỉ phép</>} className={styles.requestsCard}>
                {isLoading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
                ) : requests && requests.length > 0 ? (
                    <Table
                        dataSource={requests}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} yêu cầu` }}
                        scroll={{ x: 600 }}
                    />
                ) : (
                    <div style={{ padding: 40 }}><Empty description="Chưa có yêu cầu nghỉ phép" /></div>
                )}
            </Card>
        </div>
    )
}
