import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Avatar, Spin, Empty, Tooltip } from 'antd';
import {
    ApartmentOutlined,
    UserOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    ExpandOutlined,
} from '@ant-design/icons';
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

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

/* ── Single org-chart node ──────────────────────────────────────────────── */
const OrgNode: React.FC<{ node: OrgChartNode }> = ({ node }) => {
    const color = DEPARTMENT_COLORS[node.department] || '#666';
    const childCount = node.children?.length ?? 0;

    return (
        <div className={styles.nodeWrapper}>
            {/* The card */}
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
                <small>{node.employee_id}</small>
            </div>

            {/* Connectors + children */}
            {childCount > 0 && (
                <>
                    {/* Vertical line down from parent */}
                    <div className={styles.connectorDown} />

                    <div className={styles.childrenRow}>
                        {node.children!.map((child, idx) => (
                            <div key={child.id} className={styles.childBranch}>
                                {/* Vertical line up into child */}
                                <div className={styles.connectorUp} />
                                {/* Horizontal segment — spans between siblings */}
                                {childCount > 1 && (
                                    <div
                                        className={[
                                            styles.hLine,
                                            idx === 0 ? styles.hLineFirst : '',
                                            idx === childCount - 1 ? styles.hLineLast : '',
                                        ].join(' ')}
                                    />
                                )}
                                <OrgNode node={child} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

/* ── Main page component ────────────────────────────────────────────────── */
export const OrgChart: React.FC = () => {
    const { user } = useAuthStore();
    const canViewAll = isAdminOrHR(user);
    const userDept = user?.department;

    const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(
        canViewAll ? undefined : userDept
    );

    /* ── Zoom & pan state ─────────────────────────────────────────────── */
    const [scale, setScale] = useState(0.85);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const viewportRef = useRef<HTMLDivElement>(null);

    const clampScale = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        setScale((s) => clampScale(s + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        // Only pan with left button or touch
        if (e.button !== 0) return;
        isPanning.current = true;
        panStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, [translate]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isPanning.current) return;
        setTranslate({
            x: e.clientX - panStart.current.x,
            y: e.clientY - panStart.current.y,
        });
    }, []);

    const handlePointerUp = useCallback(() => {
        isPanning.current = false;
    }, []);

    const resetView = useCallback(() => {
        setScale(0.85);
        setTranslate({ x: 0, y: 0 });
    }, []);

    // Prevent default wheel scroll on the viewport so zoom works
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const prevent = (e: WheelEvent) => e.preventDefault();
        el.addEventListener('wheel', prevent, { passive: false });
        return () => el.removeEventListener('wheel', prevent);
    }, []);

    /* ── Data fetching ────────────────────────────────────────────────── */
    const { data: departments, isLoading: deptsLoading } = useQuery({
        queryKey: ['org-chart', 'departments'],
        queryFn: orgChartService.getDepartments,
        staleTime: 1000 * 60 * 10,
        enabled: canViewAll,
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

            {/* Zoom controls */}
            <div className={styles.zoomControls}>
                <Tooltip title="Thu nhỏ"><button onClick={() => setScale((s) => clampScale(s - ZOOM_STEP))}><ZoomOutOutlined /></button></Tooltip>
                <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
                <Tooltip title="Phóng to"><button onClick={() => setScale((s) => clampScale(s + ZOOM_STEP))}><ZoomInOutlined /></button></Tooltip>
                <Tooltip title="Đặt lại"><button onClick={resetView}><ExpandOutlined /></button></Tooltip>
            </div>

            {/* Chart viewport — zoom & pan */}
            <div
                ref={viewportRef}
                className={styles.chartContainer}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {orgLoading || (canViewAll && deptsLoading) ? (
                    <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }} />
                ) : orgData && orgData.length > 0 ? (
                    <div
                        className={styles.orgTree}
                        style={{
                            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                        }}
                    >
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