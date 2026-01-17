
// 文件路径：app/admin/vendors/[id]/page.tsx

import { notFound } from "next/navigation";
import VendorDetailCatalog from "@/app/components/catalog/vendordetailcatalog.tsx";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { Product } from "@/type/producttype";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VendorDetailPage({ params }: PageProps) {
  try {
    const { id } = await params;
    console.log("📍 VendorDetailPage - Vendor ID:", id);

    const vendorId = parseInt(id, 10);

    if (!id || isNaN(vendorId)) {
      console.error("❌ Invalid ID");
      notFound();
    }

    const supabase = await createSupabaseAdmin();
    console.log("✅ Supabase client created");

    // ===== 1. 获取供应商 =====
    console.log("🔍 Fetching vendor with ID:", vendorId);
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("vendor_id", vendorId)
      .single();

    if (vendorError || !vendor) {
      console.error("❌ Vendor not found:", vendorError);
      notFound();
    }

    console.log("✅ Vendor Found:", vendor.vendor_name);

    // ===== 2. 获取 product_vendor 关联 =====
    console.log("🔍 Fetching product_vendor associations for vendor:", vendorId);
    
    const { data: productVendorList, error: pvError } = await supabase
      .from("product_vendor")
      .select("product_id")
      .eq("vendor_id", vendorId);

    console.log("Product_vendor Error:", pvError);
    console.log("Product_vendor Data:", productVendorList);
    console.log("Found", productVendorList?.length || 0, "product associations");

    if (pvError) {
      console.error("❌ Product_vendor Query Error:", pvError);
    }

    // ===== 3. 获取这些产品的详细信息 =====
    let formattedProducts: Product[] = [];

    if (productVendorList && productVendorList.length > 0) {
      const productIds = productVendorList.map((pv: any) => pv.product_id);
      console.log("🔍 Fetching product details for IDs:", productIds);

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("product_id", productIds)
        .order("product_name", { ascending: true });

      console.log("Products Error:", productsError);
      console.log("Products Data:", products);
      console.log("Found", products?.length || 0, "products");

      if (productsError) {
        console.error("❌ Products Query Error:", productsError);
      }

      // 格式化产品数据
      formattedProducts = (products || []).map((p: any) => ({
        product_id: p.product_id,
        sku_code: p.sku_code || "N/A",
        product_name: p.product_name || "Unknown",
        product_image: p.product_image || null,
        description: p.description || "",
        slug: p.slug || "",
        category_id: p.category_id || "0",
        subcategory_id: 0,
        vendor_id: vendorId,
        min_stock_level: 0,
        max_stock_level: 0,
        default_shelf_life_days: 0,
        base_unit: "unit",
        units_per_package: p.units_per_package || 1,
        package_type: p.package_type || "box",
        track_expiry: false,
        is_active: true,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
        created_by: p.created_by || null,
        unit_price: 0,
        basePrice: 0,
        total_price: 0,
        discount_price: 0,
        tax_amount: 0,
        quantity_remaining: 0,
        product_location: p.product_location || null,
      } as unknown as Product));
    }

    console.log("✅ Formatted Products:", formattedProducts.length);

    // ===== 4. 获取账目 =====
    console.log("🔍 Fetching ledger");
    const { data: ledger = [], error: ledgerError } = await supabase
      .from("ledger")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (ledgerError) {
      console.error("⚠️ Ledger Query Error:", ledgerError);
    }

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

    console.log("✅ Formatted Ledger:", formattedLedger.length);

    return (
      <VendorDetailCatalog
        vendor={vendor}
        product={formattedProducts}
        ledger={formattedLedger}
      />
    );
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    notFound();
  }
}