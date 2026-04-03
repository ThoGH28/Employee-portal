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
import { useI18n } from '../../shared/context/i18n';
import { getInitials } from '../../shared/utils/helpers';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const t = useI18n();

    const { data: profile, isLoading } = useQuery({
        queryKey: ['employee', 'profile'],
        queryFn: () => employeeService.getProfile().then((res) => res.data),
        staleTime: 1000 * 60 * 10,
    });

    const updateMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => employeeService.updateProfile(data),
        onSuccess: () => {
            message.success(t.profile.updateSuccess);
            queryClient.invalidateQueries({ queryKey: ['employee', 'profile'] });
        },
        onError: () => {
            message.error(t.profile.updateError);
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
                        {t.profile.pageTitle}
                    </h1>
                    <p>{t.profile.pageDesc}</p>
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
                        {t.profile.sectionBasic}
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldFirstName}>
                                <Input
                                    value={user?.first_name}
                                    disabled
                                    className={styles.readOnlyField}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldLastName}>
                                <Input
                                    value={user?.last_name}
                                    disabled
                                    className={styles.readOnlyField}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldEmail}>
                                <Input
                                    value={user?.email}
                                    disabled
                                    className={styles.readOnlyField}
                                    prefix={<MailOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldDept}>
                                <Input
                                    value={profile?.department}
                                    disabled
                                    className={styles.readOnlyField}
                                    prefix={<TeamOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldDesignation}>
                                <Input
                                    value={profile?.designation}
                                    disabled
                                    className={styles.readOnlyField}
                                    prefix={<IdcardOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldJoinDate}>
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
                        {t.profile.sectionAddress}
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24}>
                            <Form.Item label={t.profile.fieldAddress} name="address">
                                <Input.TextArea
                                    rows={2}
                                    placeholder={t.profile.placeholderAddress}
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label={t.profile.fieldCity} name="city">
                                <Input placeholder={t.profile.fieldCity} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label={t.profile.fieldState} name="state">
                                <Input placeholder={t.profile.fieldState} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label={t.profile.fieldCountry} name="country">
                                <Input placeholder={t.profile.fieldCountry} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item label={t.profile.fieldPostal} name="postal_code">
                                <Input placeholder={t.profile.fieldPostal} />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Emergency Contact */}
                <div className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><PhoneOutlined /></span>
                        {t.profile.sectionEmergency}
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item label={t.profile.fieldEmergencyContact} name="emergency_contact">
                                <Input
                                    placeholder={t.profile.placeholderEmergencyContact}
                                    prefix={<UserOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label={t.profile.fieldEmergencyPhone} name="emergency_contact_phone">
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
                        {t.profile.sectionBank}
                    </p>
                    <Row gutter={[16, 0]}>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldBankName} name="bank_name">
                                <Input
                                    placeholder={t.profile.placeholderBankName}
                                    prefix={<BankOutlined style={{ color: 'var(--brand-gray-300)' }} />}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldBankAccount} name="bank_account_number">
                                <Input placeholder={t.profile.fieldBankAccount} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label={t.profile.fieldBankBranch} name="bank_branch">
                                <Input placeholder={t.profile.fieldBankBranch} />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* Bio */}
                <div className={styles.sectionCard}>
                    <p className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}><InfoCircleOutlined /></span>
                        {t.profile.sectionBio}
                    </p>
                    <Form.Item label={t.profile.fieldBio} name="bio">
                        <Input.TextArea
                            rows={3}
                            placeholder={t.profile.placeholderBio}
                            style={{ resize: 'none' }}
                        />
                    </Form.Item>
                </div>

                {/* Footer action */}
                <div className={styles.footerBar}>
                    <span className={styles.footerHint}>
                        {t.profile.footerHint}
                    </span>
                    <button
                        type="submit"
                        className={styles.btnSave}
                        disabled={updateMutation.isPending}
                    >
                        <SaveOutlined />
                        {updateMutation.isPending ? t.profile.btnSaving : t.profile.btnSave}
                    </button>
                </div>

            </Form>
        </div>
    );
};