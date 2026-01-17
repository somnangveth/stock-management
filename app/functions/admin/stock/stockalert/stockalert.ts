"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";

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