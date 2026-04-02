import React, { useMemo, useEffect, useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button, Space } from 'antd'
import { LogoutOutlined, UserOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined, DollarOutlined, FileTextOutlined, TeamOutlined, ApartmentOutlined, FileProtectOutlined, SolutionOutlined, DashboardOutlined, BarChartOutlined, QuestionCircleOutlined, CalendarOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../context/store'
import { getInitials } from '../utils/helpers'
import { getSidebarVisibility } from '../utils/permissions'
import { useLogout } from '../hooks/queries'
import { ChatBot } from '../../features/chatbot/ChatBot'
import styles from './Layout.module.css'

const { Header, Sider, Content } = Layout

interface AppLayoutProps {
    children: React.ReactNode
}

const allSidebarItems = [
    { key: 'dashboard', label: 'Trang chủ', icon: <DashboardOutlined />, visKey: 'dashboard' as const },
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <SolutionOutlined />, visKey: 'profile' as const },
    { key: 'payslips', label: 'Phiếu lương', icon: <DollarOutlined />, visKey: 'payslips' as const },
    { key: 'leave', label: 'Nghỉ phép', icon: <CalendarOutlined />, visKey: 'dashboard' as const },
    { key: 'requests', label: 'Yêu cầu', icon: <FileProtectOutlined />, visKey: 'requests' as const },
    { key: 'leave-approval', label: 'Duyệt Nghỉ Phép', icon: <CalendarOutlined />, visKey: 'leaveApproval' as const },
    { key: 'org-chart', label: 'Sơ đồ tổ chức', icon: <ApartmentOutlined />, visKey: 'orgChart' as const },
    { key: 'documents', label: 'Tài liệu', icon: <FileTextOutlined />, visKey: 'documents' as const },
    { key: 'reports', label: 'Báo cáo', icon: <BarChartOutlined />, visKey: 'reports' as const },
    { key: 'admin', label: 'Quản trị', icon: <TeamOutlined />, visKey: 'admin' as const },
    { key: 'help', label: 'Hướng dẫn', icon: <QuestionCircleOutlined />, visKey: 'help' as const },
]

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuthStore()
    const { mutate: logoutMutate } = useLogout()
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

    const sidebarItems = useMemo(() => {
        const visibility = getSidebarVisibility(user)
        return allSidebarItems
            .filter((item) => visibility[item.visKey])
            .map(({ visKey, ...rest }) => rest)
    }, [user])

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
            label: 'Hồ sơ',
            onClick: () => navigate('/profile'),
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
            onClick: () => navigate('/settings'),
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
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
                        : <><span className={styles.logoGradient}>Cổng</span>{' Nhân viên'}</>}
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
