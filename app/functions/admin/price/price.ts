"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

// Type definition for product data
type SalePriceInput = {
  product_id: string;
  attribute_id: string[];
  sale_price: Array<{
    attribute_id: string;
    price_value: number;
    price_variance: number;
    attribute_value: number;
  }>;
};

export async function addSalePrice(sales: SalePriceInput[]) {
  const supabase = await createSupabaseAdmin();
  const successResults: any[] = [];
  const failedResults: any[] = [];

  try {
    for (const data of sales) {
      try {
        // Validate that we have sale prices
        if (!data.sale_price || data.sale_price.length === 0) {
          failedResults.push({
            product_id: data.product_id,
            error: "No sale prices provided",
          });
          continue;
        }

        // Insert all sale prices for this product - NOW INCLUDING product_id
        const salePriceInserts = data.sale_price.map((price) => ({
          price_value: price.price_value,
          price_variance: price.price_variance,
          attribute_id: price.attribute_id,
          attribute_value: price.attribute_value,
          product_id: data.product_id, // ADD product_id here
        }));

        const { data: insertedSalePrices, error: salePriceError } = await supabase
          .from("sale_price")
          .insert(salePriceInserts)
          .select("price_id");

        if (salePriceError) {
          console.error("Sale price insert error:", salePriceError);
          failedResults.push({
            product_id: data.product_id,
            error: salePriceError.message,
          });
          continue;
        }

        if (!insertedSalePrices || insertedSalePrices.length === 0) {
          failedResults.push({
            product_id: data.product_id,
            error: "Failed to insert sale prices",
          });
          continue;
        }

        // Update import_price records with the new sale_price_ids
        for (let i = 0; i < data.sale_price.length; i++) {
          const salePrice = data.sale_price[i];
          const salePriceId = insertedSalePrices[i].price_id;

          // Find the import_price record for this product and attribute
          const { data: importPriceRecord, error: findError } = await supabase
            .from("import_price")
            .select("price_id")
            .eq("product_id", data.product_id)
            .eq("attribute_id", salePrice.attribute_id)
            .is("sale_price_id", null)
            .single();

          if (findError || !importPriceRecord) {
            console.error("Import price find error:", findError);
            continue;
          }

          // Update the import_price with the sale_price_id
          const { error: updateError } = await supabase
            .from("import_price")
            .update({ sale_price_id: salePriceId })
            .eq("price_id", importPriceRecord.price_id);

          if (updateError) {
            console.error("Import price update error:", updateError);
          }
        }

        successResults.push({
          product_id: data.product_id,
          sale_prices_added: data.sale_price.length,
        });
      } catch (error) {
        console.error(`Error processing product ${data.product_id}:`, error);
        failedResults.push({
          product_id: data.product_id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: successResults,
      failed: failedResults,
    };
  } catch (error) {
    console.error("Unexpected error in addSalePrice:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to add sale prices"
    );
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

//Fetch import price
export async function fetchImportPrice(){
  const supabase = await createSupabaseAdmin();
  try{
    const {data: importPriceData, error: importPriceError} = await supabase
    .from("import_price")
    .select("*");

    if(importPriceError){
      console.error(`Failed to fetch import price ${importPriceError.message}`);
      throw new Error(`Error: ${importPriceError.message}`);
    }

    return importPriceData;
  }catch(error){
    throw error;
  }
}

// Fetch Sale Price
export async function fetchSalePrice() {
  const supabase = await createSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from("sale_price")
      .select("*");

    if (error) {
      console.error("Failed to fetch sale price:", error.message);
      return []; 
    }

    return data ?? [];
  } catch (error) {
    console.error("Unexpected sale price fetch error:", error);
    return []; 
  }
}
