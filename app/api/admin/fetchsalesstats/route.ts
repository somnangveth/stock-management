// app/api/admin/fetchsalesstats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supbase/action";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAdmin();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayStart = today.toISOString();
    const monthStartStr = monthStart.toISOString();

    // 获取今日销售总额
    const { data: todayData, error: todayError } = await supabase
      .from("sale")
      .select("total_amount")
      .gte("created_at", todayStart);

    if (todayError) {
      console.error("Failed to fetch today sales:", todayError);
      return NextResponse.json(
        { error: "Failed to fetch today sales" },
        { status: 500 }
      );
    }

    const todaySales = todayData?.reduce(
      (sum, sale) => sum + (sale.total_amount || 0),
      0
    ) || 0;

    // 获取本月销售总额
    const { data: monthData, error: monthError } = await supabase
      .from("sale")
      .select("total_amount")
      .gte("created_at", monthStartStr)
      .lt("created_at", now.toISOString());

    if (monthError) {
      console.error("Failed to fetch month sales:", monthError);
      return NextResponse.json(
        { error: "Failed to fetch month sales" },
        { status: 500 }
      );
    }

    const monthProfit = monthData?.reduce(
      (sum, sale) => sum + (sale.total_amount || 0),
      0
    ) || 0;

    return NextResponse.json({
      todaySales: Math.round(todaySales * 100) / 100,
      monthProfit: Math.round(monthProfit * 100) / 100,
    });
  } catch (error) {
    console.error("Error in fetchSalesStats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
