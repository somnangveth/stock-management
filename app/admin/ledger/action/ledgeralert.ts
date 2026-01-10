"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";
import { LedgerAlert } from "@/type/duedateledger";

/**
 * 获取账期提醒信息
 * - overdateCount: 已逾期的账单数
 * - overSoonCount: 即将到期的账单数 (7天内)
 */
export async function fetchLedgerAlert(): Promise<LedgerAlert> {
  try {
    const supabase = await createSupabaseAdmin();

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // 7 天后（快过期阈值）
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 7);
    const soonDateStr = soonDate.toISOString().split("T")[0];

    // 获取所有未支付的账单（credit < debit 表示未完全支付）
    const { data, error } = await (await supabase)
      .from("ledger")
      .select(
        `
        ledger_id,
        payment_duedate,
        payment_status,
        debit,
        credit
      `
      )
      .lte("payment_duedate", soonDateStr); // 截止日期在 7 天内

    if (error) {
      console.error("fetchLedgerAlert error:", error);
      return {
        overSoonCount: 0,
        overdateCount: 0,
      };
    }

    let overSoonCount = 0;
    let overdateCount = 0;

    for (const item of data ?? []) {
      if (!item.payment_duedate) continue;

      // 判断是否未支付或部分支付
      const debit = Number(item.debit ?? 0);
      const credit = Number(item.credit ?? 0);
      const isUnpaid = credit < debit;

      // 只统计未支付的账单
      if (!isUnpaid) continue;

      // 判断是否已逾期
      if (item.payment_duedate < todayStr) {
        overdateCount++;
      } else if (item.payment_duedate <= soonDateStr) {
        // 在 7 天内但未逾期
        overSoonCount++;
      }
    }

    console.log(`Ledger Alert: ${overdateCount} overdue, ${overSoonCount} due soon`);

    return {
      overSoonCount,
      overdateCount,
    };
  } catch (err: any) {
    console.error("Unexpected error in fetchLedgerAlert:", err);
    return {
      overSoonCount: 0,
      overdateCount: 0,
    };
  }
}

/**
 * 获取详细的账期提醒信息（包括具体的账单列表）
 */
export async function fetchLedgerAlertDetailed() {
  try {
    const supabase = await createSupabaseAdmin();

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 7);
    const soonDateStr = soonDate.toISOString().split("T")[0];

    // 获取所有待处理的账单
    const { data, error } = await (await supabase)
      .from("ledger")
      .select(
        `
        ledger_id,
        vendor_id,
        vendors:vendor_id (vendor_name),
        payment_duedate,
        payment_status,
        debit,
        credit,
        balance
      `
      )
      .lte("payment_duedate", soonDateStr)
      .order("payment_duedate", { ascending: true });

    if (error) {
      console.error("fetchLedgerAlertDetailed error:", error);
      return {
        overdated: [],
        dueSoon: [],
        summary: {
          overSoonCount: 0,
          overdateCount: 0,
        },
      };
    }

    const overdated = [];
    const dueSoon = [];

    for (const item of data ?? []) {
      if (!item.payment_duedate) continue;

      // 判断是否未支付或部分支付
      const debit = Number(item.debit ?? 0);
      const credit = Number(item.credit ?? 0);
      const isUnpaid = credit < debit;

      if (!isUnpaid) continue;

      const ledgerItem = {
        ledger_id: item.ledger_id,
        vendor_id: item.vendor_id,
        vendor_name: item.vendor_id?.vendor_name || "Unknown Vendor",
        payment_duedate: item.payment_duedate,
        balance: Number(item.balance ?? debit - credit),
        daysUntilDue: Math.ceil(
          (new Date(item.payment_duedate).getTime() - new Date(todayStr).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      };

      if (item.payment_duedate < todayStr) {
        overdated.push(ledgerItem);
      } else if (item.payment_duedate <= soonDateStr) {
        dueSoon.push(ledgerItem);
      }
    }

    return {
      overdated,
      dueSoon,
      summary: {
        overSoonCount: dueSoon.length,
        overdateCount: overdated.length,
      },
    };
  } catch (err: any) {
    console.error("Unexpected error in fetchLedgerAlertDetailed:", err);
    return {
      overdated: [],
      dueSoon: [],
      summary: {
        overSoonCount: 0,
        overdateCount: 0,
      },
    };
  }
}