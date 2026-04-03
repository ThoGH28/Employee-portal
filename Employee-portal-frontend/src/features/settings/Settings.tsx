import React, { useState } from 'react'
import {
    Tabs,
    Card,
    Radio,
    Switch,
    Form,
    Input,
    Button,
    Select,
    Divider,
    Typography,
    Space,
    Tag,
    message,
    Row,
    Col,
    Alert,
} from 'antd'
import {
    GlobalOutlined,
    BgColorsOutlined,
    SafetyOutlined,
    BellOutlined,
    InfoCircleOutlined,
    LockOutlined,
    KeyOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
    ClockCircleOutlined,
    MailOutlined,
    MobileOutlined,
    CalendarOutlined,
    DollarOutlined,
    SettingOutlined,
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { useSettingsStore, type ThemeMode, type Language } from '../../shared/context/settingsStore'
import { useI18n } from '../../shared/context/i18n'
import { authService } from '../../shared/services/authService'
import styles from './Settings.module.css'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

/* ─── Sub-sections ────────────────────────────────────────────────── */

const LanguageTab: React.FC = () => {
    const t = useI18n()
    const { language, setLanguage } = useSettingsStore()

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <Title level={4} className={styles.sectionTitle}>{t.language.heading}</Title>
                <Text type="secondary">{t.language.desc}</Text>
            </div>

            <Card className={styles.settingCard}>
                <Radio.Group
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className={styles.radioGroup}
                >
                    <Radio.Button value="vi" className={styles.radioBtn}>
                        <span className={styles.langOption}>
                            <span className={styles.flag}>🇻🇳</span>
                            <span>
                                <strong>{t.language.vietnamese}</strong>
                                <small>Tiếng Việt</small>
                            </span>
                        </span>
                    </Radio.Button>
                    <Radio.Button value="en" className={styles.radioBtn}>
                        <span className={styles.langOption}>
                            <span className={styles.flag}>🇬🇧</span>
                            <span>
                                <strong>{t.language.english}</strong>
                                <small>English</small>
                            </span>
                        </span>
                    </Radio.Button>
                </Radio.Group>

                {language === 'vi' && (
                    <Tag color="green" style={{ marginTop: 16 }}>
                        <CheckCircleOutlined /> Đang sử dụng
                    </Tag>
                )}
                {language === 'en' && (
                    <Tag color="green" style={{ marginTop: 16 }}>
                        <CheckCircleOutlined /> Currently active
                    </Tag>
                )}
            </Card>
        </div>
    )
}

