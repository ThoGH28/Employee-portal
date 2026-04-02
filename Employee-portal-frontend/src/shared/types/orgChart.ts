export interface OrgChartNode {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  department: string;
  designation: string;
  employee_id: string;
  profile_image?: string;
  children: OrgChartNode[];
}

export interface DepartmentCount {
  department: string;
  count: number;
}
