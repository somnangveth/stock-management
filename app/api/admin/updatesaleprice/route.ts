"use server";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { price_id, price_value, attribute_value } = body;

        if (!price_id) {
            return NextResponse.json(
                { error: "Price ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseAdmin();

        const updateData: any = {};
        if (price_value !== undefined) updateData.price_value = price_value;
        if (attribute_value !== undefined) updateData.attribute_value = attribute_value;

        const { data, error } = await supabase
            .from("sale_price")
            .update(updateData)
            .eq('price_id', price_id)
            .select();

        if (error) {
            console.error("Error updating sale price:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error in PUT /api/admin/updatesaleprice:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

