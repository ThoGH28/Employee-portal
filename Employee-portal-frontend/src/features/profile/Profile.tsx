import React, { useEffect } from 'react';
import { Form, Input, Row, Col, Spin, message } from 'antd';
import {
    UserOutlined,
    SaveOutlined,
    HomeOutlined,
    PhoneOutlined,
    BankOutlined,
    InfoCircleOutlined,
    IdcardOutlined,
    TeamOutlined,
    CalendarOutlined,
    MailOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../shared/services/employeeService';
import { getInitials } from '../../shared/utils/helpers';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['employee', 'profile'],
        queryFn: () => employeeService.getProfile().then((res) => res.data),
        staleTime: 1000 * 60 * 10,
    });

    const updateMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => employeeService.updateProfile(data),
        onSuccess: () => {
            message.success('Cập nhật hồ sơ thành công');
            queryClient.invalidateQueries({ queryKey: ['employee', 'profile'] });
        },
        onError: () => {
            message.error('Cập nhật hồ sơ thất bại');
        },
    });

    useEffect(() => {
        if (profile) {
            form.setFieldsValue({
                address: profile.address,
                city: profile.city,
                state: profile.state,
                country: profile.country,
                postal_code: profile.postal_code,
                emergency_contact: profile.emergency_contact,
                emergency_contact_phone: profile.emergency_contact_phone,
                bank_name: profile.bank_name,
                bank_account_number: profile.bank_account_number,
                bank_branch: profile.bank_branch,
                bio: profile.bio,
            });
        }
    }, [profile, form]);

    const handleSubmit = (values: Record<string, unknown>) => {
        updateMutation.mutate(values);
    };

    if (isLoading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }} />;

    const user = profile?.user;
    const initials = user ? getInitials(user.first_name, user.last_name) : '?';
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Nhân viên';

    return (
        <div className={styles.profilePage}>

            {/* ── Page header ──────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>
                        <span className={styles.titleIcon}>
                            <UserOutlined />
                        </span>
                        Hồ sơ của tôi
                    </h1>
                    <p>Xem và cập nhật thông tin cá nhân của bạn.</p>
                </div>
            </div>

            {/* ── Identity hero ─────────────────────────── */}
            <div className={styles.heroCard}>
                <div className={styles.heroAvatar}>{initials}</div>
                <div className={styles.heroInfo}>
                    <h2>{fullName}</h2>
                    <div className={styles.heroMeta}>
                        {profile?.designation && (
                            <span className={styles.heroPill}>
                                <IdcardOutlined />
                                {profile.designation}
                            </span>
                        )}
                        {profile?.department && (
                            <span className={styles.heroPill}>
                                <TeamOutlined />
                                {profile.department}
                            </span>
                        )}
                        {user?.email && (
                            <span className={styles.heroPill}>
                                <MailOutlined />
                                {user.email}
                            </span>
                        )}
                    </div>
                    {profile?.employee_id && (
                        <span className={styles.heroId}>
                            Employee ID · {profile.employee_id}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Form ─────────────────────────────────── */}
            <Form form={form} layout="vertical" onFinish={handleSubmit}>

                {/* Basic Information (read-only) */}
                <div className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><UserOutlined /></span>
                        Thông tin Cơ bản
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item label="Họ">
                                <Input
                                    value={user?.first_name}
                                    disabled
                                    className={styles.readOnlyField}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Tên">
                                <Input
                                    value={user?.last_name}
                                    disabled
                                    className={styles.readOnlyField}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Email">
                                <Input
                                    value={user?.email}
                                    disabled
                                    className={styles.readOnlyField}
                                    prefix={<MailOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Phòng ban">
                                <Input
                                    value={profile?.department}
                                    disabled
                                    className={styles.readOnlyField}
                                    prefix={<TeamOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Chức danh">
                                <Input
                                    value={profile?.designation}
                                    disabled
                                    className={styles.readOnlyField}
                                    prefix={<IdcardOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Ngày vào làm">
                                <Input
                                    value={profile?.date_of_joining}
                                    disabled
                                    className={styles.readOnlyField}
                                    prefix={<CalendarOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Address */}
                <div className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><HomeOutlined /></span>
                        Địa chỉ
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24}>
                            <Form.Item label="Địa chỉ" name="address">
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Nhập địa chỉ của bạn"
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Thành phố" name="city">
                                <Input placeholder="Thành phố" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Tỉnh" name="state">
                                <Input placeholder="Tỉnh" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Quốc gia" name="country">
                                <Input placeholder="Quốc gia" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label="Mã bưu điện" name="postal_code">
                                <Input placeholder="Mã bưu điện" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Emergency Contact */}
                <div className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><PhoneOutlined /></span>
                        Liên hệ Khẩn cấp
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Tên liên hệ" name="emergency_contact">
                                <Input
                                    placeholder="Họ tên người liên hệ khẩn cấp"
                                    prefix={<UserOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Số điện thoại" name="emergency_contact_phone">
                                <Input
                                    placeholder="+84 000 000 000"
                                    prefix={<PhoneOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Bank Account */}
                <div className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><BankOutlined /></span>
                        Tài khoản Ngân hàng
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item label="Tên ngân hàng" name="bank_name">
                                <Input
                                    placeholder="VD: Vietcombank"
                                    prefix={<BankOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Số tài khoản" name="bank_account_number">
                                <Input placeholder="Số tài khoản" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label="Chi nhánh" name="bank_branch">
                                <Input placeholder="Tên chi nhánh" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Bio */}
                <div className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><InfoCircleOutlined /></span>
                        Giới thiệu
                    </p>
                    <Form.Item label="Tiểu sử" name="bio">
                        <Input.TextArea
                            rows={3}
                            placeholder="Giới thiệu ngắn về bản thân — vai trò, sở thích hoặc chuyên môn…"
                            style={{ resize: 'none' }}
                        />
                    </Form.Item>
                </div>

                {/* Footer action */}
                <div className={styles.footerBar}>
                    <span className={styles.footerHint}>
                        Thông tin cơ bản do phòng Nhân sự quản lý và không thể chỉnh sửa tại đây.
                    </span>
                    <button
                        type="submit"
                        className={styles.btnSave}
                        disabled={updateMutation.isPending}
                    >
                        <SaveOutlined />
                        {updateMutation.isPending ? 'Đang lưu…' : 'Lưu Thay đổi'}
                    </button>
                </div>

            </Form>
        </div>
    );
};