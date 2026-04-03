import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Modal, Spin, message } from 'antd';
import {
    DownloadOutlined,
    FileTextOutlined,
    EyeOutlined,
    DotChartOutlined,
    CheckCircleFilled,
    ClockCircleFilled,
} from '@ant-design/icons';
import styles from './Payslips.module.css';
import { payslipService } from '../../shared/services/payslipService';
import type { Payslip } from '../../shared/types/payslip';
import { useI18n } from '../../shared/context/i18n';


/* ── Helpers ────────────────────────────────────────────────────── */
const fmt = (v: number) => `₫${v.toLocaleString('vi-VN')}`;

/* ── Status Badge ────────────────────────────────────────────────── */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, { cls: string; icon: React.ReactNode }> = {
        finalized: { cls: styles.statusFinalized, icon: <CheckCircleFilled style={{ fontSize: 10 }} /> },
        draft: { cls: styles.statusDraft, icon: <ClockCircleFilled style={{ fontSize: 10 }} /> },
        distributed: { cls: styles.statusDistributed, icon: <CheckCircleFilled style={{ fontSize: 10 }} /> },
    };
    const cfg = map[status] ?? { cls: styles.statusDraft, icon: null };
    return (
        <span className={`${styles.statusBadge} ${cfg.cls}`}>
            {cfg.icon}
            {status}
        </span>
    );
};

/* ── Payslip Detail ──────────────────────────────────────────────── */
const PayslipDetails: React.FC<{ payslip: Payslip }> = ({ payslip }) => {
    const t = useI18n();
    return (
    <div className={styles.payslipDetails}>
        {/* Month + Status */}
        <div className={styles.detailHeader}>
            <h2>{payslip.month_year_display}</h2>
            <StatusBadge status={payslip.status} />
        </div>

        {/* Earnings & Deductions */}
        <div className={styles.detailsGrid}>
            {/* Earnings */}
            <div className={styles.section}>
                <p className={`${styles.sectionLabel} ${styles.earningsLabel}`}>{t.payslips.earnings}</p>
                <div className={styles.detailRow}>
                    <span>{t.payslips.basic}</span>
                    <span>{fmt(payslip.basic_salary)}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{t.payslips.hra}</span>
                    <span>{fmt(payslip.house_rent_allowance)}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{t.payslips.da}</span>
                    <span>{fmt(payslip.dearness_allowance)}</span>
                </div>
                {payslip.other_allowances > 0 && (
                    <div className={styles.detailRow}>
                        <span>{t.payslips.otherAllowances}</span>
                        <span>{fmt(payslip.other_allowances)}</span>
                    </div>
                )}
                <div className={styles.detailRowTotal}>
                    <span>{t.payslips.grossSalary}</span>
                    <span>{fmt(payslip.gross_salary)}</span>
                </div>
            </div>

            {/* Deductions */}
            <div className={styles.section}>
                <p className={`${styles.sectionLabel} ${styles.deductionsLabel}`}>{t.payslips.deductions}</p>
                <div className={styles.detailRow}>
                    <span>{t.payslips.pf}</span>
                    <span>{fmt(payslip.provident_fund)}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{t.payslips.tax}</span>
                    <span>{fmt(payslip.tax_deducted_at_source)}</span>
                </div>
                <div className={styles.detailRow}>
                    <span>{t.payslips.insurance}</span>
                    <span>{fmt(payslip.insurance)}</span>
                </div>
                {payslip.other_deductions > 0 && (
                    <div className={styles.detailRow}>
                        <span>{t.payslips.otherDeductions}</span>
                        <span>{fmt(payslip.other_deductions)}</span>
                    </div>
                )}
                <div className={styles.detailRowTotal}>
                    <span>{t.payslips.totalDeductions}</span>
                    <span>{fmt(payslip.total_deductions)}</span>
                </div>
            </div>
        </div>

        {/* Net Salary Hero */}
        <div className={styles.netSalarySection}>
            <div className={styles.netSalaryLeft}>
                <h3>{t.payslips.netSalary}</h3>
                <div className={styles.netSalaryAmount}>{fmt(payslip.net_salary)}</div>
            </div>
            <div className={styles.netSalaryRight}>
                <small>{t.payslips.afterDeductions}</small>
                <span className={styles.netSalaryTakehome}>
                    {payslip.month_year_display}
                </span>
            </div>
        </div>
    </div>
    );
};

