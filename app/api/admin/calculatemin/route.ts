import { NextRequest, NextResponse } from 'next/server';
import { AutoMinStockLevel } from '@/app/functions/admin/stock/stockalert/minstocklevel';

export async function POST(request: NextRequest) {
    try {
        const { product_id, config } = await request.json();

        if (!product_id) {
            return NextResponse.json(
                { success: false, error: 'Product ID is required' },
                { status: 400 }
            );
        }

        const result = await AutoMinStockLevel(product_id, config);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in calculate-min API:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}