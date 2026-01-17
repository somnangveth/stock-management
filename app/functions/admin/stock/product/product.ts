"use server";
import { getLoggedInUser } from "@/app/auth/actions";
import { deleteImage } from "@/app/components/image/actions/upload";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { Product } from "@/type/producttype";

type ProductInput = {
  // Products Info
  sku_code: string;
  product_name: string;
  slug: string;
  product_image?: string;
  category_id: string;
  description: string;
  units_per_package?: number;
  package_type?: "box" | "case" | string;
  // Price & Attributes
  import_price: Array<{
    attribute_id: string;
    price_value: number;
    quantity: number;
  }>;
  // Vendors - CHANGED TO NUMBER
  vendor_ids?: number[]; // From UI - numbers to match database
  product_vendor?: Array<{
    vendor_id: number; // Changed to number
  }>;
  // Product Batches
  import_date: string | Date;
  quantity: number;
  min_stock_level: number;
};

// Create multiple products at once
export async function importProducts(products: ProductInput[]) {
  const supabase = await createSupabaseAdmin();
  const getUser = await getLoggedInUser();
  const createdBy = getUser?.id;

  if (!createdBy) {
    throw new Error("User not authenticated");
  }

  const results = {
    success: [] as string[],
    failed: [] as { sku_code: string; error: string }[],
  };

  // Process each product
  for (const data of products) {
    try {
      // Validate required fields
      if (!data.sku_code || !data.product_name || !data.category_id) {
        throw new Error("Missing required fields: sku_code, product_name, or category_id");
      }

      // Normalize vendor data (handle both formats) - now using numbers
      const vendorIds = data.vendor_ids || data.product_vendor?.map(v => v.vendor_id) || [];
      
      if (vendorIds.length === 0) {
        throw new Error("At least one vendor is required");
      }

      // Validate import_price
      if (!data.import_price || data.import_price.length === 0) {
        throw new Error("At least one attribute price is required");
      }

      // Convert import_date to ISO string if it's a Date object
      const importDate = data.import_date instanceof Date 
        ? data.import_date.toISOString() 
        : data.import_date;

      // -----------------------------
      // 1. Insert Product
      // -----------------------------
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert({
          sku_code: data.sku_code,
          product_name: data.product_name,
          slug: data.slug,
          category_id: data.category_id,
          description: data.description,
          units_per_package: data.units_per_package || 1,
          package_type: data.package_type || "box",
          created_by: createdBy,
          product_image: data.product_image
        })
        .select()
        .single();

      if (productError) {
        throw new Error(`Product insert failed: ${productError.message}`);
      }

      const productId = productData?.product_id;
      if (!productId) {
        throw new Error("No product ID returned from product insert");
      }

      // -----------------------------
      // 2. Insert Import Prices (multiple attributes)
      // -----------------------------
      const priceRecords = data.import_price.map((price) => ({
        product_id: productId,
        attribute_id: price.attribute_id,
        price_value: price.price_value,
        attribute_value: price.quantity,
      }));

      const { error: priceError } = await supabase
        .from("import_price")
        .insert(priceRecords);

      if (priceError) {
        throw new Error(`Price insert failed: ${priceError.message}`);
      }

      // -----------------------------
      // 3. Insert Product Vendor Relationships
      // -----------------------------
      const vendorRecords = vendorIds.map((vendor_id) => ({
        vendor_id: vendor_id, // Now a number
        product_id: productId,
      }));

      const { error: vendorError } = await supabase
        .from("product_vendor")
        .insert(vendorRecords);

      if (vendorError) {
        throw new Error(`Vendor insert failed: ${vendorError.message}`);
      }

      // -----------------------------
      // 4. Insert Product Batch
      // -----------------------------
      const { error: batchError } = await supabase
        .from("product_batches")
        .insert({
          product_id: productId,
          import_date: importDate,
          quantity: data.quantity,
          import_status: "pending",
          min_stock_level: data.min_stock_level,
          created_by: createdBy,
        });

      if (batchError) {
        throw new Error(`Batch insert failed: ${batchError.message}`);
      }

      results.success.push(data.sku_code);
    } catch (error) {
      console.error(`Failed to create product ${data.sku_code}:`, error);
      results.failed.push({
        sku_code: data.sku_code,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

// Single product creation (wrapper around createProducts)
export async function createProduct(data: ProductInput) {
  const results = await importProducts([data]);
  
  if (results.failed.length > 0) {
    throw new Error(results.failed[0].error);
  }
  
  return {
    success: true,
    sku_code: results.success[0],
  };
}
export async function updateProductBasicInfo(
  product_id: string,
  data: Partial<{
    sku_code: string;
    product_name: string;
    category_id: string;
    description: string | null;
    product_image: string | null;
    package_type: "box" | "case" | null;
  }>
) {
  const supabase = await createSupabaseAdmin();


  const { data: updatedProduct, error } = await supabase
    .from("products")
    .update({
      sku_code: data.sku_code,
      product_name: data.product_name,
      product_image: data.product_image,
      category_id: data.category_id,
      description: data.description,
      package_type: data.package_type
    })
    .eq("product_id", product_id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to update product");
  }

  return updatedProduct;
}

// Update Product data
export async function updateProduct(
  product_id: string,
  data: Partial<{
    sku_code: string;
    product_name: string;
    category_id: string;
    vendor_id: string[];
    description: string | null;
    product_image: string | null;
  }>
) {
  const supabase = await createSupabaseAdmin();

  try {
    // Separate vendor_id from product data
    const { vendor_id, ...productData } = data;

    // Convert undefined or "" values to null for product fields
    const sanitizedData = Object.fromEntries(
      Object.entries(productData).map(([key, value]) => {
        if (value === undefined || value === "") return [key, null];
        return [key, value];
      })
    );

    // Update product table
    const { data: updatedProduct, error: productError } = await supabase
      .from('products')
      .update(sanitizedData)
      .eq('product_id', product_id)
      .select()
      .single();

    if (productError) {
      console.error("Supabase update error:", productError);
      throw new Error("Failed to update product");
    }

    // Handle vendor associations if vendor_id array is provided
    if (vendor_id !== undefined) {
      // Delete existing vendor associations for this product
      const { error: deleteError } = await supabase
        .from('product_vendor')
        .delete()
        .eq('product_id', product_id);

      if (deleteError) {
        console.error("Failed to delete existing vendors:", deleteError);
        throw new Error("Failed to update product vendors");
      }

      // Insert new vendor associations if any vendors provided
      if (vendor_id && vendor_id.length > 0) {
        const productVendorRecords = vendor_id.map(vendorId => ({
          product_id: product_id,
          vendor_id: vendorId
        }));

        const { error: insertError } = await supabase
          .from('product_vendor')
          .insert(productVendorRecords);

        if (insertError) {
          console.error("Failed to insert new vendors:", insertError);
          throw new Error("Failed to update product vendors");
        }
      }
    }

    return updatedProduct;

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


//fetch vendor product table
export async function fetchVendorProduct(){
  const supabase = await createSupabaseAdmin();
  try{
    const {data: vendorproductData, error: vendorproductError} = await supabase
    .from("product_vendor")
    .select("*");

    if(vendorproductError){
      console.error(`Failed to fetch product_vendor data table ${vendorproductError.message}`);
    }
    return vendorproductData;
  }catch(error){
    throw error;
  }
}