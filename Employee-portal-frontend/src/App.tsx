import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, theme } from 'antd'
import { useAuthStore } from './shared/context/store'
import { useSettingsStore } from './shared/context/settingsStore'
import { isAuthenticated } from './shared/utils/storage'
import { ProtectedRoute, AdminRoute, RoleRoute } from './shared/components/ProtectedRoute'
import { LayoutShell } from './shared/components/Layout'
import { canViewReports } from './shared/utils/permissions'
import { LoginPage } from './features/auth/LoginPage'
import { Dashboard } from './features/dashboard/Dashboard'
import { LeaveRequestForm } from './features/dashboard/LeaveRequestForm'
import { LeaveApproval } from './features/leave/LeaveApproval'
import { DocumentSearch } from './features/documents/DocumentSearch'
import PayslipList from './features/payslips/PayslipList'
import { AdminPanel } from './features/admin/AdminPanel'
import { Profile } from './features/profile/Profile'
import { Settings } from './features/settings/Settings'
import { AdminRequests } from './features/requests/AdminRequests'
import { OrgChart } from './features/orgchart/OrgChart'
import { Reports } from './features/reports/Reports'
import { UserManual } from './features/help/UserManual'
import { Attendance } from './features/attendance/Attendance'
import { Performance } from './features/performance/Performance'
import { Training } from './features/training/Training'
import { Assets } from './features/assets/Assets'
import { Expenses } from './features/expenses/Expenses'
import { Workforce } from './features/workforce/Workforce'
import { Notifications } from './features/notifications/Notifications'
import { Surveys } from './features/surveys/Surveys'
import { queryClient } from './config/queryClient'
import antdTheme from './shared/styles/theme'

export const App: React.FC = () => {
    const { loadUserFromStorage } = useAuthStore()
    const { themeMode } = useSettingsStore()

    // Resolve effective dark mode (supports 'system')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = themeMode === 'dark' || (themeMode === 'system' && prefersDark)

    // Toggle data-theme attribute for CSS variable overrides
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    }, [isDark])

    // Load user from storage on app mount
    useEffect(() => {
        if (isAuthenticated()) {
            loadUserFromStorage()
        }
    }, [loadUserFromStorage])

    const computedTheme = {
        ...antdTheme,
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ConfigProvider theme={computedTheme}>
                <BrowserRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Protected routes — share a single persistent layout */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <LayoutShell />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/leave" element={<LeaveRequestForm />} />
                            <Route path="/leave-approval" element={<LeaveApproval />} />
                            <Route path="/documents" element={<DocumentSearch />} />
                            <Route path="/payslips" element={<PayslipList />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/requests" element={<AdminRequests />} />
                            <Route path="/org-chart" element={<OrgChart />} />
                            <Route
                                path="/reports"
                                element={
                                    <RoleRoute check={canViewReports}>
                                        <Reports />
                                    </RoleRoute>
                                }
                            />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/help" element={<UserManual />} />
                            <Route path="/attendance" element={<Attendance />} />
                            <Route path="/performance" element={<Performance />} />
                            <Route path="/training" element={<Training />} />
                            <Route path="/assets" element={<Assets />} />
                            <Route path="/expenses" element={<Expenses />} />
                            <Route path="/workforce" element={<Workforce />} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/surveys" element={<Surveys />} />
                            <Route
                                path="/admin"
                                element={
                                    <AdminRoute>
                                        <AdminPanel />
                                    </AdminRoute>
                                }
                            />
                        </Route>

                        {/* Fallback */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
            </ConfigProvider>
        </QueryClientProvider>
    )
}
