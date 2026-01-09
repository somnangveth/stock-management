"use server";

import { createSupabaseAdmin, createSupabaseServerClient } from "@/lib/supbase/action";

//Update Min Stock And Max Stock
export async function updateMinMaxStock(
    stock_alert_id: string,
    product_id: string,
    data: Partial<{
        min_stock_level: number;
        max_stock_level: number;
    }>
){
    const supabase = await createSupabaseServerClient();

    try{
        const {data: minMaxProductData, error: minMaxProductError} = await supabase
        .from("products")
        .update({
            min_stock_level: data.min_stock_level,
            max_stock_level: data.max_stock_level,
        })
        .eq('product_id', product_id);

        if(minMaxProductError){
            console.error("Failed to stock level in product table", minMaxProductData);
            throw new Error(`Error updating in product table ${minMaxProductError.message}`);
        }

        const {data: minMaxStockData, error: minMaxStockError} = await supabase
        .from("stock_alert")
        .update({
            threshold_quantity: data.min_stock_level,
            max_stock_level: data.max_stock_level,
        })
        .eq('stock_alert_id', stock_alert_id);

        if(minMaxStockError){
            console.error("Failed to stock level in stock alert table", minMaxStockData);
            throw new Error(`Error updating in stock alert table ${minMaxStockError.message}`);
        }

        return{
            minMaxProductData,
            minMaxStockData,
        }

    }catch(error){
        throw error;
    }
}
//Fetch Stock Alert Table
export async function fetchStockAlert(){
    const supabase = await createSupabaseServerClient();
    
    try{
        const {data: stockAlertData, error: stockAlertError} = await supabase
        .from("stock_alert")
        .select("*");

        if(stockAlertError){
            console.error("Failed to fetch stock alert data", stockAlertError);
            throw new Error(`Error fetching... ${stockAlertError.message}`);
        }

        return stockAlertData;
    }catch(error){
        throw error;
    }
}