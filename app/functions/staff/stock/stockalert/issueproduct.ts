"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";
import { revalidatePath } from "next/cache";

export async function addIssueProduct(
  batch_id: string,
  product_id: string,
  stock_alert_id: string,
  price_id: string,
  data: {
    movement_type: "return" | "damage" | "adjustment";
    quantity: number;
    notes: string;
  }
) {
  const supabase = await createSupabaseAdmin();

  // 1️⃣ Get current stock from stock_alert
  const { data: stock, error: stockError } = await supabase
    .from("stock_alert")
    .select("current_quantity")
    .eq("stock_alert_id", stock_alert_id)
    .single();

  if (stockError) throw stockError;
  if (!stock || stock.current_quantity < data.quantity) {
    throw new Error("Insufficient stock");
  }

  // 2️⃣ Get batch quantity_remaining
  const { data: batch, error: batchError } = await supabase
    .from("product_batches")
    .select("quantity_remaining")
    .eq("batch_id", batch_id)
    .single();

  if (batchError) throw batchError;
  if (!batch || batch.quantity_remaining < data.quantity) {
    throw new Error("Insufficient quantity in batch");
  }

  // 3️⃣ Get product price
  const { data: price, error: priceError } = await supabase
    .from("prices")
    .select("base_price")
    .eq("price_id", price_id)
    .not("total_amount", "is", null)
    .maybeSingle();

  if (priceError) throw priceError;
  if (!price) throw new Error("Price not found");

  const newStockQuantity = stock.current_quantity - data.quantity;
  const newBatchQuantity = batch.quantity_remaining - data.quantity;
  const costLoss = price.base_price * data.quantity;

  // 4️⃣ Update stock_alert
  const { error: updateStockError } = await supabase
    .from("stock_alert")
    .update({ current_quantity: newStockQuantity })
    .eq("stock_alert_id", stock_alert_id);

  if (updateStockError) throw updateStockError;

  // 5️⃣ Update product_batches quantity_remaining
  const { error: updateBatchError } = await supabase
    .from("product_batches")
    .update({ quantity_remaining: newBatchQuantity })
    .eq("batch_id", batch_id);

  if (updateBatchError) throw updateBatchError;

  // 6️⃣ Insert stock movement
  const { error: movementError } = await supabase
    .from("stock_movement")
    .insert({
      product_id,
      batch_id,
      movement_type: data.movement_type,
      quantity: data.quantity,
      quantity_remaining: newBatchQuantity, // Use batch's remaining, not stock_alert's
      cost_loss: costLoss,
      notes: data.notes,
    });

  if (movementError) throw movementError;

  // Revalidate the stock page to show updated data
  revalidatePath("/admin/stock");
}





//Fetch Stock Movement Table
export async function fetchStockMovement(){
    const supabase = await createSupabaseAdmin();

    const {data: stockMovementData, error: stockMovementError} = await supabase
    .from("stock_movement")
    .select("*");

    if(stockMovementError){
        console.error("Failed to fetch stock movement data", stockMovementError);
        throw new Error(`Error fetching ${stockMovementError.message}`);
    }
    return stockMovementData;
}