// /api/admin/updateattribute/route.ts
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { attribute_id, attribute_name, module } = body;

        if (!attribute_id) {
            return NextResponse.json(
                { error: "Attribute ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseAdmin();

        const updateData: any = {};
        if (attribute_name) updateData.attribute_name = attribute_name;
        if (module) updateData.module = module;

        const { data, error } = await supabase
            .from("attribute")
            .update(updateData)
            .eq('attribute_id', attribute_id)
            .select();

        if (error) {
            console.error("Error updating attribute:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Error in PUT /api/admin/updateattribute:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}