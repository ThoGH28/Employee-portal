import React, { useState } from 'react';
import { Avatar, Spin, Empty, Tag } from 'antd';
import { ApartmentOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { orgChartService } from '../../shared/services/orgChartService';
import type { OrgChartNode, DepartmentCount } from '../../shared/types/orgChart';
import { useAuthStore } from '../../shared/context/store';
import { isAdminOrHR } from '../../shared/utils/permissions';
import styles from './OrgChart.module.css';

const DEPARTMENT_LABELS: Record<string, string> = {
    hr: 'Nhân sự',
    it: 'Công nghệ Thông tin',
    sales: 'Kinh doanh',
    marketing: 'Marketing',
    operations: 'Vận hành',
    finance: 'Tài chính',
};

const DEPARTMENT_COLORS: Record<string, string> = {
    hr: '#f56a00',
    it: '#1890ff',
    sales: '#52c41a',
    marketing: '#722ed1',
    operations: '#fa8c16',
    finance: '#13c2c2',
};

const OrgNode: React.FC<{ node: OrgChartNode }> = ({ node }) => {
    const color = DEPARTMENT_COLORS[node.department] || '#666';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className={styles.nodeCard}>
                <Avatar
                    size={52}
                    icon={<UserOutlined />}
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 4px 14px ${color}55`,
                        fontSize: 18,
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                    }}
                >
                    {node.user.first_name?.charAt(0)}{node.user.last_name?.charAt(0)}
                </Avatar>
                <h4>{node.user.first_name} {node.user.last_name}</h4>
                <p>{node.designation}</p>
                <Tag
                    color={color}
                    style={{
                        marginTop: 2,
                        marginBottom: 4,
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        borderRadius: 99,
                        padding: '1px 10px',
                        border: 'none',
                    }}
                >
                    {DEPARTMENT_LABELS[node.department] || node.department}
                </Tag>
                <small>{node.employee_id}</small>
            </div>
            {node.children && node.children.length > 0 && (
                <>
                    <div className={styles.connector} />
                    <div className={styles.childrenContainer}>
                        {node.children.map((child) => (
                            <div key={child.id} className={styles.branchItem}>
                                <OrgNode node={child} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const OrgChart: React.FC = () => {
    const { user } = useAuthStore();
    const canViewAll = isAdminOrHR(user);
    const userDept = user?.department;

    // Non-admin/HR users are locked to their own department
    const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(
        canViewAll ? undefined : userDept
    );

    const { data: departments, isLoading: deptsLoading } = useQuery({
        queryKey: ['org-chart', 'departments'],
        queryFn: orgChartService.getDepartments,
        staleTime: 1000 * 60 * 10,
        enabled: canViewAll, // Only fetch department list for admin/HR
    });

    const effectiveDept = canViewAll ? selectedDepartment : userDept;

    const { data: orgData, isLoading: orgLoading } = useQuery({
        queryKey: ['org-chart', effectiveDept],
        queryFn: () => orgChartService.getOrgChart(effectiveDept),
        staleTime: 1000 * 60 * 5,
    });

    return (
        <div className={styles.orgChartPage}>
            <div className={styles.header}>
                <h1><ApartmentOutlined /> Sơ đồ Tổ chức</h1>
                <p>
                    {canViewAll
                        ? 'Xem cơ cấu tổ chức công ty theo phòng ban'
                        : userDept
                            ? `Sơ đồ tổ chức phòng ${DEPARTMENT_LABELS[userDept] || userDept}`
                            : 'Sơ đồ tổ chức phòng ban của bạn'
                    }
                </p>
            </div>

            {/* Department filter — only for admin/HR */}
            {canViewAll && (
                <div className={styles.departmentStats}>
                    <div
                        className={`${styles.deptBadge} ${!selectedDepartment ? styles.deptBadgeActive : ''}`}
                        onClick={() => setSelectedDepartment(undefined)}
                    >
                        Tất cả Phòng ban
                    </div>
                    {departments?.map((dept: DepartmentCount) => (
                        <div
                            key={dept.department}
                            className={`${styles.deptBadge} ${selectedDepartment === dept.department ? styles.deptBadgeActive : ''}`}
                            onClick={() => setSelectedDepartment(dept.department)}
                        >
                            {DEPARTMENT_LABELS[dept.department] || dept.department} ({dept.count})
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            <div className={styles.chartContainer}>
                {orgLoading || (canViewAll && deptsLoading) ? (
                    <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} />
                ) : orgData && orgData.length > 0 ? (
                    <div className={styles.orgTree}>
                        {orgData.map((rootNode: OrgChartNode) => (
                            <div key={rootNode.id} style={{ marginBottom: 56 }}>
                                <OrgNode node={rootNode} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty description="Không có dữ liệu tổ chức" />
                )}
            </div>
        </div>
    );
};