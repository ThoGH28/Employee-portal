import React, { useMemo, useEffect, useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button, Space } from 'antd'
import { LogoutOutlined, UserOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, DollarOutlined, FileTextOutlined, TeamOutlined, ApartmentOutlined, FileProtectOutlined, SolutionOutlined, DashboardOutlined, BarChartOutlined, QuestionCircleOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../context/store'
import { useI18n } from '../context/i18n'
import { getInitials } from '../utils/helpers'
import { getSidebarVisibility } from '../utils/permissions'
import { useLogout } from '../hooks/queries'
import { ChatBot } from '../../features/chatbot/ChatBot'
import styles from './Layout.module.css'

const { Header, Sider, Content } = Layout

interface AppLayoutProps {
    children: React.ReactNode
}

const sidebarKeys = [
    { key: 'dashboard', icon: <DashboardOutlined />, visKey: 'dashboard' as const },
    { key: 'profile', icon: <SolutionOutlined />, visKey: 'profile' as const },
    { key: 'payslips', icon: <DollarOutlined />, visKey: 'payslips' as const },
    { key: 'leave', icon: <CalendarOutlined />, visKey: 'dashboard' as const },
    { key: 'requests', icon: <FileProtectOutlined />, visKey: 'requests' as const },
    { key: 'leave-approval', icon: <CalendarOutlined />, visKey: 'leaveApproval' as const },
    { key: 'org-chart', icon: <ApartmentOutlined />, visKey: 'orgChart' as const },
    { key: 'documents', icon: <FileTextOutlined />, visKey: 'documents' as const },
    { key: 'reports', icon: <BarChartOutlined />, visKey: 'reports' as const },
    { key: 'admin', icon: <TeamOutlined />, visKey: 'admin' as const },
    { key: 'help', icon: <QuestionCircleOutlined />, visKey: 'help' as const },
] as const

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthStore()
    const { mutate: logoutMutate } = useLogout()
    const t = useI18n()
    const [collapsed, setCollapsed] = React.useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)')
        const handler = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches)
            if (e.matches) setCollapsed(true)
        }
        setIsMobile(mq.matches)
        if (mq.matches) setCollapsed(true)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    const currentKey = location.pathname.replace('/', '') || 'dashboard'

    const navLabels: Record<string, string> = {
        dashboard: t.layout.nav.dashboard,
        profile: t.layout.nav.profile,
        payslips: t.layout.nav.payslips,
        leave: t.layout.nav.leave,
        requests: t.layout.nav.requests,
        'leave-approval': t.layout.nav.leaveApproval,
        'org-chart': t.layout.nav.orgChart,
        documents: t.layout.nav.documents,
        reports: t.layout.nav.reports,
        admin: t.layout.nav.admin,
        help: t.layout.nav.help,
    }

    const sidebarItems = useMemo(() => {
        const visibility = getSidebarVisibility(user)
        return sidebarKeys
            .filter((item) => visibility[item.visKey])
            .map(({ visKey: _v, key, icon }) => ({ key, icon, label: navLabels[key] ?? key }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, t])

    const handleLogout = () => {
        logoutMutate(undefined, {
            onSettled: () => {
                navigate('/login', { replace: true })
            },
        })
    }

    const handleMenuClick = ({ key }: { key: string }) => {
        navigate(`/${key}`)
        if (isMobile) setCollapsed(true)
    }

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: t.layout.userMenu.profile,
            onClick: () => navigate('/profile'),
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: t.layout.userMenu.settings,
            onClick: () => navigate('/settings'),
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t.layout.userMenu.logout,
            onClick: handleLogout,
        },
    ]

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
            {isMobile && !collapsed && (
                <div className={styles.overlay} onClick={() => setCollapsed(true)} />
            )}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                theme="dark"
                width={240}
                breakpoint="lg"
                collapsedWidth={isMobile ? 0 : 80}
                onBreakpoint={(broken) => {
                    if (broken) setCollapsed(true)
                }}
                className={`${styles.sider} ${isMobile ? styles.siderMobile : ''}`}
                style={{
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
                    borderRight: 'none',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
                    ...(!isMobile ? { position: 'sticky', top: 0, height: '100vh', overflow: 'auto' } : {}),
                }}
            >
                <div className={`${styles.logo} ${collapsed ? styles.logoCollapsed : ''}`}>
                    {collapsed
                        ? <span className={styles.logoIcon}>⚡</span>
                        : <><span className={styles.logoGradient}>{t.layout.logoPrefix}</span>{' '}{t.layout.logoName}</>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[currentKey]}
                    items={sidebarItems}
                    onClick={handleMenuClick}
                    className={styles.sideMenu}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px',
                    }}
                />
            </Sider>

            <Layout style={{ minHeight: '100vh' }}>
                <Header className={styles.header}>
                    <Space>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: '16px', width: 40, height: 40, borderRadius: 8 }}
                        />
                    </Space>

                    <div className={styles.headerRight}>
                        <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
                            <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 12, transition: 'background 0.2s' }}>
                                <Avatar
                                    size={36}
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: 'var(--brand-black)', fontSize: 14 }}
                                >
                                    {user && getInitials(user.first_name, user.last_name)}
                                </Avatar>
                                <span style={{ fontWeight: 500, fontSize: 14 }}>{user?.first_name} {user?.last_name}</span>
                            </Space>
                        </Dropdown>
                    </div>
                </Header>

                <Content className={styles.content}>
                    {children}
                </Content>
            </Layout>

            <ChatBot />
        </Layout>
    )
}

/**
 * Persistent layout shell for nested routes.
 * Renders <Outlet /> so the layout never remounts on route change.
 */
export const LayoutShell: React.FC = () => {
    return (
        <AppLayout>
            <div className={styles.outlet}>
                <Outlet />
            </div>
        </AppLayout>
    )
}
