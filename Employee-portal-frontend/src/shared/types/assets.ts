export interface CompanyAsset {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
  asset_type_display: string;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string | null;
  purchase_price: number | null;
  condition: string;
  condition_display: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  status_display: string;
  current_assignee: { id: string; name: string } | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AssetAssignment {
  id: string;
  asset: string;
  asset_name: string;
  asset_code: string;
  employee: string;
  employee_name: string;
  assigned_by: string | null;
  assigned_by_name: string;
  assigned_date: string;
  expected_return_date: string | null;
  return_date: string | null;
  condition_on_assign: string;
  condition_on_return: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
