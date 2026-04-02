import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { useAuthStore } from './shared/context/store'
import { isAuthenticated } from './shared/utils/storage'
import { ProtectedRoute, AdminRoute, RoleRoute } from './shared/components/ProtectedRoute'
import { LayoutShell } from './shared/components/Layout'
import { canViewReports } from './shared/utils/permissions'
import { LoginPage } from './features/auth/LoginPage'
import { Dashboard } from './features/dashboard/Dashboard'
import { LeaveRequestForm } from './features/dashboard/LeaveRequestForm'
import { DocumentSearch } from './features/documents/DocumentSearch'
import PayslipList from './features/payslips/PayslipList'
import { AdminPanel } from './features/admin/AdminPanel'
import { Profile } from './features/profile/Profile'
import { AdminRequests } from './features/requests/AdminRequests'
import { OrgChart } from './features/orgchart/OrgChart'
import { Reports } from './features/reports/Reports'
import { queryClient } from './config/queryClient'
import antdTheme from './shared/styles/theme'

export const App: React.FC = () => {
    const { loadUserFromStorage } = useAuthStore()

    // Load user from storage on app mount
    useEffect(() => {
        if (isAuthenticated()) {
            loadUserFromStorage()
        }
    }, [loadUserFromStorage])

    return (
        <QueryClientProvider client={queryClient}>
            <ConfigProvider theme={antdTheme}>
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
