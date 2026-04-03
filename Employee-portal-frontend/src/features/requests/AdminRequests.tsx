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
import { useI18n } from '../../shared/context/i18n';

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
    const t = useI18n();
    const REQUEST_TYPE_OPTIONS = Object.entries(t.requests.requestTypes).map(([value, label]) => ({ value, label }));
    const PRIORITY_OPTIONS = Object.entries(t.requests.priorities).map(([value, label]) => ({ value, label }));
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
            message.success(t.requests.createSuccess);
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            setIsCreateModalVisible(false);
            createForm.resetFields();
        },
        onError: () => {
            message.error(t.requests.createError);
        },
    });

    const processMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { status: string; admin_comment: string } }) =>
            adminRequestService.processRequest(id, data),
        onSuccess: () => {
            message.success(t.requests.processSuccess);
            queryClient.invalidateQueries({ queryKey: ['admin-requests'] });
            setIsProcessModalVisible(false);
            processForm.resetFields();
        },
        onError: () => {
            message.error(t.requests.processError);
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
            title: t.requests.colTitle,
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: t.requests.colType,
            dataIndex: 'request_type_display',
            key: 'request_type',
            width: 180,
        },
        {
            title: t.requests.colPriority,
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
            title: t.requests.colStatus,
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
                title: t.requests.colEmployee,
                dataIndex: 'employee_name',
                key: 'employee_name',
                width: 150,
            }]
            : []),
        {
            title: t.requests.colCreated,
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
            title: t.requests.colActions,
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
                        {t.requests.btnView}
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
                            {t.requests.btnProcess}
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
                    <h1><FileProtectOutlined /> {t.requests.pageTitle}</h1>
                    <p>{isHrOrAdmin ? t.requests.descAdmin : t.requests.descEmployee}</p>
                </div>
                {!isHrOrAdmin && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className={styles.newRequestBtn}
                        onClick={() => setIsCreateModalVisible(true)}
                    >
                        {t.requests.btnNew}
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
                        pagination={{ pageSize: 10, showTotal: (total) => t.requests.totalItems.replace('{n}', String(total)) }}
                        scroll={{ x: 900 }}
                    />
                </div>
            ) : (
                <Empty description={t.requests.noRequests} />
            )}

            {/* ── Create Modal ── */}
            <Modal
                title={t.requests.createTitle}
                open={isCreateModalVisible}
                onCancel={() => setIsCreateModalVisible(false)}
                footer={null}
                width={600}
                className={styles.modal}
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreate}>
                    <Form.Item
                        label={t.requests.formTypeLabel}
                        name="request_type"
                        rules={[{ required: true, message: t.requests.formTypeRequired }]}
                    >
                        <Select options={REQUEST_TYPE_OPTIONS} placeholder={t.requests.formTypePlaceholder} />
                    </Form.Item>
                    <Form.Item
                        label={t.requests.formTitleLabel}
                        name="title"
                        rules={[{ required: true, message: t.requests.formTitleRequired }]}
                    >
                        <Input placeholder={t.requests.formTitlePlaceholder} />
                    </Form.Item>
                    <Form.Item
                        label={t.requests.formDescLabel}
                        name="description"
                        rules={[{ required: true, message: t.requests.formDescRequired }]}
                    >
                        <Input.TextArea rows={4} placeholder={t.requests.formDescPlaceholder} />
                    </Form.Item>
                    <Form.Item
                        label={t.requests.formPriorityLabel}
                        name="priority"
                        initialValue="medium"
                    >
                        <Select options={PRIORITY_OPTIONS} />
                    </Form.Item>
                    <Form.Item label={t.requests.formAttachLabel} name="attachment">
                        <Upload maxCount={1} beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>{t.requests.btnAttach}</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsCreateModalVisible(false)}>{t.requests.btnCancel}</Button>
                            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
                                {t.requests.btnSubmit}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Detail Modal ── */}
            <Modal
                title={t.requests.detailTitle}
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                width={700}
                className={styles.modal}
                footer={<Button onClick={() => setIsDetailModalVisible(false)}>{t.requests.btnClose}</Button>}
            >
                {selectedRequest && (
                    <Descriptions bordered column={2} size="small">
                        <Descriptions.Item label={t.requests.descItemTitle} span={2}>{selectedRequest.title}</Descriptions.Item>
                        <Descriptions.Item label={t.requests.descItemType}>{selectedRequest.request_type_display}</Descriptions.Item>
                        <Descriptions.Item label={t.requests.descItemPriority}>
                            <Tag color={priorityColorMap[selectedRequest.priority]} className={styles.tagPriority}>
                                {selectedRequest.priority.toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t.requests.descItemStatus}>
                            <Tag color={statusColorMap[selectedRequest.status]} className={styles.tagStatus}>
                                {selectedRequest.status.replace('_', ' ').toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t.requests.descItemCreated}>{formatDate(selectedRequest.created_at)}</Descriptions.Item>
                        <Descriptions.Item label={t.requests.descItemDesc} span={2}>{selectedRequest.description}</Descriptions.Item>
                        {selectedRequest.employee_name && (
                            <Descriptions.Item label={t.requests.descItemEmployee}>{selectedRequest.employee_name}</Descriptions.Item>
                        )}
                        {selectedRequest.processed_by_name && (
                            <Descriptions.Item label={t.requests.descItemProcessor}>{selectedRequest.processed_by_name}</Descriptions.Item>
                        )}
                        {selectedRequest.admin_comment && (
                            <Descriptions.Item label={t.requests.descItemComment} span={2}>{selectedRequest.admin_comment}</Descriptions.Item>
                        )}
                        {selectedRequest.completed_at && (
                            <Descriptions.Item label={t.requests.descItemCompleted}>{formatDate(selectedRequest.completed_at)}</Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>

            {/* ── Process Modal ── */}
            <Modal
                title={t.requests.processTitle}
                open={isProcessModalVisible}
                onCancel={() => setIsProcessModalVisible(false)}
                footer={null}
                width={500}
                className={styles.modal}
            >
                <Form form={processForm} layout="vertical" onFinish={handleProcess}>
                    <Form.Item
                        label={t.requests.processStatusLabel}
                        name="status"
                        rules={[{ required: true, message: t.requests.processStatusRequired }]}
                    >
                        <Select
                            placeholder={t.requests.processStatusLabel}
                            options={Object.entries(t.requests.statusValues).map(([value, label]) => ({ value, label }))}
                        />
                    </Form.Item>
                    <Form.Item label={t.requests.processCommentLabel} name="admin_comment">
                        <Input.TextArea rows={3} placeholder={t.requests.processCommentLabel} />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => setIsProcessModalVisible(false)}>{t.requests.btnCancel}</Button>
                            <Button type="primary" htmlType="submit" loading={processMutation.isPending}>
                                {t.requests.btnSubmit}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};