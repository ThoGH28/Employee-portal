import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../context/store'
import { isAuthenticated } from '../utils/storage'
import type { User } from '../types'

interface Props {
    children: React.ReactNode
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const { user } = useAuthStore()

    if (!isAuthenticated() && !user) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

interface AdminRouteProps {
    children: React.ReactNode
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user } = useAuthStore()

    if (!isAuthenticated() || !user || user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}

interface RoleRouteProps {
    children: React.ReactNode
    /** A function that receives the user and returns true if access is allowed */
    check: (user: User) => boolean
    /** Where to redirect if check fails (defaults to /dashboard) */
    redirectTo?: string
}

/**
 * Generic role-based route guard. Usage:
 *   <RoleRoute check={(u) => canViewReports(u)}>...</RoleRoute>
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({
    children,
    check,
    redirectTo = '/dashboard',
}) => {
    const { user } = useAuthStore()

    if (!isAuthenticated() || !user || !check(user)) {
        return <Navigate to={redirectTo} replace />
    }

    return <>{children}</>
}