/* ── Main Component ──────────────────────────────────────────────── */
const PayslipList: React.FC = () => {
    const t = useI18n();
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

    const { data: payslips, isLoading, error } = useQuery({
        queryKey: ['payslips'],
        queryFn: payslipService.getMyPayslips,
        staleTime: 1000 * 60 * 5,
    });

    const handleViewDetails = (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setIsDetailModalVisible(true);
    };

    const handleDownloadPDF = async (payslip: Payslip) => {
        try {
            const response = await payslipService.downloadPayslip(payslip.id);
            if (response.pdf_url) {
                const link = document.createElement('a');
                link.href = response.pdf_url;
                link.download = `Payslip_${response.month_year}.pdf`;
                link.click();
                message.success(t.payslips.downloadSuccess);
            }
        } catch {
            message.error(t.payslips.downloadFailed);
        }
    };

    /* Summary stats */
    const summary = useMemo(() => {
        if (!payslips?.length) return null;
        const distributed = payslips.filter((p) => p.status === 'distributed');
        const latest = distributed[0]?.net_salary ?? 0;
        const avg = distributed.length
            ? Math.round(distributed.reduce((s, p) => s + p.net_salary, 0) / distributed.length)
            : 0;
        return { total: payslips.length, latest, avg };
    }, [payslips]);

    /* Table columns */
    const columns = [
        {
            title: t.payslips.colMonth,
            dataIndex: 'month_year_display',
            key: 'month_year',
            width: 150,
        },
        {
            title: t.payslips.colBasic,
            dataIndex: 'basic_salary',
            key: 'basic_salary',
            render: (v: number) => fmt(v),
            width: 140,
        },
        {
            title: t.payslips.colGross,
            dataIndex: 'gross_salary',
            key: 'gross_salary',
            render: (v: number) => fmt(v),
            width: 140,
        },
        {
            title: t.payslips.colDeductions,
            dataIndex: 'total_deductions',
            key: 'total_deductions',
            render: (v: number) => (
                <span style={{ color: 'var(--brand-rose)', fontWeight: 600 }}>{fmt(v)}</span>
            ),
            width: 130,
        },
        {
            title: t.payslips.colNet,
            dataIndex: 'net_salary',
            key: 'net_salary',
            render: (v: number) => (
                <span className={styles.netSalary}>{fmt(v)}</span>
            ),
            width: 130,
        },
        {
            title: t.payslips.colStatus,
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <StatusBadge status={status} />,
            width: 115,
        },
        {
            title: t.payslips.colActions,
            key: 'actions',
            render: (_: unknown, record: Payslip) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                        onClick={() => handleViewDetails(record)}
                    >
                        <EyeOutlined style={{ fontSize: 12 }} />
                        {t.requests.btnView}
                    </button>
                    {record.pdf_file && (
                        <button
                            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                            onClick={() => handleDownloadPDF(record)}
                        >
                            <DownloadOutlined style={{ fontSize: 12 }} />
                            PDF
                        </button>
                    )}
                </div>
            ),
            width: 160,
        },
    ];

    /* Loading */
    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <Spin size="large" />
            </div>
        );
    }

    /* Error */
    if (error) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><FileTextOutlined /></div>
                <p className={styles.emptyTitle}>{t.payslips.loadFailed}</p>
                <p className={styles.emptyDesc}>{t.payslips.retryMsg}</p>
            </div>
        );
    }

    return (
        <div className={styles.payslipList}>

            {/* ── Header ──────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>
                        <span className={styles.titleIcon}>
                            <FileTextOutlined />
                        </span>
                        {t.payslips.pageTitle}
                    </h1>
                    <p>{t.payslips.pageDesc}</p>
                </div>

                {/* Summary pills */}
                {summary && (
                    <div className={styles.summaryBar}>
                        <div className={styles.summaryPill}>
                            <span>{t.payslips.summaryTotal}</span>
                            <span>{summary.total}</span>
                        </div>
                        <div className={`${styles.summaryPill} ${styles.accent}`}>
                            <span>{t.payslips.summaryLatest}</span>
                            <span>{fmt(summary.latest)}</span>
                        </div>
                        <div className={styles.summaryPill}>
                            <span>{t.payslips.summaryAvg}</span>
                            <span>{fmt(summary.avg)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Table ───────────────────────────────────── */}
            {payslips && payslips.length > 0 ? (
                <div className={styles.tableCard}>
                    <Table
                        columns={columns}
                        dataSource={payslips}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            total: payslips.length,
                            showSizeChanger: true,
                            showTotal: (total) => `${total} ${t.payslips.colMonth}`,
                            size: 'small',
                        }}
                        scroll={{ x: 980 }}
                    />
                </div>
            ) : (
                <div className={styles.tableCard}>
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><DotChartOutlined /></div>
                        <p className={styles.emptyTitle}>{t.payslips.emptyTitle}</p>
                        <p className={styles.emptyDesc}>{t.payslips.emptyDesc}</p>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ─────────────────────────────── */}
            <Modal
                title={
                    <span style={{
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 800,
                        fontSize: "17px",
                        letterSpacing: '-0.02em',
                    }}>
                        {t.payslips.detailTitle}
                    </span>
                }
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                width={740}
                styles={{
                    body: { padding: '20px 24px 24px' },
                    header: {
                        borderBottom: '1px solid var(--brand-gray-100)',
                        padding: '18px 24px',
                    },
                    footer: {
                        borderTop: '1px solid var(--brand-gray-100)',
                        padding: '14px 24px',
                    },
                }}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                            className={`${styles.modalFooterBtn} ${styles.modalFooterBtnClose}`}
                            onClick={() => setIsDetailModalVisible(false)}
                        >
                            {t.payslips.btnClose}
                        </button>
                        {selectedPayslip?.pdf_file && (
                            <button
                                className={`${styles.modalFooterBtn} ${styles.modalFooterBtnDownload}`}
                                onClick={() => selectedPayslip && handleDownloadPDF(selectedPayslip)}
                            >
                                <DownloadOutlined />
                                {t.payslips.btnDownloadPdf}
                            </button>
                        )}
                    </div>
                }
            >
                {selectedPayslip && <PayslipDetails payslip={selectedPayslip} />}
            </Modal>

        </div>
    );
};

export default PayslipList;