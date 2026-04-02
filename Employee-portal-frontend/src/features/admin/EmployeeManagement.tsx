import React, { useState } from 'react'
import {
    Table, Button, Modal, Form, Input, Select, DatePicker, Space,
    message, Tag, Avatar, Typography, Tooltip,
} from 'antd'
import { EditOutlined, UserOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useListEmployees, useAdminUpdateEmployee, useCreateEmployee } from '../../shared/hooks/queries'
import type { Employee } from '../../shared/types'

const { Text } = Typography

const DEPARTMENT_OPTIONS = [
    { value: 'hr', label: 'Nhân sự' },
    { value: 'it', label: 'Công nghệ Thông tin' },
    { value: 'sales', label: 'Kinh doanh' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Vận hành' },
    { value: 'finance', label: 'Tài chính' },
]

const DEPT_LABEL: Record<string, string> = {
    hr: 'Nhân sự',
    it: 'CNTT',
    sales: 'Kinh doanh',
    marketing: 'Marketing',
    operations: 'Vận hành',
    finance: 'Tài chính',
}

const DEPT_COLOR: Record<string, string> = {
    hr: 'pink',
    it: 'blue',
    sales: 'green',
    marketing: 'orange',
    operations: 'purple',
    finance: 'gold',
}

const ROLE_OPTIONS = [
    { value: 'employee', label: 'Nhân viên' },
    { value: 'hr', label: 'HR' },
    { value: 'admin', label: 'Quản trị viên' },
]

const EmployeeManagement: React.FC = () => {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [editTarget, setEditTarget] = useState<Employee | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [form] = Form.useForm()
    const [createForm] = Form.useForm()

    const { data, isLoading } = useListEmployees(page, 20)
    const { mutate: adminUpdate, isPending: saving } = useAdminUpdateEmployee()
    const { mutate: createEmployee, isPending: creating } = useCreateEmployee()

    const employees: Employee[] = data?.results ?? []
    const total: number = data?.count ?? 0

    const filtered = search
        ? employees.filter(emp => {
            const q = search.toLowerCase()
            const full = `${emp.user?.first_name} ${emp.user?.last_name}`.toLowerCase()
            return (
                full.includes(q) ||
                emp.user?.email?.toLowerCase().includes(q) ||
                emp.employee_id?.toLowerCase().includes(q) ||
                emp.designation?.toLowerCase().includes(q)
            )
        })
        : employees

    const openEdit = (emp: Employee) => {
        setEditTarget(emp)
        form.setFieldsValue({
            first_name: emp.user?.first_name,
            last_name: emp.user?.last_name,
            email: emp.user?.email,
            role: emp.user?.role,
            department: emp.department,
            designation: emp.designation,
            date_of_joining: emp.date_of_joining ? dayjs(emp.date_of_joining) : null,
            bio: emp.bio,
        })
    }

    const handleSave = (values: any) => {
        if (!editTarget) return
        const payload: Record<string, any> = {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            role: values.role,
            department: values.department,
            designation: values.designation,
            date_of_joining: values.date_of_joining?.format('YYYY-MM-DD'),
            bio: values.bio,
        }
        adminUpdate(
            { id: editTarget.id, data: payload },
            {
                onSuccess: () => {
                    message.success('Cập nhật thông tin nhân viên thành công')
                    setEditTarget(null)
                    form.resetFields()
                },
                onError: (err: any) => {
                    message.error(err.response?.data?.detail || 'Cập nhật thất bại')
                },
            }
        )
    }

    const handleCreate = (values: any) => {
        const payload: Record<string, any> = {
            username: values.username,
            email: values.email,
            password: values.password,
            first_name: values.first_name,
            last_name: values.last_name,
            role: values.role,
            phone_number: values.phone_number ?? '',
            department: values.department,
            designation: values.designation,
            employee_id: values.employee_id,
            date_of_joining: values.date_of_joining?.format('YYYY-MM-DD'),
            date_of_birth: values.date_of_birth?.format('YYYY-MM-DD') ?? null,
            bio: values.bio ?? '',
        }
        createEmployee(payload, {
            onSuccess: () => {
                message.success('Tạo nhân viên thành công')
                setCreateOpen(false)
                createForm.resetFields()
            },
            onError: (err: any) => {
                const data = err.response?.data
                if (data && typeof data === 'object') {
                    const msgs = Object.entries(data)
                        .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
                        .join('\n')
                    message.error(msgs || 'Tạo thất bại')
                } else {
                    message.error('Tạo thất bại')
                }
            },
        })
    }

    const columns = [
        {
            title: 'Nhân viên',
            key: 'name',
            render: (_: any, emp: Employee) => (
                <Space>
                    <Avatar
                        src={emp.profile_image || emp.avatar}
                        icon={<UserOutlined />}
                        size={36}
                    />
                    <div>
                        <Text strong style={{ display: 'block', lineHeight: 1.3 }}>
                            {emp.user?.first_name} {emp.user?.last_name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {emp.user?.email}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Mã NV',
            dataIndex: 'employee_id',
            key: 'employee_id',
            width: 110,
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
            width: 140,
            render: (dept: string) => (
                <Tag color={DEPT_COLOR[dept] || 'default'}>
                    {DEPT_LABEL[dept] || dept}
                </Tag>
            ),
        },
        {
            title: 'Chức danh',
            dataIndex: 'designation',
            key: 'designation',
        },
        {
            title: 'Ngày vào',
            dataIndex: 'date_of_joining',
            key: 'date_of_joining',
            width: 110,
            render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 80,
            render: (_: any, emp: Employee) => (
                <Tooltip title="Chỉnh sửa">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(emp)}
                    />
                </Tooltip>
            ),
        },
    ]

    return (
        <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Input
                    placeholder="Tìm theo tên, email, mã NV, chức danh..."
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    allowClear
                    style={{ maxWidth: 380 }}
                />
                <Button type="primary" onClick={() => setCreateOpen(true)}>
                    + Tạo nhân viên mới
                </Button>
            </div>

            <Table
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{
                    current: page,
                    pageSize: 20,
                    total,
                    onChange: p => setPage(p),
                    showTotal: t => `${t} nhân viên`,
                }}
                size="middle"
            />

            <Modal
                title={
                    editTarget
                        ? `Chỉnh sửa: ${editTarget.user?.first_name} ${editTarget.user?.last_name}`
                        : 'Chỉnh sửa nhân viên'
                }
                open={!!editTarget}
                onCancel={() => { setEditTarget(null); form.resetFields() }}
                footer={null}
                width={560}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    style={{ marginTop: 8 }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                            label="Họ"
                            name="last_name"
                            rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Tên"
                            name="first_name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                        >
                            <Input />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                            label="Phòng ban"
                            name="department"
                            rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}
                        >
                            <Select options={DEPARTMENT_OPTIONS} />
                        </Form.Item>
                        <Form.Item
                            label="Vai trò hệ thống"
                            name="role"
                            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                        >
                            <Select options={ROLE_OPTIONS} />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Chức danh"
                        name="designation"
                        rules={[{ required: true, message: 'Vui lòng nhập chức danh' }]}
                    >
                        <Input placeholder="VD: Kỹ sư phần mềm" />
                    </Form.Item>

                    <Form.Item label="Ngày vào làm" name="date_of_joining">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item label="Giới thiệu bản thân" name="bio">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setEditTarget(null); form.resetFields() }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={saving}>
                                Lưu thay đổi
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Tạo nhân viên mới"
                open={createOpen}
                onCancel={() => { setCreateOpen(false); createForm.resetFields() }}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                    style={{ marginTop: 8 }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                            label="Họ"
                            name="last_name"
                            rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Tên"
                            name="first_name"
                            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                        >
                            <Input />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                            label="Tên đăng nhập"
                            name="username"
                            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Mã nhân viên"
                            name="employee_id"
                            rules={[{ required: true, message: 'Vui lòng nhập mã nhân viên' }]}
                        >
                            <Input placeholder="VD: EMP001" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                            label="Mật khẩu"
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            label="Số điện thoại"
                            name="phone_number"
                        >
                            <Input />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                            label="Phòng ban"
                            name="department"
                            rules={[{ required: true, message: 'Vui lòng chọn phòng ban' }]}
                        >
                            <Select options={DEPARTMENT_OPTIONS} />
                        </Form.Item>
                        <Form.Item
                            label="Vai trò hệ thống"
                            name="role"
                            initialValue="employee"
                            rules={[{ required: true }]}
                        >
                            <Select options={ROLE_OPTIONS} />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <Form.Item
                            label="Chức danh"
                            name="designation"
                            rules={[{ required: true, message: 'Vui lòng nhập chức danh' }]}
                        >
                            <Input placeholder="VD: Kỹ sư phần mềm" />
                        </Form.Item>
                        <Form.Item
                            label="Ngày vào làm"
                            name="date_of_joining"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày vào làm' }]}
                        >
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </div>

                    <Form.Item label="Ngày sinh" name="date_of_birth">
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item label="Giới thiệu" name="bio">
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setCreateOpen(false); createForm.resetFields() }}>
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={creating}>
                                Tạo nhân viên
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}

export default EmployeeManagement
