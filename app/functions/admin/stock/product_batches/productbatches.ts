"use server";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { getLoggedInUser } from "@/app/auth/actions";
import { revalidatePath } from "next/cache";

interface ImportPriceInput {
  attribute_id: string;
  quantity: number;
  price_value: number;
  product_image?: string;
}

interface StockBatchInput {
  product_id: string;
  sku_code: string;
  import_price: ImportPriceInput[];
  import_date: string;
  total_quantity: number;
  units_per_package?: number;
  package_type?: string;
}

interface ImportResult {
  success: string[]; // Array of batch_ids
  failed: Array<{
    sku_code: string;
    error: string;
  }>;
}

/**
 * Import stock for existing products by creating new batches
 * This function inserts into product_batches table and updates import_price records
 */
export async function importStock(batches: StockBatchInput[]): Promise<ImportResult> {
  const supabase = await createSupabaseAdmin();
  const getUser = await getLoggedInUser();
  const createdBy = getUser?.id;

  if (!createdBy) {
    throw new Error("User not authenticated");
  }

  const result: ImportResult = {
    success: [],
    failed: [],
  };

  for (const batch of batches) {
    try {
      // -----------------------------
      // 1. Validate Product Exists
      // -----------------------------
      const { data: productExists, error: productCheckError } = await supabase
        .from("products")
        .select("product_id")
        .eq("product_id", batch.product_id)
        .single();

      if (productCheckError || !productExists) {
        result.failed.push({
          sku_code: batch.sku_code,
          error: "Product not found",
        });
        continue;
      }

      // -----------------------------
      // 2. Validate Attributes Exist
      // -----------------------------
      for (const price of batch.import_price) {
        const { data: attributeExists, error: attributeCheckError } = await supabase
          .from("attribute")
          .select("attribute_id")
          .eq("attribute_id", price.attribute_id)
          .single();

        if (attributeCheckError || !attributeExists) {
          result.failed.push({
            sku_code: batch.sku_code,
            error: `Attribute ${price.attribute_id} not found`,
          });
          continue;
        }
      }

      // -----------------------------
      // 3. Insert Product Batch
      // -----------------------------
      const batchCode = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: newBatch, error: batchError } = await supabase
        .from("product_batches")
        .insert({
          product_id: batch.product_id,
          batch_number: batchCode,
          import_date: batch.import_date,
          quantity: batch.total_quantity,
          quantity_remaining: batch.total_quantity, // Initially, all quantity is available
          units_per_package: batch.units_per_package,
          status: "active",
          created_by: createdBy,
        })
        .select("batch_id")
        .single();

      if (batchError) {
        throw new Error(`Batch insert failed: ${batchError.message}`);
      }

      const batchId = newBatch?.batch_id;
      if (!batchId) {
        throw new Error("No batch ID returned from batch insert");
      }

      // -----------------------------
      // 4. Insert or Update Import Price Records
      // -----------------------------
      for (const price of batch.import_price) {
        // Check if import_price record exists for this product and attribute
        const { data: existingPrice } = await supabase
          .from("import_price")
          .select("price_id")
          .eq("product_id", batch.product_id)
          .eq("attribute_id", price.attribute_id)
          .single();

        if (existingPrice) {
          // Update existing import_price record
          const { error: updateError } = await supabase
            .from("import_price")
            .update({
              price_value: price.price_value,
              product_image: price.product_image || "",
              batch_id: batchId, // Link to new batch
              updated_at: new Date().toISOString(),
            })
            .eq("product_id", batch.product_id)
            .eq("attribute_id", price.attribute_id)
            .select("price_id");

          if (updateError) {
            throw new Error(`Price update failed: ${updateError.message}`);
          }
        } else {
          // Insert new import_price record
          const { error: insertError } = await supabase
            .from("import_price")
            .insert({
              product_id: batch.product_id,
              attribute_id: price.attribute_id,
              quantity: price.quantity,
              price_value: price.price_value,
              product_image: price.product_image || "",
              batch_id: batchId,
            });

          if (insertError) {
            throw new Error(`Price insert failed: ${insertError.message}`);
          }
        }
      }

      result.success.push(batchId);
    } catch (error) {
      console.error(`Error importing batch for ${batch.sku_code}:`, error);
      result.failed.push({
        sku_code: batch.sku_code,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  return result;
}

/**
 * Get all batches for a specific product
 */
export async function getProductBatches(productId: string) {
  const supabase = await createSupabaseAdmin();

  try {
    const { data: batches, error } = await supabase
      .from("product_batches")
      .select("*")
      .eq("product_id", productId)
      .order("import_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch batches: ${error.message}`);
    }

    return batches;
  } catch (error) {
    console.error("Error fetching product batches:", error);
    throw new Error("Failed to fetch product batches");
  }
}

/**
 * Update batch status (e.g., mark as depleted)
 */
export async function updateBatchStatus(
  batchId: string,
  status: "active" | "depleted" | "expired"
) {
  const supabase = await createSupabaseAdmin();

  try {
    const { error } = await supabase
      .from("product_batches")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("batch_id", batchId);

    if (error) {
      throw new Error(`Failed to update batch status: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating batch status:", error);
    throw new Error("Failed to update batch status");
  }
}

/**
 * Decrease remaining quantity when products are sold
 */
export async function decreaseBatchQuantity(batchId: string, quantitySold: number) {
  const supabase = await createSupabaseAdmin();

  try {
    // Get current batch data
    const { data: batch, error: fetchError } = await supabase
      .from("product_batches")
      .select("remaining_quantity")
      .eq("batch_id", batchId)
      .single();

    if (fetchError || !batch) {
      throw new Error("Batch not found");
    }

    const newRemainingQuantity = batch.remaining_quantity - quantitySold;

    if (newRemainingQuantity < 0) {
      throw new Error("Insufficient quantity in batch");
    }

    // Update batch with new quantity
    const { error: updateError } = await supabase
      .from("product_batches")
      .update({
        remaining_quantity: newRemainingQuantity,
        status: newRemainingQuantity === 0 ? "depleted" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("batch_id", batchId);

    if (updateError) {
      throw new Error(`Failed to update batch quantity: ${updateError.message}`);
    }

    return { success: true, remaining: newRemainingQuantity };
  } catch (error) {
    console.error("Error decreasing batch quantity:", error);
    throw error;
  }
}


//Update Batches
export async function updateBatch(
  product_id: string,
  batch_id: string,
  data: Partial<{
    batch_number: string;
    manufacture_date: Date;
    expiry_date: Date;
    recieved_date: Date;
    quantity: number;
    packages_recieved: number;
    units_per_package: number;
  }>
) {
  const supabase = await createSupabaseAdmin();
  try {
    // Get the OLD batch quantity before updating
    const { data: oldBatch, error: oldBatchError } = await supabase
      .from("product_batches")
      .select("quantity, quantity_remaining, packages_recieved")
      .eq("batch_id", batch_id)
      .single();

    if (oldBatchError) {
      console.error("Failed to fetch old batch data", oldBatchError);
      throw oldBatchError;
    }

    const oldQuantity = oldBatch?.quantity || 0;
    const oldPackage = oldBatch?.packages_recieved;
    const oldQuantityRemaining = oldBatch?.quantity_remaining || 0;
    const newQuantity = data.quantity || oldQuantity;
    const newPackage = data.packages_recieved || oldPackage;

    // Calculate the difference in quantity
    const quantityDifference = newQuantity - oldQuantity;
    const packageDifference = newPackage - oldPackage;

    // Get current stock alert data
    const { data: currentStockAlert, error: fetchError } = await supabase
      .from("stock_alert")
      .select("current_quantity, stock_alert_id, package_qty")
      .eq("product_id", product_id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch current stock alert", fetchError);
      throw fetchError;
    }

    // Calculate new total quantity (add the difference, not subtract)
    const newCurrentQty = (currentStockAlert?.current_quantity || 0) + quantityDifference;
    const newPackageQty = (currentStockAlert?.package_qty || 0) + packageDifference; 
    const stockAlertId = currentStockAlert?.stock_alert_id;

    // Update stock alert
    const { data: stockAlertData, error: stockAlertError } = await supabase
      .from("stock_alert")
      .update({ 
        current_quantity: newCurrentQty,
        package_qty: newPackageQty
      })
      .eq("stock_alert_id", stockAlertId);

    if (stockAlertError) {
      console.error("Failed to update stock alert", stockAlertError);
      throw stockAlertError;
    }

    // Calculate new quantity_remaining for the batch
    // Preserve the same reduction ratio: if 80 out of 100 remain, and new quantity is 150, then 120 should remain
    const newQuantityRemaining = oldQuantity > 0 
      ? Math.round((oldQuantityRemaining / oldQuantity) * newQuantity)
      : newQuantity;

    // Update the batch
    const { data: batchData, error: batchError } = await supabase
      .from('product_batches')
      .update({
        batch_number: data.batch_number,
        manufacture_date: data.manufacture_date,
        expiry_date: data.expiry_date,
        recieved_date: data.recieved_date,
        quantity: newQuantity,
        quantity_remaining: newQuantityRemaining,
        packages_recieved: newPackageQty,
        units_per_package: data.units_per_package,
      })
      .eq("batch_id", batch_id)
      .select();

    if (batchError) {
      console.error("Failed to update product batch", batchError);
      throw batchError;
    }

    return { stockAlertData, batchData };
  } catch (error) {
    console.error("Error in updateBatch:", JSON.stringify({ error }));
    throw error;
  }
}

//Delete Batch
export async function deleteBatch(batch_id: string, product_id: string) {
  const supabase = await createSupabaseAdmin();
  try {
    // Fetch the batch to be deleted (with batch_id filter!)
    const { data: currentBatch, error: currentBatchError } = await supabase
      .from("product_batches")
      .select("quantity_remaining")
      .eq("batch_id", batch_id)
      .single();

    if (currentBatchError) {
      console.error("Failed to fetch batch for deletion", currentBatchError);
      throw new Error(`Error fetching batch: ${currentBatchError.message}`);
    }

    // Fetch stock alert
    const { data: currentStockAlert, error: fetchError } = await supabase
      .from("stock_alert")
      .select("current_quantity, stock_alert_id")
      .eq("product_id", product_id)
      .single();

    if (fetchError) {
      console.error("Failed to fetch stock alert", fetchError);
      throw new Error(`Error fetching stock alert: ${fetchError.message}`);
    }

    // Calculate new quantity after deducting the batch's remaining quantity
    const deductQty = (currentStockAlert?.current_quantity || 0) - (currentBatch?.quantity_remaining || 0);

    // Update Stock Alert
    const { data: stockAlertData, error: stockAlertError } = await supabase
      .from("stock_alert")
      .update({ current_quantity: deductQty })
      .eq("product_id", product_id);

    if (stockAlertError) {
      console.error("Failed to update stock alert", stockAlertError);
      throw new Error(`Error updating stock alert: ${stockAlertError.message}`);
    }

    // Delete the batch
    const { data: batchData, error: batchError } = await supabase
      .from("product_batches")
      .delete()
      .eq("batch_id", batch_id);

    if (batchError) {
      console.error("Failed to delete batch", batchError);
      throw new Error(`Error deleting batch: ${batchError.message}`);
    }

    return { batchData, stockAlertData };
  } catch (error) {
    console.error("Error in deleteBatch:", error);
    throw error;
  }
}
//Fetch All Batch 
export async function fetchActiveBatch(){
    const supabase = await createSupabaseAdmin();

    const {data: batchData, error: batchError} = await supabase
    .from("product_batches")
    .select("*")
    .eq('status', 'active')
    .gt('quantity_remaining', 0)
    .order('expiry_date', {ascending: true});

    if(!batchData || batchError){
        console.error("Failed to fetch batch data");
        throw new Error("Failed to fetch");
    }

    return batchData;
}


export async function fetchBatch(){
    const supabase = await createSupabaseAdmin();

    const {data: batchData, error: batchError} = await supabase
    .from("product_batches")
    .select("*");

    if(!batchData || batchError){
        console.error("Failed to fetch batchData");
        throw new Error(`Error fetching: ${batchError.message}`);
    }

    return batchData;
}

export async function addStockInToStockAlert(
  batch_id: string,
  batchDetails: {
    batch_number: string;
    manufacture_date: Date;
    expiry_date: Date;
  }
) {
  const supabase = await createSupabaseAdmin();
  
  try {
    // First, get the batch data
    const { data: batchData, error: batchError } = await supabase
      .from("product_batches")
      .select("product_id, quantity")
      .eq("batch_id", batch_id)
      .eq("import_status", "stock_in")
      .single();

    if (batchError) throw batchError;
    if (!batchData) throw new Error("Batch not found or not in stock_in status");

    // Check if product already exists in stock_alert
    const { data: existingStock, error: fetchError } = await supabase
      .from("stock_alert")
      .select("current_quantity")
      .eq("product_id", batchData.product_id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is acceptable
      throw fetchError;
    }

    let newQuantity: number;
    if (existingStock) {
      // Product exists, add to current quantity
      newQuantity = existingStock.current_quantity + batchData.quantity;
    } else {
      // New product, use batch quantity
      newQuantity = batchData.quantity;
    }

    // Upsert into stock_alert
    const { data: stockAlertData, error: upsertError } = await supabase
      .from("stock_alert")
      .upsert(
        {
          product_id: batchData.product_id,
          current_quantity: newQuantity,
        },
        {
          onConflict: "product_id",
        }
      )
      .select();

    if (upsertError) throw upsertError;

    // Update batch with batch_number, dates, and received_date
    const { error: updateError } = await supabase
      .from("product_batches")
      .update({
        batch_number: batchDetails.batch_number,
        manufacture_date: batchDetails.manufacture_date.toISOString(),
        expiry_date: batchDetails.expiry_date.toISOString(),
        recieved_date: new Date().toISOString(),
        quantity_remaining: batchData.quantity, // Set initial quantity_remaining
        quantity: batchData.quantity
      })
      .eq("batch_id", batch_id);

    if (updateError) throw updateError;

    // Insert into expiry_alert table
    const { error: expiryAlertError } = await supabase
      .from("expiry_alert")
      .insert({
        batch_id: batch_id,
        product_id: batchData.product_id,
        expiry_date: batchDetails.expiry_date.toISOString(),
      });

    if (expiryAlertError) throw expiryAlertError;

    revalidatePath("/admin/stock");
    
    return { success: true, data: stockAlertData };
  } catch (error) {
    console.error("Error in addStockInToStockAlert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}