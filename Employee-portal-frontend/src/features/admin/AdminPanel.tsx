import React, { useState } from 'react'
import { Card, Upload, Button, message, Spin, Table, Space, Popconfirm, Tabs } from 'antd'
import { UploadOutlined, DeleteOutlined, FileTextOutlined, TeamOutlined, AuditOutlined } from '@ant-design/icons'
import { documentService } from '../../shared/services/documentService'
import { formatDate } from '../../shared/utils/helpers'
import PayslipManagement from './PayslipManagement'
import EmployeeManagement from './EmployeeManagement'
import { LoginLogs } from './LoginLogs'
import styles from './AdminPanel.module.css'

interface Document {
    id: string
    title: string
    file_path: string
    uploaded_at: string
    size: number
    content_type: string
}

export const AdminPanel: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Fetch documents
    React.useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        setIsLoading(true)
        try {
            const response = await documentService.listDocuments(1, 100)
            setDocuments(response.data.results)
        } catch (error) {
            message.error('Không thể tải danh sách tài liệu')
        } finally {
            setIsLoading(false)
        }
    }

    // Handle upload
    const handleUpload = async (file: File) => {
        setUploading(true)
        try {
            await documentService.uploadDocument(file, {
                title: file.name,
            })
            message.success('Tải lên tài liệu thành công')
            fetchDocuments()
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Tải lên thất bại')
        } finally {
            setUploading(false)
        }
        return false // Prevent default upload
    }

    // Handle delete
    const handleDelete = async (id: string) => {
        try {
            await documentService.deleteDocument(id)
            message.success('Tài liệu đã xóa')
            fetchDocuments()
        } catch (error) {
            message.error('Xóa thất bại')
        }
    }

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            width: '40%',
        },
        {
            title: 'Ngày tải lên',
            dataIndex: 'uploaded_at',
            key: 'uploaded_at',
            render: (text: string) => formatDate(text),
        },
        {
            title: 'Kích thước',
            dataIndex: 'size',
            key: 'size',
            render: (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: Document) => (
                <Space>
                    <Popconfirm
                        title="Xóa tài liệu"
                        description="Bạn có chắc chắn muốn xóa?"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <Button type="link" danger icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <div className={styles.adminContainer}>
            <Tabs
                items={[
                    {
                        key: 'documents',
                        label: (
                            <>
                                <FileTextOutlined /> Tài liệu
                            </>
                        ),
                        children: (
                            <>
                                <Card title="Quản lý Tài liệu" style={{ marginBottom: 24 }}>
                                    <Upload
                                        beforeUpload={handleUpload}
                                        accept=".pdf,.doc,.docx,.txt"
                                        maxCount={1}
                                    >
                                        <Button icon={<UploadOutlined />} loading={uploading}>
                                            Tải lên Tài liệu
                                        </Button>
                                    </Upload>
                                </Card>

                                <Card title="Tài liệu">
                                    {isLoading ? (
                                        <Spin />
                                    ) : (
                                        <Table
                                            dataSource={documents}
                                            columns={columns}
                                            rowKey="id"
                                            pagination={{ pageSize: 10 }}
                                        />
                                    )}
                                </Card>
                            </>
                        ),
                    },
                    {
                        key: 'payslips',
                        label: '💰 Phiếu lương',
                        children: <PayslipManagement />,
                    },
                    {
                        key: 'employees',
                        label: (
                            <>
                                <TeamOutlined /> Nhân viên
                            </>
                        ),
                        children: <EmployeeManagement />,
                    },
                    {
                        key: 'login-logs',
                        label: (
                            <>
                                <AuditOutlined /> Log đăng nhập
                            </>
                        ),
                        children: <LoginLogs />,
                    },
                ]}
            />
        </div>
    )
}
