// app/admin/ledger/action/ledger.ts

"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

export type LedgerItem = {
  ledger_id: string;
  vendor_id: number | null;
  vendor_name?: string;
  source_type: "purchase" | "refund" | null;
  debit: number;
  credit: number;
  balance: number | null;
  note: string | null;
  created_at: string | null;
  created_by: string | null;
  payment_duedate: string | null;
  payment_status: "paid" | "unpaid" | "pending" | null;
  term_status: "low" | "medium" | "high" | null;
};

export interface FetchLedgerOptions {
  vendorId?: number;
  startDate?: string;
  endDate?: string;
  sourceType?: "purchase" | "refund";
  paymentStatus?: "paid" | "unpaid" | "pending";
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "balance" | "payment_duedate";
  sortOrder?: "asc" | "desc";
}

/**
 * 获取所有 Ledger 数据（支持多种过滤条件）
 */
export async function fetchLedger(
  options: FetchLedgerOptions = {}
): Promise<LedgerItem[]> {
  try {
    const supabase = await createSupabaseAdmin();
    const {
      vendorId,
      startDate,
      endDate,
      sourceType,
      paymentStatus,
      limit = 100,
      offset = 0,
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    let query = supabase.from("ledger").select(
      `
        ledger_id,
        vendor_id,
        source_type,
        debit,
        credit,
        balance,
        note,
        created_at,
        created_by,
        payment_duedate,
        payment_status,
        term_status,
        vendors!inner (
          vendor_name
        )
      `,
      { count: "exact" }
    );

    // 应用过滤条件
    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }

    // 应用排序和分页
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch ledger:", error);
      return [];
    }

    const rows = (data as any[]) || [];
    const ledgerList: LedgerItem[] = rows.map((item) => ({
      ledger_id: item.ledger_id,
      vendor_id: item.vendor_id,
      vendor_name: item.vendors?.vendor_name || "",
      source_type: item.source_type,
      debit: Number(item.debit) || 0,
      credit: Number(item.credit) || 0,
      balance: item.balance ? Number(item.balance) : null,
      note: item.note,
      created_at: item.created_at,
      created_by: item.created_by,
      payment_duedate: item.payment_duedate,
      payment_status: item.payment_status,
      term_status: item.term_status,
    }));

    console.log(`Fetched ${ledgerList.length} ledger records (total: ${count})`);
    return ledgerList;
  } catch (err: any) {
    console.error("Unexpected error in fetchLedger:", err);
    return [];
  }
}

/**
 * 根据供应商 ID 获取 Ledger 数据
 */
export async function getLedgerByVendor(
  vendor_id: number
): Promise<LedgerItem[]> {
  return fetchLedger({ 
    vendorId: vendor_id, 
    limit: 1000 
  });
}

/**
 * 获取待支付的账单（未支付且有截止日期）
 */
export async function getUnpaidLedgers(
  vendorId?: number
): Promise<LedgerItem[]> {
  return fetchLedger({
    vendorId,
    paymentStatus: "unpaid",
    limit: 1000,
    sortBy: "payment_duedate",
    sortOrder: "asc",
  });
}

/**
 * 获取逾期账单
 */
export async function getOverdueLedgers(
  vendorId?: number
): Promise<LedgerItem[]> {
  try {
    const supabase = await createSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];


    let query = supabase.from("ledger").select(
      `
        ledger_id,
        vendor_id,
        vendor_name:vendors(vendor_name),
        source_type,
        debit,
        credit,
        balance,
        note,
        created_at,
        payment_duedate,
        payment_status,
        term_status
      `
    );

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    // 获取逾期账单：截止日期已过且未支付
    query = query
      .lt("payment_duedate", today)
      .eq("payment_status", "unpaid")
      .order("payment_duedate", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch overdue ledgers:", error);
      return [];
    }

    const rows = (data as any[]) || [];
    return rows.map((item) => ({
      ledger_id: item.ledger_id,
      vendor_id: item.vendor_id,
      vendor_name: item.vendor_name?.vendor_name || "",
      source_type: item.source_type,
      debit: Number(item.debit) || 0,
      credit: Number(item.credit) || 0,
      balance: item.balance ? Number(item.balance) : null,
      note: item.note,
      created_at: item.created_at,
      created_by: null,
      payment_duedate: item.payment_duedate,
      payment_status: item.payment_status,
      term_status: item.term_status,
    }));
  } catch (err: any) {
    console.error("Unexpected error in getOverdueLedgers:", err);
    return [];
  }
}

/**
 * 获取 Ledger 统计信息
 */
export async function getLedgerStats(vendorId?: number) {
  try {
    const supabase = await createSupabaseAdmin();

    let query = supabase
      .from("ledger")
      .select("debit, credit, balance, payment_status");

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch ledger stats:", error);
      return null;
    }

    const rows = (data as any[]) || [];

    const stats = {
      totalBalance: rows.reduce(
        (sum, item) => sum + (item.balance ? Number(item.balance) : 0),
        0
      ),
      totalCredit: rows.reduce(
        (sum, item) => sum + (item.credit ? Number(item.credit) : 0),
        0
      ),
      totalDebit: rows.reduce(
        (sum, item) => sum + (item.debit ? Number(item.debit) : 0),
        0
      ),
      paidCount: rows.filter((item) => item.payment_status === "paid").length,
      unpaidCount: rows.filter((item) => item.payment_status === "unpaid").length,
      pendingCount: rows.filter((item) => item.payment_status === "pending").length,
      recordCount: rows.length,
    };

    return stats;
  } catch (err: any) {
    console.error("Unexpected error in getLedgerStats:", err);
    return null;
  }
}