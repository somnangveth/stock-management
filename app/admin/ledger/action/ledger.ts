"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

/* ================= 工具函数 ================= */

// 防止 Postgres 22P02：空字符串 / 非法日期
const formatDate = (dateStr?: string | null): string | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : dateStr.trim();
};

// 安全的数值转换
const toNumber = (val: any): number => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

/* ================= 创建 Ledger ================= */

export async function createLedger(data: any) {
  const supabase = await createSupabaseAdmin();

  try {
    console.log("📝 createLedger input:", data);
    console.log("📝 data.vendor_id:", data.vendor_id, "type:", typeof data.vendor_id);

    // --- 数值安全转换 (先转换再验证) ---
    const vendor_id = Number(data.vendor_id);
    const debit = toNumber(data.debit);
    const credit = toNumber(data.credit);

    console.log("📝 After conversion - vendor_id:", vendor_id, "type:", typeof vendor_id);

    // --- 必填字段验证 ---
    if (!vendor_id || isNaN(vendor_id) || vendor_id <= 0) {
      throw new Error(`Invalid vendor_id: received "${data.vendor_id}", converted to ${vendor_id}`);
    }

    if (!data.source_type) {
      throw new Error("Source type is required");
    }

    if (debit <= 0) {
      throw new Error("Debit amount must be greater than 0");
    }

    if (credit < 0) {
      throw new Error("Credit amount cannot be negative");
    }

    if (credit > debit) {
      throw new Error("Amount Paid cannot exceed Total Amount");
    }

    // 欠款 = 应付 - 已付
    const balance = debit - credit;

    // --- 日期处理 ---
    const created_at = formatDate(data.created_at);
    const payment_duedate = formatDate(data.payment_duedate);

    if (!created_at) {
      throw new Error(`Invalid created_at date: "${data.created_at}"`);
    }

    // --- 支付状态确定 ---
    let payment_status = data.payment_status || "unpaid";
    if (credit === 0) {
      payment_status = "unpaid";
    } else if (credit < debit) {
      payment_status = "partial";
    } else if (credit >= debit) {
      payment_status = "paid";
    }

    // --- 构建插入数据 ---
    const insertData = {
      vendor_id,
      source_type: data.source_type, // "purchase" 或 "refund"
      debit,
      credit,
      balance,
      note: data.note ? data.note.trim() : null,
      payment_duedate, // 可以是 null
      payment_status,
      product_id: data.product_id || null,
      created_at, // 明确设置创建日期
    };

    console.log("Ledger insert data:", insertData);

    const { data: ledgerData, error } = await supabase
      .from("ledger")
      .insert([insertData])
      .select();

    if (error) {
      console.error("Ledger insert error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!ledgerData || ledgerData.length === 0) {
      throw new Error("Failed to create ledger entry");
    }

    console.log("Ledger created successfully:", ledgerData[0]);
    return ledgerData[0];
  } catch (error: any) {
    console.error("CreateLedger failed:", error);
    throw error;
  }
}

/* ================= 更新 Ledger ================= */

export async function updateLedger(ledger_id: string, data: any) {
  const supabase = await createSupabaseAdmin();

  try {
    console.log("Update ledger input:", { ledger_id, data });

    // --- 数值安全转换 ---
    const debit = toNumber(data.debit);
    const credit = toNumber(data.credit);

    if (debit <= 0) {
      throw new Error("Debit amount must be greater than 0");
    }

    if (credit < 0) {
      throw new Error("Credit amount cannot be negative");
    }

    if (credit > debit) {
      throw new Error("Amount Paid cannot exceed Total Amount");
    }

    // --- 重新计算 balance ---
    const balance = debit - credit;


    // --- 支付状态
    let payment_status = data.payment_status || "unpaid";
    if (credit === 0) {
      payment_status = "unpaid";
    } else if (credit < debit) {
      payment_status = "partial";
    } else if (credit >= debit) {
      payment_status = "paid";
    }

    const updateData: any = {
      vendor_id: Number(data.vendor_id),
      source_type: data.source_type,
      debit,
      credit,
      balance,
      note: data.note ? data.note.trim() : null,
      payment_duedate: formatDate(data.payment_duedate),
      payment_status,
    };

    // 移除 undefined
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    console.log("Update ledger payload:", updateData);

    const { data: ledgerData, error } = await supabase
      .from("ledger")
      .update(updateData)
      .eq("ledger_id", ledger_id)
      .select()
      .single();

    if (error) {
      console.error("Update ledger failed:", error);
      return { error: error?.message || "Failed to update ledger" };
    }

    if (!ledgerData) {
      return { error: "Ledger not found" };
    }

    console.log("Ledger updated successfully:", ledgerData);
    return { data: ledgerData };
  } catch (error: any) {
    console.error("Unexpected error in updateLedger:", error);
    return { error: error?.message || "Unexpected error" };
  }
}

/* ================= 删除 Ledger ================= */

export async function deleteLedger(ledger_id: string) {
  const supabase = await createSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from("ledger")
      .delete()
      .eq("ledger_id", ledger_id)
      .select()
      .single();

    if (error) {
      console.error("Delete ledger failed:", error);
      return { error: error.message };
    }

    return { data };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { error: error?.message || "Unexpected error" };
  }
}

/* ================= 获取所有 Ledger ================= */

export async function fetchLedger(options?: any) {
  const supabase = await createSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from("ledger")
      .select(
        `
        ledger_id,
        vendor_id,
        source_type,
        debit,
        credit,
        balance,
        note,
        created_at,
        payment_duedate,
        payment_status,
        term_status,
        vendors:vendor_id (
          vendor_name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch ledger failed:", error);
      return { error: error.message };
    }

    const formattedData = data?.map((item: any) => ({
      ledger_id: item.ledger_id,
      vendor_id: item.vendor_id,
      vendor_name: item.vendors?.vendor_name || "Unknown",
      source_type: item.source_type,
      debit: item.debit,
      credit: item.credit,
      balance: item.balance,
      note: item.note,
      created_at: item.created_at,
      payment_duedate: item.payment_duedate,
      payment_status: item.payment_status,
      term_status: item.term_status,
    }));

    return { data: formattedData };
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return { error: error?.message || "Unexpected error" };
  }
}

/* ================= 根据 Vendor ID 获取 Ledger ================= */

export async function fetchLedgerByVendor(vendor_id: number) {
  const supabase = await createSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from("ledger")
      .select(
        `
        ledger_id,
        vendor_id,
        source_type,
        debit,
        credit,
        balance,
        note,
        created_at,
        payment_duedate,
        payment_status,
        term_status,
        vendors:vendor_id (
          vendor_name
        )
      `
      )
      .eq("vendor_id", vendor_id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("❌ Fetch ledger by vendor failed:", error);
      return { error: error.message };
    }

    const formattedData = data?.map((item: any) => ({
      ledger_id: item.ledger_id,
      vendor_id: item.vendor_id,
      vendor_name: item.vendors?.vendor_name || null,
      source_type: item.source_type,
      debit: item.debit,
      credit: item.credit,
      balance: item.balance,
      note: item.note,
      created_at: item.created_at,
      payment_duedate: item.payment_duedate,
      payment_status: item.payment_status,
      term_status: item.term_status,
    }));

    return { data: formattedData };
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return { error: error?.message || "Unexpected error" };
  }
}