import React, { useState } from 'react';
import {
    Table, Button, Tag, Space, Modal, Form, Input, Select, Upload, Empty, Spin, message, Descriptions
} from 'antd';
import {
    PlusOutlined, FileProtectOutlined, EyeOutlined, UploadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRequestService } from '../../shared/services/adminRequestService';
import type { AdministrativeRequest } from '../../shared/types/adminRequest';
import { formatDate } from '../../shared/utils/helpers';
import { useAuthStore } from '../../shared/context/store';
import styles from './AdminRequests.module.css';

const REQUEST_TYPE_OPTIONS = [
    { value: 'employment_verification', label: 'Xác nhận công tác' },
    { value: 'card_replacement', label: 'Cấp lại thẻ' },
    { value: 'salary_certificate', label: 'Giấy xác nhận lương' },
    { value: 'experience_letter', label: 'Giấy xác nhận kinh nghiệm' },
    { value: 'other', label: 'Khác' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
];

const statusColorMap: Record<string, string> = {
    pending: 'orange',
    in_progress: 'blue',
    approved: 'green',
    rejected: 'red',
    completed: 'purple',
};

const priorityColorMap: Record<string, string> = {
    low: 'green',
    medium: 'orange',
    high: 'red',
};

export const AdminRequests: React.FC = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [isProcessModalVisible, setIsProcessModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<AdministrativeRequest | null>(null);
    const [createForm] = Form.useForm();
    const [processForm] = Form.useForm();

    const isHrOrAdmin = user?.role === 'admin' || user?.role === 'hr';

    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin-requests'],
        queryFn: isHrOrAdmin ? adminRequestService.getAllRequests : adminRequestService.getMyRequests,
        staleTime: 1000 * 60 * 2,
    });

    const createMutation = useMutation({
        mutationFn: adminRequestService.createRequest,
        onSuccess: () => {
            message.success('Tạo yêu cầu thành công');
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            setIsCreateModalVisible(false);
            createForm.resetFields();
        },
        onError: () => {
            message.error('Tạo yêu cầu thất bại');
        },
    });

    const processMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { status: string; admin_comment: string } }) =>
            adminRequestService.processRequest(id, data),
        onSuccess: () => {
            message.success('Xử lý yêu cầu thành công');
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            setIsProcessModalVisible(false);
            processForm.resetFields();
        },
        onError: () => {
            message.error('Xử lý yêu cầu thất bại');
        },
    });

    const handleCreate = (values: any) => {
        const payload = {
            request_type: values.request_type,
            title: values.title,
            description: values.description,
            priority: values.priority,
            attachment: values.attachment?.file,
        };
        createMutation.mutate(payload);
    };

    const handleProcess = (values: any) => {
        if (selectedRequest) {
            processMutation.mutate({
                id: selectedRequest.id,
                data: { status: values.status, admin_comment: values.admin_comment || '' },
            });
        }
    };

    const columns = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Loại',
            dataIndex: 'request_type_display',
            key: 'request_type',
            width: 180,
        },
        {
            title: 'Độ ưu tiên',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority: string) => (
                <Tag
                    color={priorityColorMap[priority]}
                    className={styles.tagPriority}
                >
                    {priority.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (status: string) => (
                <Tag
                    color={statusColorMap[status]}
                    className={styles.tagStatus}
                >
                    {status.replace('_', ' ').toUpperCase()}
                </Tag>
            ),
        },
        ...(isHrOrAdmin
            ? [{
                title: 'Nhân viên',
                dataIndex: 'employee_name',
                key: 'employee_name',
                width: 150,
            }]
            : []),
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 120,
            render: (date: string) => (
                <span style={{ color: 'var(--brand-gray-400, #94a3b8)', fontSize: 13 }}>
                    {formatDate(date)}
                </span>
            ),
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 180,
            render: (_: unknown, record: AdministrativeRequest) => (
                <Space size={6}>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setSelectedRequest(record);
                            setIsDetailModalVisible(true);
                        }}
                    >
                        Xem
                    </Button>
                    {isHrOrAdmin && record.status !== 'completed' && record.status !== 'rejected' && (
                        <Button
                            size="small"
                            onClick={() => {
                                setSelectedRequest(record);
                                processForm.resetFields();
                                setIsProcessModalVisible(true);
                            }}
                        >
                            Xử lý
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.requestsPage}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1><FileProtectOutlined /> Yêu cầu Hành chính</h1>
                    <p>{isHrOrAdmin ? 'Quản lý tất cả yêu cầu của nhân viên' : 'Gửi và theo dõi yêu cầu của bạn'}</p>
                </div>
                {!isHrOrAdmin && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className={styles.newRequestBtn}
                        onClick={() => setIsCreateModalVisible(true)}
                    >
                        Yêu cầu Mới
                    </Button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <Spin size="large" />
                </div>
            ) : requests && requests.length > 0 ? (
                <div className={styles.tableWrapper}>
                    <Table
                        columns={columns}
                        dataSource={requests ?? []}
                        rowKey="id"
                        pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} yêu cầu` }}
                        scroll={{ x: 900 }}
                    />
                </div>
            ) : (
                <Empty description="Không có yêu cầu nào" />
            )}

            {/* ── Create Modal ── */}
            <Modal
                title="Yêu cầu Hành chính Mới"
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
                width={600}
                className={styles.modal}
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreate}>
                    <Form.Item
                        label="Loại yêu cầu"
                        name="request_type"
                        rules={[{ required: true, message: 'Vui lòng chọn loại yêu cầu' }]}
                    >
                        <Select options={REQUEST_TYPE_OPTIONS} placeholder="Chọn loại" />
                    </Form.Item>
                    <Form.Item
                        label="Tiêu đề"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                    >
                        <Input placeholder="Tiêu đề ngắn gọn cho yêu cầu" />
                    </Form.Item>
                    <Form.Item
                        label="Mô tả"
                        name="description"
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Mô tả chi tiết yêu cầu của bạn" />
                    </Form.Item>
                    <Form.Item
                        label="Độ ưu tiên"
                        name="priority"
                        initialValue="medium"
                    >
                        <Select options={PRIORITY_OPTIONS} />
                    </Form.Item>
                    <Form.Item label="Tệp đính kèm" name="attachment">
                        <Upload maxCount={1} beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>Đính kèm tệp</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsCreateModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                                Gửi Yêu cầu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Detail Modal ── */}
            <Modal
                title="Chi tiết Yêu cầu"
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                width={700}
                className={styles.modal}
                footer={<Button onClick={() => setIsDetailModalVisible(false)}>Đóng</Button>}
            >
                {selectedRequest && (
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label="Tiêu đề" span={2}>{selectedRequest.title}</Descriptions.Item>
                        <Descriptions.Item label="Loại">{selectedRequest.request_type_display}</Descriptions.Item>
                        <Descriptions.Item label="Độ ưu tiên">
                            <Tag color={priorityColorMap[selectedRequest.priority]} className={styles.tagPriority}>
                                {selectedRequest.priority.toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={statusColorMap[selectedRequest.status]} className={styles.tagStatus}>
                                {selectedRequest.status.replace('_', ' ').toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày tạo">{formatDate(selectedRequest.created_at)}</Descriptions.Item>
                        <Descriptions.Item label="Mô tả" span={2}>{selectedRequest.description}</Descriptions.Item>
                        {selectedRequest.employee_name && (
                            <Descriptions.Item label="Nhân viên">{selectedRequest.employee_name}</Descriptions.Item>
                        )}
                        {selectedRequest.processed_by_name && (
                            <Descriptions.Item label="Người xử lý">{selectedRequest.processed_by_name}</Descriptions.Item>
                        )}
                        {selectedRequest.admin_comment && (
                            <Descriptions.Item label="Nhận xét" span={2}>{selectedRequest.admin_comment}</Descriptions.Item>
                        )}
                        {selectedRequest.completed_at && (
                            <Descriptions.Item label="Ngày hoàn thành">{formatDate(selectedRequest.completed_at)}</Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>

            {/* ── Process Modal ── */}
            <Modal
                title="Xử lý Yêu cầu"
                open={isProcessModalVisible}
                onCancel={() => setIsProcessModalVisible(false)}
                footer={null}
                width={500}
                className={styles.modal}
            >
                <Form form={processForm} layout="vertical" onFinish={handleProcess}>
                    <Form.Item
                        label="Trạng thái"
                        name="status"
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                    >
                        <Select
                            placeholder="Chọn trạng thái"
                            options={[
                                { value: 'in_progress', label: 'Đang xử lý' },
                                { value: 'approved', label: 'Đã duyệt' },
                                { value: 'rejected', label: 'Từ chối' },
                                { value: 'completed', label: 'Hoàn thành' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item label="Nhận xét" name="admin_comment">
                        <Input.TextArea rows={3} placeholder="Thêm nhận xét (tùy chọn)" />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsProcessModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={processMutation.isPending}>
                                Gửi
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};