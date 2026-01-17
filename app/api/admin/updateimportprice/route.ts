"use server";
// /api/admin/updateimportprice/route.ts
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { price_id, price_value } = body;

        if (!price_id) {
            return NextResponse.json(
                { error: "Price ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseAdmin();

        // Get the current sale price to calculate variance
        const { data: salePrice } = await supabase
            .from("sale_price")
            .select("price_value")
            .eq('price_id', price_id)
            .single();

        const price_variance = salePrice 
            ? salePrice.price_value - price_value 
            : 0;

        // Check if import price exists
        const { data: existingImportPrice } = await supabase
            .from("import_price")
            .select("price_id")
            .eq('price_id', price_id)
            .single();

        let data, error;

        if (existingImportPrice) {
            // Update existing import price
            const updateResult = await supabase
                .from("import_price")
                .update({
                    price_value,
                    price_variance
                })
                .eq('price_id', price_id)
                .select();
            
            data = updateResult.data;
            error = updateResult.error;
        } else {
            // Insert new import price
            const insertResult = await supabase
                .from("import_price")
                .insert({
                    price_id,
                    price_value,
                    price_variance
                })
                .select();
            
            data = insertResult.data;
            error = insertResult.error;
        }

        if (error) {
            console.error("Error updating/inserting import price:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error in PUT /api/admin/updateimportprice:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
