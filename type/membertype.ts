export type Member = {
  member_id: string;
  auth_id: string;
  admin_id: string;
  staff_id: string;
  contact_id: string;


  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
  profile_image: string;
  gender: 'Male' | 'Female';
  nationality: string;
  date_of_birth: Date;
  martial_status: string;
  primary_email_address: string;
  personal_email_address: string;
  primary_phone_number: string;
}

export type Admin = {
  auth_id: string;
  admin_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
  gender: 'Male' | 'Female';
  profile_image: string;
  date_of_birth: Date;
  phone_number1: string;
  phone_number2: string;
  nationality: string;
  martial_status: string;
  primary_email_address: string;
  personal_email_address: string;
  primary_phone_number: string;
  contact: Contact;
}

export type Staff = {
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: string;
  gender: 'Male' | 'Female';
  profile_image: string;
  date_of_birth: Date;
  phone_number1: string;
  phone_number2: string;
  martial_status: string;
  primary_email_address: string;
  personal_email_address: string;
  primary_phone_number: string;
  contact: Contact;
  nationality: string;
}

export type Contact = {
  contact_id: string;
  primary_email_address: string;
  personal_email_address: string;
  primary_phone_number: string;
}

export type Permission = {
  permission_id: string;
  permission_name: string;
  code: string;
  module: string;
  description: string;
}

export type StaffWithPermissions = Staff & {
  permissions: Permission[];
};


export type Dealer = {
  dealer_id: string;
  business_name: string;
  dealer_name: string;
  nationalid: string;
  passportnumber: string;
  contact_number: string;
  email_address: string;
  shop_address: string;
  delivery_address: string;
  businesstype: "retail" | "wholesale" | "mixed" | "online";
  payment_duedate: string;
  profile_image: string;
}

// 付款状态类型
export type PaymentType = "paid" | "unpaid" | "partial";

// 账期状态类型
export type TermStatus = "low" | "medium" | "high" | "overdue";

// 来源类型
export type SourceType = "purchase" | "refund";

export interface Ledger {
  id: null |undefined;
  ledger_id: string; // UUID
  vendor_id: number;
  vendor_name: string; // 如果需要从 vendors 表 JOIN 获取
  source_type: SourceType;
  source_id: string; // 如果需要关联采购单或退货单ID
  debit: number; // numeric(12, 2)
  credit: number; // numeric(12, 2)
  balance: number; // numeric(12, 2)
  note: string;
  created_at: string; // timestamp with time zone
  created_by: string; // UUID
  payment_duedate: string; // date
  payment_status: PaymentType;
  term_status: TermStatus;
}

// 创建台账记录的输入类型（排除自动生成的字段）
export interface CreateLedgerInput {
  vendor_id: number;
  source_type: SourceType;
  source_id?: string;
  debit: number;
  credit: number;
  note: string;
  created_at: string; // 创建日期（可选，格式：YYYY-MM-DD）
  payment_duedate: string; // 付款到期日（格式：YYYY-MM-DD）
  payment_status: PaymentType;
}

// 更新台账记录的输入类型
export interface UpdateLedgerInput {
  vendor_id: number;
  source_type: SourceType;
  debit: number;
  credit: number;
  note: string;
  created_at: string; // 新增
  payment_duedate: string;
  payment_status: PaymentType;
}

export interface EnhancedLedger extends Ledger {
  key: string; // React 列表 key
}