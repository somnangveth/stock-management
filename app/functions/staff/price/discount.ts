"use server";

import { createSupabaseServerClient } from "@/lib/supbase/action";

// Add Multiple Discounts to Products
export async function addMultipleDiscounts(
  price_id: string,
  data: Array<{
    discount_percent: number;
    start_date: Date;
    end_date: Date;
    discount_price: number;
  }>
) {
  const supabase = await createSupabaseServerClient();
  
  try {
    // Validate price_id
    if (!price_id || price_id === 'undefined') {
      throw new Error("Invalid price_id provided");
    }

    console.log("Adding discounts for price_id:", price_id);

    const discountRecord = data.map(item => ({
      price_id: price_id,
      discount_percent: item.discount_percent,
      start_date: item.start_date,
      end_date: item.end_date,
      discount_price: item.discount_price,
    }));

    // Add data into discount table
    const { data: discountData, error: discountError} = await supabase
    .from("discount")
    .upsert(discountRecord, {
      onConflict: "price_id"
    })
    .select("discount_id");

    if (discountError) {
      console.error("Failed to insert into discount table:", discountError.message);
      throw discountError;
    }

    if (!discountData || discountData.length === 0) {
      throw new Error("No discount IDs returned from insert");
    }

    console.log("Discount data inserted:", discountData);

    // Extract the first discount_id
    const discountId = discountData[0].discount_id;

    // Update price table with the discount_id
    const { data: priceData, error: priceError } = await supabase
      .from("prices")
      .update({ discount_id: discountId })
      .eq('price_id', price_id)
      .select();

    if (priceError) {
      console.error("Failed to update price table:", priceError.message);
      throw priceError;
    }

    console.log("Price table updated:", priceData);

    return { discountData, priceData };
    
  } catch (error) {
    console.error("Error adding discounts:", error);
    throw error;
  }
}

//Fetch all discounts
export async function fetchDiscounts(){
  const supabase = await createSupabaseServerClient();

  try{
    const {data: discountData, error: discountError} = await supabase
    .from("discount")
    .select("*");

    if(discountError){
      console.error("Failed to fetch discount datas", discountError);
      throw new Error(`Error fetching datas: ${discountError.message}`);
    }

    return discountData;
  }catch(error){
    throw error;
  }
}