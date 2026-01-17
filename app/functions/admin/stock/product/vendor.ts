"use server";
import { createSupabaseAdmin } from "@/lib/supbase/action";

// ✅ Fetch Products by Vendor ID
export async function fetchProductByVendor(vendor_id: number) {
  const supabase = await createSupabaseAdmin();

  try {
    console.log("🔍 Fetching products for vendor:", vendor_id);

    // Query product_vendor table to find products with this vendor_id
    const { data: productVendorData, error: pvError } = await supabase
      .from("product_vendor")
      .select("product_id")
      .eq("vendor_id", vendor_id);

    if (pvError) {
      console.error("Supabase query error:", pvError);
      throw new Error(`Failed to fetch product-vendor mapping: ${pvError.message}`);
    }

    if (!productVendorData || productVendorData.length === 0) {
      console.log("⚠️ No products found for vendor:", vendor_id);
      return [];
    }

    // Extract product IDs
    const productIds = productVendorData.map((pv: any) => pv.product_id);

    // Fetch full product details for these product IDs
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(
        `
        product_id,
        sku_code,
        product_name,
        slug,
        product_image,
        created_at,
        updated_at,
        units_per_package,
        package_type,
        description,
        product_location,
        category_id,
        created_by
      `
      )
      .in("product_id", productIds)
      .order("sku_code", { ascending: true });

    if (productError) {
      console.error("Supabase query error:", productError);
      throw new Error(`Failed to fetch product data: ${productError.message}`);
    }

    if (!productData) {
      console.log("⚠️ No products found");
      return [];
    }

    console.log("✅ Fetched products for vendor", vendor_id, ":", productData.length);
    console.log("📋 Products:", productData.map((p: any) => p.product_name));

    return productData;
  } catch (error: any) {
    console.error("Failed to fetch products by vendor:", error);
    throw error;
  }
}
