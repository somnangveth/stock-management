import { notFound } from "next/navigation";
import VendorDetailCatalog from "@/app/components/catalog/vendordetailcatalog.tsx";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { Edit } from "lucide-react";
import { Product } from "@/type/producttype";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}
export interface VendorProduct {
  product_id: number;
  product_name: string;
  sku_code: string;
  description: string;
  vendor_id: number;
  unit_price: number;
  product_image: string | null;
  quantity_remaining: number;

  category_id: number | null;
  subcategory_id: number | null;

  min_stock_level: number;
  reorder_point: number;

  created_at: string;
  updated_at: string;

  is_active: boolean;
  barcode: string | null;

  /** Derived field (not from DB) */
  basePrice: number;
}


export default async function VendorDetailPage({ params }: PageProps) {
  try {
    const { id } = await params;
    const vendorId = parseInt(id, 10);

    if (!id || isNaN(vendorId)) {
      notFound();
    }

    const supabase = await createSupabaseAdmin();

    // ===== 1. 获取供应商 =====
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_id", vendorId)
      .single();

    if (vendorError || !vendor) {
      notFound();
    }

    // ===== 2. 获取产品及其最新的 base price =====
    // 从 purchase_items 获取最新的 unit_price (base price)
    const { data: products = [], error: productsError } = await supabase
      .from("products")
      .select(`
        product_id,
        sku_code,
        product_name,
        product_image,
        max_stock_level,
        vendor_id,
        description
      `)
      .eq("vendor_id", vendorId)
      .order("product_name", { ascending: true });

    if (productsError) {
      console.error(" Error Searching Product:", productsError);
    }

    // ===== 3. 为每个产品获取最新的 base price =====
    // 从 purchase_items 中找到最新的 unit_price
    const productsWithPrice = await Promise.all(
      (products || []).map(async (p: any) => {
        const { data: latestPrice } = await supabase
          .from("purchase_items")
          .select("unit_price, created_at")
          .eq("product_id", p.product_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return {
          ...p,
          basePrice: latestPrice ? Number(latestPrice.unit_price) || 0 : 0,
        };
      })
    );

    console.log("✅ Product Found:", (products || []).length, "cases");
    console.log("✅ Products with Price", productsWithPrice.length, "cases");

    // ===== 4. 获取账目 =====
    const { data: ledger = [] } = await supabase
      .from("ledger")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    // ===== 格式化产品数据 =====
    const formattedProducts = (productsWithPrice || []).map((p: any) => ({
      product_id: p.product_id,
      product_name: p.product_name || "Unknown",
      sku_code: p.sku_code || "N/A",
      description: p.description || "",
      vendor_id: p.vendor_id,
      unit_price: p.basePrice, 
      product_image: p.product_image || null,
      quantity_remaining: p.quantity_remaining || 0, 
      category_id: p.category_id || null,
      subcategory_id: p.subcategory_id || null,
      min_stock_level: p.min_stock_level || 0,
      reorder_point: p.reorder_point || 0,
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
      is_active: p.is_active ?? true,
      barcode: p.barcode || null,
      basePrice: p.basePrice || 0,
    }));

    // 格式化账目数据
    const formattedLedger = (ledger || []).map((l: any, index: number) => ({
      key: `ledger-${l.ledger_id}-${index}`,
      id: l.ledger_id,
      ledger_id: l.ledger_id,
      vendor_id: l.vendor_id,
      vendor_name: vendor.vendor_name,
      source_type: l.source_type || "N/A",
      source_id: l.source_id || null,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      balance: Number(l.balance) || 0,
      note: l.note || "",
      created_at: l.created_at,
      created_by: l.created_by || null,
      payment_duedate: l.payment_duedate,
      payment_status: l.payment_status || "unpaid",
      term_status: l.term_status || "normal",
    }));

    return (
      <VendorDetailCatalog
        vendor={vendor}
        product={formattedProducts}
        ledger={formattedLedger}
      />
    );
  } catch (error) {
    console.error("Error:", error);
    notFound();
  }
}