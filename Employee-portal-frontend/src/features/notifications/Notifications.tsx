import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    List, Badge, Button, Typography, Tag, Empty, Spin, message
} from 'antd'
import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { notificationService } from '../../shared/services/notificationService'
import type { Notification } from '../../shared/types/notification'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Title, Text } = Typography

const TYPE_COLOR: Record<string, string> = {
    leave_request: 'blue', leave_approved: 'green', leave_rejected: 'red',
    wfh_request: 'blue', wfh_approved: 'green', wfh_rejected: 'red',
    attendance_reminder: 'orange', expense_submitted: 'blue', expense_approved: 'green',
    expense_rejected: 'red', training_enrollment: 'purple', performance_review: 'geekblue',
    asset_assigned: 'cyan', asset_returned: 'default', announcement: 'gold',
    system: 'default', general: 'default',
}

export const Notifications: React.FC = () => {
    const qc = useQueryClient()
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', filter],
        queryFn: () => notificationService.getNotifications(filter === 'unread' ? { is_read: 'false' } : undefined),
    })

    const markReadMutation = useMutation({
        mutationFn: notificationService.markRead,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] })
            qc.invalidateQueries({ queryKey: ['unread-count'] })
        },
    })

    const markAllReadMutation = useMutation({
        mutationFn: notificationService.markAllRead,
        onSuccess: () => {
            message.success('Đã đánh dấu tất cả là đã đọc')
            qc.invalidateQueries({ queryKey: ['notifications'] })
            qc.invalidateQueries({ queryKey: ['unread-count'] })
        },
    })

    const unreadCount = notifications.filter((n: Notification) => !n.is_read).length

    return (
        <div style={{ animation: 'fadeInUp 0.4s ease', maxWidth: 720, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={3} style={{ margin: 0 }}>
                        <BellOutlined style={{ marginRight: 8 }} />
                        Thông báo
                        {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 8 }} />}
                    </Title>
                    <Text type="secondary">Tất cả thông báo của bạn</Text>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        size="small"
                        type={filter === 'all' ? 'primary' : 'default'}
                        onClick={() => setFilter('all')}
                    >Tất cả</Button>
                    <Button
                        size="small"
                        type={filter === 'unread' ? 'primary' : 'default'}
                        onClick={() => setFilter('unread')}
                    >Chưa đọc ({unreadCount})</Button>
                    {unreadCount > 0 && (
                        <Button size="small" icon={<CheckOutlined />} loading={markAllReadMutation.isPending} onClick={() => markAllReadMutation.mutate()}>
                            Đọc tất cả
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
            ) : notifications.length === 0 ? (
                <Empty description="Không có thông báo nào" />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(item: Notification) => (
                        <List.Item
                            key={item.id}
                            style={{
                                background: item.is_read ? 'transparent' : '#f0f5ff',
                                borderRadius: 8,
                                marginBottom: 8,
                                padding: '12px 16px',
                                border: item.is_read ? '1px solid #f0f0f0' : '1px solid #adc6ff',
                                cursor: 'default',
                            }}
                            actions={[
                                !item.is_read && (
                                    <Button
                                        key="read"
                                        size="small"
                                        type="text"
                                        icon={<CheckOutlined />}
                                        loading={markReadMutation.isPending}
                                        onClick={() => markReadMutation.mutate(item.id)}
                                    />
                                )
                            ].filter(Boolean)}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Badge dot={!item.is_read} offset={[-4, 4]}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: '#f0f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                                        }}>
                                            🔔
                                        </div>
                                    </Badge>
                                }
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text strong={!item.is_read}>{item.title}</Text>
                                        <Tag color={TYPE_COLOR[item.notification_type] || 'default'} style={{ fontSize: 11, lineHeight: 1.4 }}>
                                            {item.notification_type_display}
                                        </Tag>
                                    </div>
                                }
                                description={
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>{item.message}</Text>
                                        <br />
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {dayjs(item.created_at).fromNow()} · {dayjs(item.created_at).format('HH:mm DD/MM/YYYY')}
                                        </Text>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </div>
    )
}
