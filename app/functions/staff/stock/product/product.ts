"use server";
import { getLoggedInUser } from "@/app/auth/actions";
import { deleteImage } from "@/app/components/image/actions/upload";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { Product } from "@/type/producttype";

// Create new Product
export async function createProduct(data: Partial<{
  // Products Info
  sku_code: string;
  product_name: string;
  slug: string;
  category_id: string;
  subcategory_id: string;
  vendor_id: string;
  description: string;
  product_image?: string;
  min_stock_level: number;
  max_stock_level: number;
  units_per_package: number;
  package_type: "box" | "case";

  attributes?: Array<{
  attribute_id: string;
  value: string;
  }>
  //Price
  base_price: number;
  profit_price: number;
  shipping: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;

  base_price_b2b: number;
  profit_price_b2b: number;
  shipping_b2b: number;
  tax_b2b: number;
  discount_b2b: number;
  b2b_price: number;

  // Product Batches
  batch_number: string;
  manufacture_date: Date;
  expiry_date: Date;
  cost_price: number;
  recieved_date: Date;
  note: string;
  quantity: number;
  packages_recieved: number;
}>) {
  const supabase = await createSupabaseAdmin();
  const getUser = await getLoggedInUser();

  const createdBy = getUser?.id;

  // -----------------------------
  // Insert Product
  // -----------------------------
  const { data: productData, error: productError } = await supabase
    .from("products")
    .insert({
      sku_code: data.sku_code,
      product_name: data.product_name,
      slug: data.slug,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      vendor_id: data.vendor_id,
      description: data.description,
      product_image: data.product_image,
      min_stock_level: data.min_stock_level,
      max_stock_level: data.max_stock_level,
      units_per_package: data.units_per_package,
      package_type: data.package_type,
      created_by: createdBy,
    })
    .select()
    .single();

  if (productError) {
    console.error("Failed to insert product:", productError);
    throw new Error(productError.message);
  }

  const productId = productData?.product_id;

  if (!productId) {
    throw new Error("No product ID returned from product insert.");
  }
  
  // Insert attributes
if (data.attributes && data.attributes.length > 0) {
  const attributeRecord = data.attributes.map((item) => ({
    product_id: productId,
    attribute_id: item.attribute_id,
    value: item.value,
  }));

  const { data: productAttributeData, error: productAttributeError } =
    await supabase.from("product_attribute").insert(attributeRecord).select();

  if (productAttributeError) {
    console.error("Failed to insert product attribute: ", productAttributeError);
    throw new Error(productAttributeError.message);
  }
  // <-- no return here! continue to insert prices, batch, alerts
}



  //Insert into Price table for B2C
  const {data: priceB2CData, error:  priceError} = await supabase
  .from("prices")
  .insert({
    product_id: productId,
    base_price: data.base_price,
    profit_price: data.profit_price,
    shipping: data.shipping,
    tax_amount: data.tax_amount,
    discount_amount: data.discount_amount,
    total_amount: data.total_amount,
  })
  .select()
  .single();

  if(priceError){
    console.error("Failed to insert b2c price", priceError.message);
  }

  //Insert into price table for B2B
  const {data: priceB2BData, error: priceB2BError} = await supabase
  .from("prices")
  .insert({
    product_id: productId,
    base_price: data.base_price_b2b,
    profit_price: data.profit_price_b2b,
    shipping: data.shipping_b2b,
    tax_amount: data.tax_b2b,
    discount_amount: data.discount_b2b,
    b2b_price: data.b2b_price
  })
  .select()
  .single();

  if(priceB2BError){
    console.error("Failed to insert b2b price", priceB2BError.message);
  }

  // -----------------------------
  // Insert First Product Batch
  // -----------------------------
  const { data: batchData, error: batchError } = await supabase
    .from("product_batches")
    .insert({
      product_id: productId,
      batch_number: data.batch_number, // <-- FIXED
      manufacture_date: data.manufacture_date,
      expiry_date: data.expiry_date,
      cost_price: data.cost_price,
      vendor_id: data.vendor_id,
      recieved_date: data.recieved_date,
      note: data.note,
      created_by: createdBy,
      quantity: data.quantity,
      quantity_remaining: data.quantity,
      packages_recieved: data.packages_recieved,
      units_per_package: data.units_per_package,
    })
    .select()
    .single();

  if (batchError) {
    console.error("Failed to insert product batch:", batchError);
    throw new Error(batchError.message);
  }

  const batchId = batchData?.batch_id;

  //Insert into expiry_alert table
  const {data: expiryAlertData, error: expiryAlertError} = await supabase
  .from("expiry_alert")
  .insert({
    batch_id: batchId,
    product_id: productId,
    expiry_date: data.expiry_date
  });

  if(expiryAlertError){
    console.error("Failed to insert into expiry_alert table", expiryAlertError);
    throw new Error(expiryAlertError.message);
  }

  //Insert into stock alert
  const {data: stockAlertData, error: stockAlertError} = await supabase
  .from("stock_alert")
  .insert({
     product_id: productId,
     threshold_quantity: data.min_stock_level,
     max_stock_level: data.max_stock_level,
     current_quantity: data.quantity,
     package_qty: data.packages_recieved,
     package_type: data.package_type,
     units_per_package: data.units_per_package,
  });

  if(stockAlertError){
    console.error("Failed to insert into stock alert", stockAlertError);
    throw new Error(stockAlertError.message);
  }

  return { 
    productData, 
    batchData,
    priceB2CData, 
    priceB2BData,
    expiryAlertData,
    stockAlertData};
}



