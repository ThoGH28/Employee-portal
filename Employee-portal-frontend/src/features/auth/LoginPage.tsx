import React from 'react'
import { Form, Input, Button, message } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLogin } from '../../shared/hooks/queries'
import { useAuthStore } from '../../shared/context/store'
import { useI18n } from '../../shared/context/i18n'
import { apiClient } from '../../shared/services/api'
import { setTokenToStorage, setRefreshTokenToStorage, isAuthenticated } from '../../shared/utils/storage'
import styles from './LoginPage.module.css'

export const LoginPage: React.FC = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const location = useLocation()
    const { setUser } = useAuthStore()
    const { mutate: login, isPending } = useLogin()
    const t = useI18n()

    // Redirect to dashboard if already authenticated
    React.useEffect(() => {
        if (isAuthenticated()) {
            navigate('/dashboard', { replace: true })
        }
    }, [navigate])

    const onFinish = (values: { username: string; password: string }) => {
        login(values, {
            onSuccess: (response) => {
                setTokenToStorage(response.data.access)
                setRefreshTokenToStorage(response.data.refresh)
                apiClient.setToken(response.data.access)
                setUser(response.data.user)
                message.success(t.login.loginSuccess)

                const from = location.state?.from?.pathname || '/dashboard'
                navigate(from)
            },
            onError: (error: any) => {
                const errorMessage = error.response?.data?.message || t.login.loginError
                message.error(errorMessage)
            },
        })
    }

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginWrapper}>
                {/* Logo Section */}
                <div className={styles.logoSection}>
                    <div className={styles.logoBox}>
                        <div className={styles.logoRotate} />
                    </div>
                    <div className={styles.brandText}>
                        <h1>LUMINA</h1>
                        <p>Enterprise Portal</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className={styles.loginCard}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.title}>{t.login.title}</h2>
                        <p className={styles.subtitle}>{t.login.subtitle}</p>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        size="large"
                        className={styles.formGroup}
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: t.login.usernameRequired },
                            ]}
                            className={styles.formField}
                            label={<span className={styles.fieldLabel}>{t.login.usernameLabel}</span>}
                        >
                            <Input
                                placeholder={t.login.usernamePlaceholder}
                                prefix={
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                }
                                style={{ borderRadius: 16, padding: '16px 16px 16px 48px' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: t.login.passwordRequired }]}
                            className={styles.formField}
                            label={
                                <div className={styles.passwordHeader}>
                                    <span className={styles.fieldLabel}>{t.login.passwordLabel}</span>
                                    <button type="button" className={styles.forgotButton}>{t.login.forgotPassword}</button>
                                </div>
                            }
                        >
                            <Input.Password
                                placeholder="••••••••"
                                prefix={
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                }
                                style={{ borderRadius: 16, padding: '16px 16px 16px 48px' }}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                htmlType="submit"
                                loading={isPending}
                                className={styles.submitButton}
                            >
                                {t.login.loginBtn}
                            </Button>
                        </Form.Item>
                    </Form>

                    <div className={styles.footer}>
                        <svg className={styles.footerIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                        </svg>
                        <span>Được bảo vệ bởi SSO Doanh nghiệp</span>
                    </div>
                </div>

                {/* Copyright */}
                <p className={styles.copyright}>© 2026 Lumina Enterprise. Tất cả quyền được bảo lưu.</p>
            </div>
        </div>
    )
}
