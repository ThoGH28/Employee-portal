import React, { useMemo, useEffect, useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button, Space } from 'antd'
import { LogoutOutlined, UserOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, DollarOutlined, FileTextOutlined, TeamOutlined, ApartmentOutlined, FileProtectOutlined, SolutionOutlined, DashboardOutlined, BarChartOutlined, QuestionCircleOutlined, CalendarOutlined, ClockCircleOutlined, TrophyOutlined, ReadOutlined, LaptopOutlined, WalletOutlined, HomeOutlined, BellOutlined, FormOutlined, AppstoreOutlined } from '@ant-design/icons'
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

const routeToGroupKey: Record<string, string> = {
    leave: 'grp-time', attendance: 'grp-time', requests: 'grp-time', 'leave-approval': 'grp-time',
    payslips: 'grp-finance', expenses: 'grp-finance',
    performance: 'grp-dev', training: 'grp-dev',
    'org-chart': 'grp-org', workforce: 'grp-org', documents: 'grp-org', assets: 'grp-org',
    notifications: 'grp-comms', surveys: 'grp-comms',
    reports: 'grp-mgmt', admin: 'grp-mgmt',
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthStore()
    const { mutate: logoutMutate } = useLogout()
    const t = useI18n()
    const [collapsed, setCollapsed] = React.useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [openKeys, setOpenKeys] = useState<string[]>(() => {
        const key = location.pathname.replace('/', '') || 'dashboard'
        const g = routeToGroupKey[key]
        return g ? [g] : []
    })

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

    useEffect(() => {
        const group = routeToGroupKey[currentKey]
        if (group) setOpenKeys(prev => prev.includes(group) ? prev : [...prev, group])
    }, [currentKey])

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
        attendance: t.layout.nav.attendance,
        performance: t.layout.nav.performance,
        training: t.layout.nav.training,
        assets: t.layout.nav.assets,
        expenses: t.layout.nav.expenses,
        workforce: t.layout.nav.workforce,
        notifications: t.layout.nav.notifications,
        surveys: t.layout.nav.surveys,
    }

    const sidebarItems = useMemo(() => {
        const v = getSidebarVisibility(user)
        const l = (key: string) => navLabels[key] ?? key

        const timeLeaveChildren = [
            { key: 'leave', icon: <CalendarOutlined />, label: l('leave') },
            v.attendance && { key: 'attendance', icon: <ClockCircleOutlined />, label: l('attendance') },
            v.requests && { key: 'requests', icon: <FileProtectOutlined />, label: l('requests') },
            v.leaveApproval && { key: 'leave-approval', icon: <CalendarOutlined />, label: l('leave-approval') },
        ].filter(Boolean)

        const financeChildren = [
            v.payslips && { key: 'payslips', icon: <DollarOutlined />, label: l('payslips') },
            v.expenses && { key: 'expenses', icon: <WalletOutlined />, label: l('expenses') },
        ].filter(Boolean)

        const devChildren = [
            v.performance && { key: 'performance', icon: <TrophyOutlined />, label: l('performance') },
            v.training && { key: 'training', icon: <ReadOutlined />, label: l('training') },
        ].filter(Boolean)

        const orgChildren = [
            v.orgChart && { key: 'org-chart', icon: <ApartmentOutlined />, label: l('org-chart') },
            v.workforce && { key: 'workforce', icon: <HomeOutlined />, label: l('workforce') },
            v.documents && { key: 'documents', icon: <FileTextOutlined />, label: l('documents') },
            v.assets && { key: 'assets', icon: <LaptopOutlined />, label: l('assets') },
        ].filter(Boolean)

        const commsChildren = [
            v.notifications && { key: 'notifications', icon: <BellOutlined />, label: l('notifications') },
            v.surveys && { key: 'surveys', icon: <FormOutlined />, label: l('surveys') },
        ].filter(Boolean)

        const mgmtChildren = [
            v.reports && { key: 'reports', icon: <BarChartOutlined />, label: l('reports') },
            v.admin && { key: 'admin', icon: <TeamOutlined />, label: l('admin') },
        ].filter(Boolean)

        return [
            { key: 'dashboard', icon: <DashboardOutlined />, label: l('dashboard') },
            v.profile && { key: 'profile', icon: <SolutionOutlined />, label: l('profile') },
            timeLeaveChildren.length > 0 && { key: 'grp-time', icon: <CalendarOutlined />, label: t.layout.nav.groupTimeLeave, children: timeLeaveChildren },
            financeChildren.length > 0 && { key: 'grp-finance', icon: <WalletOutlined />, label: t.layout.nav.groupFinance, children: financeChildren },
            devChildren.length > 0 && { key: 'grp-dev', icon: <TrophyOutlined />, label: t.layout.nav.groupDevelopment, children: devChildren },
            orgChildren.length > 0 && { key: 'grp-org', icon: <AppstoreOutlined />, label: t.layout.nav.groupOrganization, children: orgChildren },
            commsChildren.length > 0 && { key: 'grp-comms', icon: <BellOutlined />, label: t.layout.nav.groupComms, children: commsChildren },
            mgmtChildren.length > 0 && { key: 'grp-mgmt', icon: <BarChartOutlined />, label: t.layout.nav.groupAdminReports, children: mgmtChildren },
            v.help && { key: 'help', icon: <QuestionCircleOutlined />, label: l('help') },
        ].filter(Boolean)
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
                    inlineCollapsed={collapsed}
                    selectedKeys={[currentKey]}
                    openKeys={collapsed ? [] : openKeys}
                    onOpenChange={(keys) => { if (!collapsed) setOpenKeys(keys) }}
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
