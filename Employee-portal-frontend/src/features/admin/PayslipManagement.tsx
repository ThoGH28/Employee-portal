import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Form,
  Button,
  Select,
  Upload,
  Table,
  Modal,
  message,
  Space,
  DatePicker,
  InputNumber,
  UploadFile,
} from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './PayslipManagement.module.css';
import { payslipService } from '../../shared/services/payslipService';
import { employeeService } from '../../shared/services/employeeService';
import type { Payslip } from '../../shared/types/payslip';
import type { Employee } from '../../shared/types';

const PayslipManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const { data: payslips = [], isLoading: payslipsLoading, refetch: refetchPayslips } = useQuery({
    queryKey: ['allPayslips'],
    queryFn: payslipService.getPayslips,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employeeList'],
    queryFn: () => employeeService.listEmployees(1, 1000).then((r) => r.data),
  });
  const employees: Employee[] = employeesData?.results ?? [];

  const createMutation = useMutation({
    mutationFn: (data: any) => payslipService.createPayslip(data),
    onSuccess: () => {
      message.success('Tạo phiếu lương thành công');
      refetchPayslips();
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      if (data?.non_field_errors) {
        message.error('Nhân viên này đã có phiếu lương trong tháng được chọn.');
      } else {
        message.error('Tạo phiếu lương thất bại');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      payslipService.updatePayslip(editingPayslip!.id, data),
    onSuccess: () => {
      message.success('Cập nhật phiếu lương thành công');
      refetchPayslips();
      setIsModalVisible(false);
      form.resetFields();
      setEditingPayslip(null);
      setFileList([]);
    },
    onError: () => {
      message.error('Cập nhật phiếu lương thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => payslipService.deletePayslip(id),
    onSuccess: () => {
      message.success('Xóa phiếu lương thành công');
      refetchPayslips();
    },
    onError: () => {
      message.error('Xóa phiếu lương thất bại');
    },
  });

  const handleAddNew = () => {
    setEditingPayslip(null);
    form.resetFields();
    setFileList([]);
    setIsModalVisible(true);
  };

  const handleEdit = (payslip: Payslip) => {
    setEditingPayslip(payslip);
    form.setFieldsValue({
      employee: payslip.employee,
      month_year: dayjs(payslip.month_year),
      basic_salary: payslip.basic_salary,
      house_rent_allowance: payslip.house_rent_allowance,
      dearness_allowance: payslip.dearness_allowance,
      other_allowances: payslip.other_allowances,
      provident_fund: payslip.provident_fund,
      tax_deducted_at_source: payslip.tax_deducted_at_source,
      insurance: payslip.insurance,
      other_deductions: payslip.other_deductions,
      status: payslip.status,
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xóa Phiếu lương',
      content: 'Bạn có chắc chắn muốn xóa phiếu lương này?',
      okText: 'Xóa',
      okType: 'danger',
      onOk: () => {
        deleteMutation.mutate(id);
      },
    });
  };

  const handleSubmit = async (values: any) => {
    const payload = {
      ...values,
      month_year: values.month_year.format('YYYY-MM-01'),
      pdf_file: fileList.length > 0 ? fileList[0].originFileObj : undefined,
    };

    if (editingPayslip) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'employee_name',
      key: 'employee_name',
    },
    {
      title: 'Tháng',
      dataIndex: 'month_year_display',
      key: 'month_year_display',
    },
    {
      title: 'Lương cơ bản',
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      render: (value: number) => `₫${value.toLocaleString('vi-VN')}`,
    },
    {
      title: 'Lương thực nhận',
      dataIndex: 'net_salary',
      key: 'net_salary',
      render: (value: number) => `₫${value.toLocaleString('vi-VN')}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, record: Payslip) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.payslipManagement}>
      <div className={styles.header}>
        <h1>Quản lý Phiếu lương</h1>
        <Button type="primary" onClick={handleAddNew} size="large">
          + Tạo Phiếu lương
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={payslips}
        rowKey="id"
        loading={payslipsLoading}
        pagination={{
          pageSize: 10,
          total: payslips?.length || 0,
          showSizeChanger: true,
        }}
      />

      <Modal
        title={editingPayslip ? 'Sửa Phiếu lương' : 'Tạo Phiếu lương Mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingPayslip(null);
        }}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="employee"
            label="Nhân viên"
            rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
          >
            <Select
              showSearch
              placeholder="Chọn nhân viên"
              optionFilterProp="label"
              options={employees.map((emp) => ({
                value: emp.id,
                label: `${emp.user?.first_name ?? ''} ${emp.user?.last_name ?? ''} (${emp.employee_id})`.trim(),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="month_year"
            label="Tháng & Năm"
            rules={[{ required: true, message: 'Vui lòng chọn tháng và năm' }]}
          >
            <DatePicker picker="month" />
          </Form.Item>

          <div className={styles.formGrid}>
            <Form.Item
              name="basic_salary"
              label="Lương cơ bản"
              rules={[{ required: true }]}
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
            <Form.Item
              name="house_rent_allowance"
              label="Phụ cấp nhà ở"
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
          </div>

          <div className={styles.formGrid}>
            <Form.Item
              name="dearness_allowance"
              label="Phụ cấp đắt đỏ"
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
            <Form.Item
              name="other_allowances"
              label="Phụ cấp khác"
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
          </div>

          <div className={styles.formGrid}>
            <Form.Item
              name="provident_fund"
              label="Quỹ dự phòng"
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
            <Form.Item
              name="tax_deducted_at_source"
              label="Thuế TNCN"
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
          </div>

          <div className={styles.formGrid}>
            <Form.Item
              name="insurance"
              label="Bảo hiểm"
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
            <Form.Item
              name="other_deductions"
              label="Khấu trừ khác"
            >
              <InputNumber prefix="₫" min={0} step={100} />
            </Form.Item>
          </div>

          <Form.Item
            name="pdf_file"
            label="Tải lên PDF (Tùy chọn)"
          >
            <Upload
              maxCount={1}
              accept=".pdf"
              fileList={fileList}
              onChange={(info) => setFileList(info.fileList)}
            >
              <Button icon={<UploadOutlined />}>Chọn tập tin</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: 'Nháp', value: 'draft' },
                { label: 'Đã hoàn tất', value: 'finalized' },
                { label: 'Đã phát', value: 'distributed' },
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingPayslip ? 'Cập nhật' : 'Tạo'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PayslipManagement;
