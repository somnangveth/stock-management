import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supbase/action';

export async function POST(request: NextRequest) {
    try {
        const { product_id, min_stock_level } = await request.json();

        if (!product_id || min_stock_level === undefined) {
            return NextResponse.json(
                { success: false, error: 'Product ID and min stock level are required' },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseAdmin();

        // Update stock_alert table
        const { data, error } = await supabase
            .from('stock_alert')
            .upsert({
                product_id,
                min_stock_level,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'product_id'
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Minimum stock level updated successfully'
        });
    } catch (error: any) {
        console.error('Error in update-min API:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}