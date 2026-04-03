import React, { useEffect, useState, useCallback } from 'react'
import { Table, Tag, Select, Button, Space, Typography, Tooltip, Badge } from 'antd'
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, GlobalOutlined, LaptopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '../../shared/services/api'
import { formatDate } from '../../shared/utils/helpers'

const { Text } = Typography
const { Option } = Select

interface LoginLogEntry {
    id: number
    username: string | null
    username_attempted: string
    ip_address: string | null
    user_agent: string
    status: 'success' | 'failed'
    created_at: string
}

interface LogsResponse {
    count: number
    results: LoginLogEntry[]
}

/** Parse browser / OS from user agent string */
function parseUserAgent(ua: string): { browser: string; os: string } {
    if (!ua) return { browser: 'Không rõ', os: 'Không rõ' }

    let browser = 'Không rõ'
    if (ua.includes('Edg/')) browser = 'Edge'
    else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera'
    else if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'IE'

    let os = 'Không rõ'
    if (ua.includes('Windows NT')) os = 'Windows'
    else if (ua.includes('Mac OS X')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

    return { browser, os }
}

const PAGE_SIZE = 20

export const LoginLogs: React.FC = () => {
    const [logs, setLogs] = useState<LoginLogEntry[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const fetchLogs = useCallback(async (currentPage: number, status: string) => {
        setLoading(true)
        try {
            const params: Record<string, string | number> = {
                page: currentPage,
                page_size: PAGE_SIZE,
            }
            if (status) params.status = status

            const res = await api.get<LogsResponse>('/auth/login-logs/', { params })
            setLogs(res.data.results)
            setTotal(res.data.count)
        } catch {
            // silently fail — table stays empty
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLogs(page, statusFilter)
    }, [page, statusFilter, fetchLogs])

    const handleRefresh = () => fetchLogs(page, statusFilter)

    const columns: ColumnsType<LoginLogEntry> = [
        {
            title: 'Thời gian',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 170,
            render: (val: string) => (
                <Text style={{ fontSize: 13 }}>{formatDate(val)}</Text>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (val: 'success' | 'failed') =>
                val === 'success' ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        Thành công
                    </Tag>
                ) : (
                    <Tag icon={<CloseCircleOutlined />} color="error">
                        Thất bại
                    </Tag>
                ),
        },
        {
            title: 'Tài khoản',
            key: 'account',
            width: 170,
            render: (_: unknown, record: LoginLogEntry) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 13 }}>
                        {record.username || record.username_attempted || '—'}
                    </Text>
                    {record.username && record.username !== record.username_attempted && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            ({record.username_attempted})
                        </Text>
                    )}
                </Space>
            ),
        },
        {
            title: 'Địa chỉ IP',
            dataIndex: 'ip_address',
            key: 'ip_address',
            width: 140,
            render: (ip: string | null) => (
                <Space>
                    <GlobalOutlined style={{ color: '#1677ff' }} />
                    <Text style={{ fontSize: 13 }}>{ip || '—'}</Text>
                </Space>
            ),
        },
        {
            title: 'Trình duyệt / Hệ điều hành',
            dataIndex: 'user_agent',
            key: 'user_agent',
            render: (ua: string) => {
                const { browser, os } = parseUserAgent(ua)
                return (
                    <Tooltip title={ua || 'Không có thông tin'} placement="topLeft">
                        <Space>
                            <LaptopOutlined style={{ color: '#52c41a' }} />
                            <Text style={{ fontSize: 13 }}>
                                {browser}
                                {os !== 'Không rõ' && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {' '}/ {os}
                                    </Text>
                                )}
                            </Text>
                        </Space>
                    </Tooltip>
                )
            },
        },
    ]

    const failedCount = logs.filter((l) => l.status === 'failed').length

    return (
        <div style={{ padding: '4px 0' }}>
            <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                <Select
                    placeholder="Lọc trạng thái"
                    allowClear
                    style={{ width: 160 }}
                    value={statusFilter || undefined}
                    onChange={(val) => {
                        setPage(1)
                        setStatusFilter(val ?? '')
                    }}
                >
                    <Option value="success">
                        <Badge status="success" text="Thành công" />
                    </Option>
                    <Option value="failed">
                        <Badge status="error" text="Thất bại" />
                    </Option>
                </Select>

                <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
                    Làm mới
                </Button>

                {!statusFilter && failedCount > 0 && (
                    <Tag color="warning">
                        {failedCount} đăng nhập thất bại trong trang này
                    </Tag>
                )}

                <Text type="secondary" style={{ fontSize: 13 }}>
                    Tổng: {total} bản ghi
                </Text>
            </Space>

            <Table<LoginLogEntry>
                dataSource={logs}
                columns={columns}
                rowKey="id"
                loading={loading}
                size="small"
                scroll={{ x: 800 }}
                rowClassName={(record) =>
                    record.status === 'failed' ? 'login-log-row-failed' : ''
                }
                pagination={{
                    current: page,
                    pageSize: PAGE_SIZE,
                    total,
                    showSizeChanger: false,
                    showTotal: (t) => `${t} bản ghi`,
                    onChange: (p) => setPage(p),
                }}
            />

            <style>{`
                .login-log-row-failed td {
                    background-color: rgba(255, 77, 79, 0.04) !important;
                }
            `}</style>
        </div>
    )
}
