// app/admin/ledger/action/ledger.ts
"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

/* ================= 工具函数 ================= */

const formatDate = (dateStr?: string | null): string | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : dateStr.trim();
};

const toNumber = (val: any): number => {
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

/* ================= 创建 Ledger 和 Ledger Items ================= */

export async function createLedger(data: any) {
  const supabase = await createSupabaseAdmin();

  try {
    console.log("📝 createLedger input:", data);

    const vendor_id = Number(data.vendor_id);
    const debit = toNumber(data.debit);
    const credit = toNumber(data.credit);

    // --- 验证必填字段 ---
    if (!vendor_id || isNaN(vendor_id) || vendor_id <= 0) {
      throw new Error(`Invalid vendor_id: ${data.vendor_id}`);
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

    const balance = debit - credit;
    const created_at = formatDate(data.created_at);
    const payment_duedate = formatDate(data.payment_duedate);

    if (!created_at) {
      throw new Error(`Invalid created_at date: "${data.created_at}"`);
    }

    // --- 支付状态 ---
    let payment_status: "pending" | "paid" | "partial" | "refunded" = "pending";
    
    if (data.payment_status && ["pending", "paid", "partial", "refunded"].includes(data.payment_status)) {
      payment_status = data.payment_status;
    } else {
      if (credit === 0) {
        payment_status = "pending";
      } else if (credit < debit) {
        payment_status = "partial";
      } else if (credit >= debit) {
        payment_status = "paid";
      }
    }

    // --- 1. 先创建 Ledger ----
    const insertData = {
      vendor_id,
      source_type: data.source_type,
      debit,
      credit,
      balance,
      note: data.note ? data.note.trim() : null,
      payment_duedate,
      payment_status,
      product_id: data.product_id || null,
      created_at,
    };

    console.log("📝 Ledger insert data:", insertData);

    const { data: ledgerData, error: ledgerError } = await supabase
      .from("ledger")
      .insert([insertData])
      .select()
      .single();

    if (ledgerError) {
      console.error("❌ Ledger insert error:", ledgerError);
      throw new Error(`Database error: ${ledgerError.message}`);
    }

    if (!ledgerData) {
      throw new Error("Failed to create ledger entry");
    }

    const ledger_id = ledgerData.ledger_id;
    console.log("✅ Ledger created:", ledger_id);

    // --- 2. 然后创建 Ledger Items ----
    if (data.items && data.items.length > 0) {
      const ledgerItems = data.items.map((item: any) => ({
        ledger_id,
        product_id: item.product_id || null,
        attribute_id: item.attribute_id || null,
        attribute_value: item.attribute_value || null,
        quantity: toNumber(item.quantity),
        unit_price: toNumber(item.unit_price),
        subtotal: toNumber(item.quantity) * toNumber(item.unit_price),
      }));

      console.log("📝 Ledger items to insert:", ledgerItems);

      const { data: itemsData, error: itemsError } = await supabase
        .from("ledger_items")
        .insert(ledgerItems)
        .select();

      if (itemsError) {
        console.error("❌ Ledger items insert error:", itemsError);
        // 注意：这里不抛错，因为 ledger 已经创建了
        // 但要通知用户 items 创建失败
        console.warn("⚠️ Failed to create some ledger items, but ledger was created");
      } else {
        console.log("✅ Ledger items created:", itemsData?.length || 0);
      }
    }

    return ledgerData;
  } catch (error: any) {
    console.error("❌ CreateLedger failed:", error);
    throw error;
  }
}

/* ================= 更新 Ledger ================= */

export async function updateLedger(ledger_id: string, data: any) {
  const supabase = await createSupabaseAdmin();

  try {
    console.log("📝 Update ledger input:", { ledger_id, data });

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

    const balance = debit - credit;

    let payment_status: "pending" | "paid" | "partial" | "refunded" = "pending";
    
    if (data.payment_status && ["pending", "paid", "partial", "refunded"].includes(data.payment_status)) {
      payment_status = data.payment_status;
    } else {
      if (credit === 0) {
        payment_status = "pending";
      } else if (credit < debit) {
        payment_status = "partial";
      } else if (credit >= debit) {
        payment_status = "paid";
      }
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

    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    console.log("📝 Update ledger payload:", updateData);

    const { data: ledgerData, error } = await supabase
      .from("ledger")
      .update(updateData)
      .eq("ledger_id", ledger_id)
      .select()
      .single();

    if (error) {
      console.error("❌ Update ledger failed:", error);
      return { error: error?.message || "Failed to update ledger" };
    }

    if (!ledgerData) {
      return { error: "Ledger not found" };
    }

    console.log("✅ Ledger updated successfully:", ledgerData);
    return { data: ledgerData };
  } catch (error: any) {
    console.error("❌ Unexpected error in updateLedger:", error);
    return { error: error?.message || "Unexpected error" };
  }
}

/* ================= 删除 Ledger (包括 Items) ================= */

export async function deleteLedger(ledger_id: string) {
  const supabase = await createSupabaseAdmin();

  try {
    console.log("📝 Delete ledger:", ledger_id);

    // 级联删除会自动删除 ledger_items（因为有 ON DELETE CASCADE）
    const { data, error } = await supabase
      .from("ledger")
      .delete()
      .eq("ledger_id", ledger_id)
      .select()
      .single();

    if (error) {
      console.error("❌ Delete ledger failed:", error);
      return { error: error.message };
    }

    console.log("✅ Ledger and items deleted successfully");
    return { data };
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return { error: error?.message || "Unexpected error" };
  }
}

/* ================= 获取所有 Ledger (包括 Items) ================= */

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
        ),
        ledger_items (
          ledger_item_id,
          product_id,
          attribute_id,
          attribute_value,
          quantity,
          unit_price,
          subtotal
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Fetch ledger failed:", error);
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
      items: item.ledger_items || [],
    }));

    console.log("✅ Fetched ledger entries:", formattedData?.length || 0);
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
    console.log("📝 Fetch ledger by vendor:", vendor_id);

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
        ),
        ledger_items (
          ledger_item_id,
          product_id,
          attribute_id,
          attribute_value,
          quantity,
          unit_price,
          subtotal,
          products:product_id (
            product_id,
            product_name,
            sku_code
          )
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
      items: (item.ledger_items || []).map((li: any) => ({
        ledger_item_id: li.ledger_item_id,
        product_id: li.product_id,
        product_name: li.products?.product_name || "Unknown Product",
        sku_code: li.products?.sku_code || "-",
        attribute_id: li.attribute_id,
        attribute_value: li.attribute_value,
        quantity: li.quantity,
        unit_price: li.unit_price,
        subtotal: li.subtotal,
      })),
    }));

    console.log("✅ Fetched ledger entries for vendor:", formattedData?.length || 0);
    return { data: formattedData };
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return { error: error?.message || "Unexpected error" };
  }
}

/* ================= 更新支付状态 ================= */

export async function updatePaymentStatus(ledger_ids: string[], payment_status: "pending" | "paid" | "partial" | "refunded") {
  const supabase = await createSupabaseAdmin();

  try {
    if (!["pending", "paid", "partial", "refunded"].includes(payment_status)) {
      throw new Error(`Invalid payment status: ${payment_status}`);
    }

    if (!ledger_ids || ledger_ids.length === 0) {
      throw new Error("No ledger IDs provided");
    }

    const { data, error } = await supabase
      .from("ledger")
      .update({ payment_status })
      .in("ledger_id", ledger_ids)
      .select();

    if (error) {
      console.error("❌ Update payment status failed:", error);
      return { error: error.message };
    }


    console.log(`✅ Updated ${data?.length || 0} ledger entries`);
    return { data };
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    return { error: error?.message || "Unexpected error" };
  }
}