// Update Product data
export async function updateProduct(
  product_id: string,
  data: Partial<{
    sku_code: string;
    product_name: string;
    category_id: string;
    subcategory_id: string;
    vendor_id: string;
    description: string | null;
    product_image: string | null;
    package_type: 'box' | 'case' | null;
  }>
) {
  const supabase = await createSupabaseAdmin();

  try {
    // Convert undefined or "" values to null
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (value === undefined || value === "") return [key, null];
        return [key, value];
      })
    );

    const { data: productData, error: productError } = await supabase
      .from('products')
      .update(sanitizedData)
      .eq('product_id', product_id)
      .single();

    if (productError) {
      console.error("Supabase update error:", productError);
      throw new Error("Failed to update product");
    }

    return productData;

  } catch (error: any) {
    console.error("updateProduct() Exception:", error);
    throw new Error("Failed to update product data: " + error.message);
  }
}


export async function deleteProduct(products: Product | Product[]) {
    const supabase = await createSupabaseAdmin();
    
    try {
        // Validate input
        if (!products) {
            console.error('deleteProduct: No products provided');
            return JSON.stringify({ 
                success: false, 
                error: 'No products provided' 
            });
        }

        // Normalize to array
        const productArray = Array.isArray(products) ? products : [products];
        
        // Validate products have required fields
        const validProducts = productArray.filter(p => p && p.product_id);
        
        if (validProducts.length === 0) {
            console.error('deleteProduct: No valid products with product_id');
            return JSON.stringify({ 
                success: false, 
                error: 'No valid products to delete' 
            });
        }
        
        // Extract product IDs
        const productIds = validProducts.map(p => p.product_id);
        
        // Extract image URLs (filter out null/undefined)
        const imageUrls = validProducts
            .map(p => p.product_image)
            .filter((url): url is string => Boolean(url));
        
        // Delete images if they exist
        if (imageUrls.length > 0) {
            try {
                await deleteImage({
                    imageUrls,
                    bucket: 'images',
                });
            } catch (imageError) {
                console.error('Failed to delete images:', imageError);
                // Continue with product deletion even if image deletion fails
            }
        }
        
        // Delete products from database
        const { error } = await supabase
            .from('products')
            .delete()
            .in('product_id', productIds);
        
        if (error) {
            console.error('Failed to delete products:', error);
            return JSON.stringify({ 
                success: false, 
                error: error.message 
            });
        }
        
        return JSON.stringify({ success: true });
        
    } catch (error: any) {
        console.error('Delete product error:', error);
        return JSON.stringify({ 
            success: false, 
            error: error.message || 'Unknown error occurred' 
        });
    }
}





//Fetch All Products
export async function fetchProducts() {
  const supabase = await createSupabaseAdmin();

  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("*")
    .order('sku_code', {ascending: true});

  if (productError) {
    console.error("Supabase query error:", productError); 
    console.error("Hint: check table name, column names, and RLS policies.");
    throw new Error(`Failed to fetch product data: ${productError.message}`);
  }

  return productData;
}

//Fetch All Categoies And Subcategories
export async function fetchCategoriesAndSubcategories(){
  const supabase = await createSupabaseAdmin();

  // Fetch all Categories
  const {data: categories, error: categoryError} = await supabase
  .from('category')
  .select('*');

  if(categoryError){
    throw new Error('Failed to fetch Category Data', categoryError);
  }

  //Fetch All Subcategories
  const{data: subcategories, error: subcategoryError} = await supabase
  .from('subcategory')
  .select('*');

  if(subcategoryError){
    throw new Error('Failed to fetch Subcategory', subcategoryError);
  }

  return {categories, subcategories};
}

//Fetch Vendors
export async function fetchVendors(){
  const supabase = await createSupabaseAdmin();

  const {data: vendorData, error: vendorError} = await supabase
  .from('vendors')
  .select('*');

  if(vendorError){
    throw new Error('Failed to fetch Vendor Data', vendorError);
  }

  return vendorData;
}