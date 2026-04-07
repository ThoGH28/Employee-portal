import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Modal, Spin, message } from 'antd';
import {
    DownloadOutlined,
    FileTextOutlined,
    DotChartOutlined,
    CheckCircleFilled,
    ClockCircleFilled,
    FilePdfOutlined,
} from '@ant-design/icons';
import styles from './Payslips.module.css';
import { payslipService } from '../../shared/services/payslipService';
import type { Payslip } from '../../shared/types/payslip';
import { useI18n } from '../../shared/context/i18n';
import api from '../../shared/services/api';


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

/* ── Main Component ──────────────────────────────────────────────── */
const PayslipList: React.FC = () => {
    const t = useI18n();
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);

    // Clean up blob URL when modal is closed
    useEffect(() => {
        if (!isPdfModalVisible && pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null);
        }
    }, [isPdfModalVisible]);

    const { data: payslips, isLoading, error } = useQuery({
        queryKey: ['payslips'],
        queryFn: payslipService.getMyPayslips,
        staleTime: 1000 * 60 * 5,
    });

    const handleViewPDF = async (payslip: Payslip) => {
        setSelectedPayslip(payslip);
        setIsPdfModalVisible(true);
        setPdfLoading(true);
        try {
            const path = payslipService.getGeneratePdfPath(payslip.id);
            const response = await api.get(path, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            setPdfBlobUrl(URL.createObjectURL(blob));
        } catch {
            message.error('Không thể tải phiếu lương PDF.');
            setIsPdfModalVisible(false);
        } finally {
            setPdfLoading(false);
        }
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
                        onClick={() => handleViewPDF(record)}
                    >
                        <FilePdfOutlined style={{ fontSize: 12 }} />
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

            {/* ── PDF Viewer Modal ─────────────────────────── */}
            <Modal
                title={
                    <span style={{
                        fontFamily: 'Manrope, sans-serif',
                        fontWeight: 800,
                        fontSize: '17px',
                        letterSpacing: '-0.02em',
                    }}>
                        <FilePdfOutlined style={{ marginRight: 8, color: '#e74c3c' }} />
                        Phiếu lương — {selectedPayslip?.month_year_display}
                    </span>
                }
                open={isPdfModalVisible}
                onCancel={() => setIsPdfModalVisible(false)}
                width="90vw"
                style={{ maxWidth: 960, top: 20 }}
                styles={{ body: { padding: 0, height: '80vh' } }}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                            className={`${styles.modalFooterBtn} ${styles.modalFooterBtnClose}`}
                            onClick={() => setIsPdfModalVisible(false)}
                        >
                            {t.payslips.btnClose}
                        </button>
                        {pdfBlobUrl && (
                            <a
                                href={pdfBlobUrl}
                                download={`Phieu_luong_${selectedPayslip?.month_year_display?.replace('/', '_')}.pdf`}
                                className={`${styles.modalFooterBtn} ${styles.modalFooterBtnDownload}`}
                            >
                                <DownloadOutlined style={{ marginRight: 4 }} />
                                Tải xuống
                            </a>
                        )}
                    </div>
                }
                destroyOnClose
            >
                {pdfLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Spin size="large" tip="Đang tải phiếu lương..." />
                    </div>
                )}
                {pdfBlobUrl && !pdfLoading && (
                    <iframe
                        src={pdfBlobUrl}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Phiếu lương PDF"
                    />
                )}
            </Modal>

        </div>
    );
};

export default PayslipList;