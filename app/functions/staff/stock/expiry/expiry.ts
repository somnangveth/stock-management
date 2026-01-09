"use server";

import { createSupabaseAdmin, createSupabaseServerClient } from "@/lib/supbase/action";

//Fetch Expired Batches
export async function getExpiredBatches(){

    const supabase = await createSupabaseServerClient();

    const {data, error} = await supabase
    .from("expiry_alert")
    .select("*")
    .order("expiry_date", {ascending: true});

    if(error){
        console.error('Error fetching expired batches', error);
        throw error;
    }

    return data;
}


//Expiry Disposed
export async function disposeExpiredBatches(
  batch_id: string,
  product_id: string,
  data: {
  batch_number: string;
  product_id: string;
  quantity_disposed: number;
  disposal_date: Date;
  disposal_method: "trash" | "return_supplier" | "donation" | "other";
  cost_loss: number;
  reason: string;
}) {
  const supabase = await createSupabaseServerClient();
  
  try {
    console.log("Starting disposal process with data:", data);
    
    // Insert into dispose expired batch
    const { data: disposeData, error: disposeError } = await supabase
      .from("expired_product_disposals")
      .insert({
        batch_number: data.batch_number,
        product_id: data.product_id,
        quantity_disposed: data.quantity_disposed,
        disposal_date: data.disposal_date,
        disposal_method: data.disposal_method,
        cost_loss: data.cost_loss,
        reason: data.reason,
      })
      .select()
      .single();

    if (disposeError) {
      console.error("Failed to insert into dispose table:", disposeError);
      throw new Error(`Failed to insert into disposed data: ${disposeError.message}`);
    }

    console.log("Insert into expired disposed successfully!", disposeData);
    
    // Verify the insert by fetching it back
    const { data: verifyData, error: verifyError } = await supabase
      .from("expired_product_disposals")
      .select("*")
      .eq("product_disposal_id", disposeData.product_disposal_id)
      .single();
    
    console.log("Verification fetch result:", verifyData, verifyError);

    // Delete in product batch
    const { data: batchData, error: batchError } = await supabase
      .from("product_batches")
      .delete()
      .eq("batch_id", batch_id)
      .select();

    if (batchError) {
      console.error('Failed to delete batch data:', batchError.message);
      throw new Error(`Error deleting batch: ${batchError.message}`);
    }

    console.log("Batch deleted successfully!", batchData);

    return {
      disposed: disposeData,
      batches: batchData,
      error: null,
    };
  } catch (error) {
    console.error("Error in disposeExpiredBatches:", error);
    throw error;
  }
}

// Fetch all disposed products
export async function fetchDisposedProducts() {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .from("expired_product_disposals")
      .select(`
        *,
        products:product_id (
          product_name,
          sku
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching disposed products:", error);
      throw new Error(`Failed to fetch disposed products: ${error.message}`);
    }

    console.log("Fetched disposed products:", data);
    return data;
  } catch (error) {
    console.error("Error in fetchDisposedProducts:", error);
    throw error;
  }
}

// Fetch disposed products by date range
export async function fetchDisposedProductsByDateRange(
  startDate: Date,
  endDate: Date
) {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .from("expired_product_disposals")
      .select(`
        *,
        products:product_id (
          product_name,
          sku
        )
      `)
      .gte("disposal_date", startDate.toISOString())
      .lte("disposal_date", endDate.toISOString())
      .order("disposal_date", { ascending: false });

    if (error) {
      console.error("Error fetching disposed products:", error);
      throw new Error(`Failed to fetch disposed products: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in fetchDisposedProductsByDateRange:", error);
    throw error;
  }
}

// Fetch disposed products by disposal method
export async function fetchDisposedProductsByMethod(
  method: "trash" | "return_supplier" | "donation" | "other"
) {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .from("expired_product_disposals")
      .select(`
        *,
        products:product_id (
          product_name,
          sku
        )
      `)
      .eq("disposal_method", method)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching disposed products:", error);
      throw new Error(`Failed to fetch disposed products: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in fetchDisposedProductsByMethod:", error);
    throw error;
  }
}

// Get disposal statistics
export async function getDisposalStatistics() {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .from("expired_product_disposals")
      .select("cost_loss, disposal_method, quantity_disposed");

    if (error) {
      console.error("Error fetching disposal statistics:", error);
      throw new Error(`Failed to fetch disposal statistics: ${error.message}`);
    }

    // Calculate statistics
    const totalCostLoss = data.reduce((sum, item) => sum + (item.cost_loss || 0), 0);
    const totalQuantityDisposed = data.reduce((sum, item) => sum + (item.quantity_disposed || 0), 0);
    
    const methodBreakdown = data.reduce((acc, item) => {
      const method = item.disposal_method;
      if (!acc[method]) {
        acc[method] = { count: 0, totalCost: 0, totalQuantity: 0 };
      }
      acc[method].count++;
      acc[method].totalCost += item.cost_loss || 0;
      acc[method].totalQuantity += item.quantity_disposed || 0;
      return acc;
    }, {} as Record<string, { count: number; totalCost: number; totalQuantity: number }>);

    return {
      totalCostLoss,
      totalQuantityDisposed,
      totalDisposals: data.length,
      methodBreakdown,
    };
  } catch (error) {
    console.error("Error in getDisposalStatistics:", error);
    throw error;
  }
}