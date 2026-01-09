"use server";
import { createSupabaseAdmin, createSupabaseServerClient } from "@/lib/supbase/action";

//Add Batches
export async function addBatch(
    product_id: string,
    data: Partial<{
        batch_number: string;
        manufacture_date: Date,
        expiry_date: Date,
        recieved_date: Date,
        quantity: number,
        packages_recieved: number,
        units_per_package: number,
        cost_price: number,
    }>
){
    const supabase = await createSupabaseServerClient();

    try{
        // Inserting into Stock Alert First
        const {data: currentStockAlert, error: fetchError} = await supabase
        .from("stock_alert")
        .select("current_quantity, stock_alert_id, package_qty")
        .eq("product_id", product_id)
        .single();

        if(fetchError){
            console.error("Failed to fetch current stock alert", fetchError);
            throw fetchError;
        }

        //Calculate new quantity
        const currentQty = (currentStockAlert?.current_quantity || 0) + (data.quantity || 0);
        const currentPackageQty = (currentStockAlert?.package_qty || 0) + (data.packages_recieved);

        const stockAlertId = currentStockAlert?.stock_alert_id;

        const {data: stockAlertData, error: stockAlertError} = await supabase
        .from("stock_alert")
        .update({
          current_quantity: currentQty,
          package_qty: currentPackageQty,
        })
        .eq("stock_alert_id", stockAlertId);

        const { data: batchData, error: batchError } = await supabase
        .from('product_batches')
        .insert({
            product_id: product_id,
            batch_number: data.batch_number,
            manufacture_date: data.manufacture_date,
            expiry_date: data.expiry_date,
            recieved_date: data.recieved_date,
            quantity: data.quantity,
            quantity_remaining: currentQty,
            packages_recieved: data.packages_recieved,
            units_per_package: data.units_per_package,
            cost_price: data.cost_price,
        })
        .select();

        if(batchError) {
            console.error("Failed to insert product batch", batchError);
        }


        return {stockAlertData, batchData}

    }catch(error){
        console.error(JSON.stringify({error}));
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
    cost_price: number;
  }>
) {
  const supabase = await createSupabaseServerClient();
  try {
    // Get the OLD batch quantity before updating
    const { data: oldBatch, error: oldBatchError } = await supabase
      .from("product_batches")
      .select("quantity, quantity_remaining, package_recieved")
      .eq("batch_id", batch_id)
      .single();

    if (oldBatchError) {
      console.error("Failed to fetch old batch data", oldBatchError);
      throw oldBatchError;
    }

    const oldQuantity = oldBatch?.quantity || 0;
    const oldPackage = oldBatch?.package_recieved;
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
        cost_price: data.cost_price,
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
  const supabase = await createSupabaseServerClient();
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
    const supabase = await createSupabaseServerClient();

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
    const supabase = await createSupabaseServerClient();

    const {data: batchData, error: batchError} = await supabase
    .from("product_batches")
    .select("*");

    if(!batchData || batchError){
        console.error("Failed to fetch batchData");
        throw new Error(`Error fetching: ${batchError.message}`);
    }

    return batchData;
}
