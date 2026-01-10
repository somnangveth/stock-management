"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";


export async function addPrice(data: {
  product_id: string;
  base_price: number;
  tax: number;
  final_price: number;
  profit_price: number;
  shipping: number;
  discount: number;
}) {
  const supabase = await createSupabaseAdmin();

  try {
    console.log("Price Insert Payload:", data);

    const { data: priceData, error } = await supabase
      .from("prices")
      .insert({
        product_id: data.product_id,
        base_price: data.base_price,
        tax: data.tax,
        final_price: data.final_price,
        profit_price: data.profit_price,
        shipping: data.shipping,
        discount: data.discount,
      })
      .select("*");

    if (error) {
      console.error("❌ Supabase Insert Error:", error);

      // Important: return the REAL supabase message to frontend
      throw new Error(error.message);
    }

    console.log("✅ Price Inserted:", priceData);

    return { success: true, price: priceData };
  } catch (err: any) {
    console.error("🔥 Insert Price Failed:", err.message);
    throw new Error(err.message || "Failed to insert price");
  }
}

//Update Product Price for B2C
export async function updatePriceB2C(
  price_id: string,
  data: Partial<{
    base_price: number;
    tax: number;
    total: number;
    profit_price: number;
    shipping: number;
    discount: number;
  }>
){
  const supabase = await createSupabaseAdmin();

  try{
    console.log("Updating Price...");

    const {data: priceData, error: priceError} = await supabase
    .from("prices")
    .update({
      base_price: data.base_price,
      tax_amount: data.tax,
      total_amount: data.total,
      profit_price: data.profit_price,
      shipping: data.shipping,
    })
    .eq("price_id", price_id);

    if(priceError){
      console.error("Failed to fetch price data", priceError);
      throw new Error("Error fetching");
    }

    return priceData;
     
  }catch(error){
    console.error("Failed to fetch: ", error);
  }
}

  //Update Product Price for B2B
  export async function updatePriceB2B(
  price_id: string,
  data: Partial<{
    base_price: number;
    tax_amount: number;
    b2b_price: number;
    profit_price: number;
    shipping: number;
  }>
  ){
  const supabase = await createSupabaseAdmin();

  try{
    console.log("Updating Price...");

    const {data: priceData, error: priceError} = await supabase
    .from("prices")
    .update({
      base_price: data.base_price,
      tax_amount: data.tax_amount,
      b2b_price: data.b2b_price,
      profit_price: data.profit_price,
      shipping: data.shipping,
    })
    .eq("price_id", price_id);

    if(priceError){
      console.error("Failed to fetch price data", priceError);
      throw new Error("Error fetching");
    }

    return priceData;
      
  }catch(error){
    console.error("Failed to fetch: ", error);
  }
  }

//Update Multiple Price
export async function updateMultiplePrices(
  product_id: string,
  data: Array<Partial<{
    base_price: number;
    tax: number;
    final_price: number;
    profit_price: number;
    shipping: number;
  }>>
){
  const supabase = await createSupabaseAdmin();

  try{

    if(!Array.isArray(data)){
      return null;
    }

    //Records of prices
    const priceRecord = data.map(item => ({
      base_price: item.base_price,
      tax: item.tax,
      final_price: item.final_price,
      profit_price: item.profit_price,
      shipping: item.shipping,
    }));


    const {data: priceData, error: priceError} = await supabase
    .from('prices')
    .update(priceRecord)
    .eq('product_id', product_id);

    if(priceError){
      console.error("Failed to update multiple prices");
    }

    return {priceData};
    
  }catch(error){
    console.error(error);
  }
}


//Fetch Price for B2C (Buyer to Customer)
export async function fetchPricesB2C(){
  const supabase = await createSupabaseAdmin();

  const {data: priceData, error: priceError} = await supabase
  .from("prices")
  .select("*")
  .not('total_amount', 'is', null);

  if(priceError){
    console.error("Failed to fetch price data for B2C");
    throw new Error("Error fetching...");
  }

  return priceData;
}

//Fetch Price for B2B(Buyer to Buyer)
export async function fetchPricesB2B(){
  const supabase = await createSupabaseAdmin();

  const {data: priceData, error: priceError} = await supabase
  .from("prices")
  .select("*")
  .not('b2b_price', 'is',null);

  if(priceError){
    console.error("Failed to fetch Price Data for B2B");
    throw new Error("Error fetching...");
  }
  return priceData;
}