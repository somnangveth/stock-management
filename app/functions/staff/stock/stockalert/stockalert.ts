"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

//Update Min Stock And Max Stock
export async function updateMinMaxStock(
    stock_alert_id: string,
    product_id: string,
    data: Partial<{
        min_stock_level: number;
        max_stock_level: number;
    }>
){
    const supabase = await createSupabaseAdmin();

    try{
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
            minMaxStockData,
        }

    }catch(error){
        throw error;
    }
}
//Fetch Stock Alert Table
export async function fetchStockAlert(){
    const supabase = await createSupabaseAdmin();
    
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