const AppearanceTab: React.FC = () => {
    const t = useI18n()
    const { themeMode, setThemeMode } = useSettingsStore()

    const themes: { value: ThemeMode; icon: string; label: string; preview: string }[] = [
        { value: 'light', icon: '☀️', label: t.appearance.light, preview: '#ffffff' },
        { value: 'dark', icon: '🌙', label: t.appearance.dark, preview: '#0f172a' },
        { value: 'system', icon: '💻', label: t.appearance.system, preview: 'linear-gradient(135deg,#fff 50%,#0f172a 50%)' },
    ]

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <Title level={4} className={styles.sectionTitle}>{t.appearance.heading}</Title>
                <Text type="secondary">{t.appearance.desc}</Text>
            </div>

            <div className={styles.themeGrid}>
                {themes.map((theme) => (
                    <button
                        key={theme.value}
                        className={`${styles.themeCard} ${themeMode === theme.value ? styles.themeCardActive : ''}`}
                        onClick={() => setThemeMode(theme.value)}
                    >
                        <div
                            className={styles.themePreview}
                            style={{ background: theme.preview }}
                        >
                            <span className={styles.themeIcon}>{theme.icon}</span>
                        </div>
                        <span className={styles.themeLabel}>{theme.label}</span>
                        {themeMode === theme.value && (
                            <span className={styles.themeCheck}>
                                <CheckCircleOutlined />
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

const SecurityTab: React.FC = () => {
    const t = useI18n()
    const { twoFactorEnabled, setTwoFactorEnabled, sessionTimeout, setSessionTimeout } = useSettingsStore()
    const [form] = Form.useForm()

    const changePasswordMutation = useMutation({
        mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
            authService.changePassword(oldPassword, newPassword),
        onSuccess: () => {
            message.success(t.security.passwordSuccess)
            form.resetFields()
        },
        onError: () => {
            message.error(t.security.passwordError)
        },
    })

    const handleChangePassword = (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error(t.security.passwordMismatch)
            return
        }
        changePasswordMutation.mutate({ oldPassword: values.currentPassword, newPassword: values.newPassword })
    }

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <Title level={4} className={styles.sectionTitle}>{t.security.heading}</Title>
                <Text type="secondary">{t.security.desc}</Text>
            </div>

            {/* Change Password */}
            <Card className={styles.settingCard} title={
                <Space>
                    <KeyOutlined className={styles.cardIcon} />
                    <span>{t.security.changePassword}</span>
                </Space>
            }>
                <Form form={form} layout="vertical" onFinish={handleChangePassword} style={{ maxWidth: 480 }}>
                    <Form.Item
                        name="currentPassword"
                        label={t.security.currentPassword}
                        rules={[{ required: true }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label={t.security.newPassword}
                        rules={[
                            { required: true },
                            { min: 8, message: language === 'vi' ? 'Tối thiểu 8 ký tự' : 'Min 8 characters' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label={t.security.confirmPassword}
                        rules={[{ required: true }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={changePasswordMutation.isPending}
                            icon={<KeyOutlined />}
                        >
                            {t.security.save}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* 2FA */}
            <Card className={styles.settingCard} title={
                <Space>
                    <SafetyCertificateOutlined className={styles.cardIcon} />
                    <span>{t.security.twoFactor}</span>
                    <Tag color="orange">Beta</Tag>
                </Space>
            }>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Text type="secondary">{t.security.twoFactorDesc}</Text>
                    </Col>
                    <Col>
                        <Switch
                            checked={twoFactorEnabled}
                            onChange={setTwoFactorEnabled}
                            disabled
                        />
                    </Col>
                </Row>
            </Card>

            {/* Session timeout */}
            <Card className={styles.settingCard} title={
                <Space>
                    <ClockCircleOutlined className={styles.cardIcon} />
                    <span>{t.security.sessionTimeout}</span>
                </Space>
            }>
                <Row align="middle" gutter={16}>
                    <Col>
                        <Select
                            value={sessionTimeout}
                            onChange={setSessionTimeout}
                            style={{ width: 120 }}
                        >
                            {[15, 30, 60, 120, 480].map((m) => (
                                <Option key={m} value={m}>{m}</Option>
                            ))}
                        </Select>
                    </Col>
                    <Col>
                        <Text type="secondary">{t.security.sessionTimeoutUnit}</Text>
                    </Col>
                </Row>
            </Card>

            {/* Privacy notice */}
            <Card className={styles.settingCard} title={
                <Space>
                    <EyeInvisibleOutlined className={styles.cardIcon} />
                    <span>{t.security.privacy}</span>
                </Space>
            }>
                <Alert
                    type="info"
                    showIcon
                    message={t.security.dataDesc}
                />
            </Card>
        </div>
    )
}

// Need access to language for validation message — hoist to module level via store
const SecurityTabWrapper: React.FC = () => {
    const language = useSettingsStore((s) => s.language)
    // pass language down to SecurityTab internals via closure
    return <SecurityTab key={language} />
}

// Patch: expose language for the form rule inside SecurityTab
let language: Language = 'vi'
const _LanguageSync: React.FC = () => {
    language = useSettingsStore((s) => s.language)
    return null
}

const NotificationsTab: React.FC = () => {
    const t = useI18n()
    const {
        emailNotifications, setEmailNotifications,
        pushNotifications, setPushNotifications,
        leaveNotifications, setLeaveNotifications,
        payslipNotifications, setPayslipNotifications,
    } = useSettingsStore()

    const handleSave = () => {
        message.success(t.notifications.saved)
    }

    const notifItems = [
        {
            icon: <MailOutlined />,
            label: t.notifications.email,
            desc: t.notifications.emailDesc,
            checked: emailNotifications,
            onChange: setEmailNotifications,
        },
        {
            icon: <MobileOutlined />,
            label: t.notifications.push,
            desc: t.notifications.pushDesc,
            checked: pushNotifications,
            onChange: setPushNotifications,
        },
        {
            icon: <CalendarOutlined />,
            label: t.notifications.leave,
            desc: t.notifications.leaveDesc,
            checked: leaveNotifications,
            onChange: setLeaveNotifications,
        },
        {
            icon: <DollarOutlined />,
            label: t.notifications.payslip,
            desc: t.notifications.payslipDesc,
            checked: payslipNotifications,
            onChange: setPayslipNotifications,
        },
    ]

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <Title level={4} className={styles.sectionTitle}>{t.notifications.heading}</Title>
                <Text type="secondary">{t.notifications.desc}</Text>
            </div>

            <Card className={styles.settingCard}>
                {notifItems.map((item, i) => (
                    <React.Fragment key={i}>
                        <Row align="middle" justify="space-between" className={styles.notifRow}>
                            <Col>
                                <Space align="start">
                                    <span className={styles.notifIcon}>{item.icon}</span>
                                    <span>
                                        <div className={styles.notifLabel}>{item.label}</div>
                                        <Text type="secondary" style={{ fontSize: 13 }}>{item.desc}</Text>
                                    </span>
                                </Space>
                            </Col>
                            <Col>
                                <Switch checked={item.checked} onChange={item.onChange} />
                            </Col>
                        </Row>
                        {i < notifItems.length - 1 && <Divider style={{ margin: '12px 0' }} />}
                    </React.Fragment>
                ))}
            </Card>

            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSave} style={{ marginTop: 8 }}>
                {t.notifications.save}
            </Button>
        </div>
    )
}

const AboutTab: React.FC = () => {
    const t = useI18n()

    const stack = ['React 18', 'TypeScript', 'Ant Design 5', 'Django REST', 'PostgreSQL', 'Redis']

    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeader}>
                <Title level={4} className={styles.sectionTitle}>{t.about.heading}</Title>
            </div>

            <Card className={styles.settingCard}>
                <div className={styles.aboutHero}>
                    <div className={styles.aboutLogo}>⚡</div>
                    <Title level={3} style={{ margin: 0 }}>{t.about.appName}</Title>
                    <Text type="secondary">{t.about.version} 1.0.0</Text>
                </div>

                <Divider />

                <Row gutter={[24, 16]}>
                    <Col xs={24} sm={12}>
                        <Text strong>{t.about.tech}</Text>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {stack.map((s) => (
                                <Tag key={s} color="geekblue">{s}</Tag>
                            ))}
                        </div>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Text strong>{t.about.support}</Text>
                        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                            {t.about.supportDesc}
                        </Paragraph>
                    </Col>
                </Row>

                <Divider />

                <Space split={<Divider type="vertical" />}>
                    <Button type="link" style={{ padding: 0 }}>{t.about.privacy}</Button>
                    <Button type="link" style={{ padding: 0 }}>{t.about.terms}</Button>
                </Space>

                <div style={{ marginTop: 20 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{t.about.copyright}</Text>
                </div>
            </Card>
        </div>
    )
}

/* ─── Main Settings page ──────────────────────────────────────────── */

export const Settings: React.FC = () => {
    const t = useI18n()
    const [activeTab, setActiveTab] = useState('language')

    const tabItems = [
        {
            key: 'language',
            label: (
                <span className={styles.tabLabel}>
                    <GlobalOutlined />
                    {t.tabs.language}
                </span>
            ),
            children: <LanguageTab />,
        },
        {
            key: 'appearance',
            label: (
                <span className={styles.tabLabel}>
                    <BgColorsOutlined />
                    {t.tabs.appearance}
                </span>
            ),
            children: <AppearanceTab />,
        },
        {
            key: 'security',
            label: (
                <span className={styles.tabLabel}>
                    <SafetyOutlined />
                    {t.tabs.security}
                </span>
            ),
            children: <SecurityTabWrapper />,
        },
        {
            key: 'notifications',
            label: (
                <span className={styles.tabLabel}>
                    <BellOutlined />
                    {t.tabs.notifications}
                </span>
            ),
            children: <NotificationsTab />,
        },
        {
            key: 'about',
            label: (
                <span className={styles.tabLabel}>
                    <InfoCircleOutlined />
                    {t.tabs.about}
                </span>
            ),
            children: <AboutTab />,
        },
    ]

    return (
        <div className={styles.settingsPage}>
            <_LanguageSync />

            {/* Page header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>
                        <span className={styles.titleIcon}>
                            <SettingOutlined />
                        </span>
                        {t.title}
                    </h1>
                </div>
            </div>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                tabPosition="left"
                className={styles.tabs}
                size="large"
            />
        </div>
    )
}
