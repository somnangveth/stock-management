"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

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

  // 1️. Get current stock
  const { data: stock, error: stockError } = await supabase
    .from("stock_alert")
    .select("current_quantity")
    .eq("stock_alert_id", stock_alert_id)
    .single();

  if (stockError) throw stockError;
  if (!stock || stock.current_quantity < data.quantity) {
    throw new Error("Insufficient stock");
  }

  // 2️. Get product price
  const { data: price, error: priceError } = await supabase
    .from("prices")
    .select("base_price")
    .eq("price_id", price_id)
    .not("total_amount", "is", null )
    .maybeSingle();

  if (priceError) throw priceError;

  const newQuantity = stock.current_quantity - data.quantity;
  const costLoss = price?.base_price * data.quantity;

  // 3️⃣ Update stock
  const { error: updateError } = await supabase
    .from("stock_alert")
    .update({ current_quantity: newQuantity })
    .eq("stock_alert_id", stock_alert_id);

  if (updateError) throw updateError;

  // 4️⃣ Insert stock movement
  const { error: movementError } = await supabase
    .from("stock_movement")
    .insert({
      product_id,
      batch_id,
      movement_type: data.movement_type,
      quantity: data.quantity,
      cost_loss: costLoss,
      notes: data.notes,
    });

  if (movementError) throw movementError;
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