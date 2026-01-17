import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supbase/action';
import { AutoMinStockLevel } from '@/app/functions/admin/stock/stockalert/minstocklevel';

export async function POST(request: NextRequest) {
    try {
        const { config, auto_apply = true } = await request.json();

        const supabase = await createSupabaseAdmin();

        // Get all products from stock_alert table
        const { data: stockAlerts, error: stockError } = await supabase
            .from('stock_alert')
            .select(`
                product_id,
                min_stock_level,
                product:product_id (
                    product_name
                )
            `);

        if (stockError || !stockAlerts) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: stockError?.message || 'No products found in stock_alert table' 
                },
                { status: 500 }
            );
        }

        const results = [];
        let successCount = 0;

        // Process each product
        for (const alert of stockAlerts) {
            try {
                // Calculate new min stock level
                const calculation = await AutoMinStockLevel(alert.product_id, config);

                if (calculation.success && calculation.min_stock_level !== undefined) {
                    const oldMinStock = alert.min_stock_level || 0;
                    const newMinStock = calculation.min_stock_level;
                    const change = newMinStock - oldMinStock;
                    const changePercent = oldMinStock > 0 
                        ? ((change / oldMinStock) * 100) 
                        : 100;

                    // Auto-apply if enabled
                    if (auto_apply) {
                        const { error: updateError } = await supabase
                            .from('stock_alert')
                            .update({
                                min_stock_level: newMinStock,
                                updated_at: new Date().toISOString()
                            })
                            .eq('product_id', alert.product_id);

                        if (!updateError) {
                            successCount++;
                        }
                    } else {
                        successCount++;
                    }

                    // Get product name from the join
                    const productRecord = Array.isArray(alert.product) 
                        ? alert.product[0] 
                        : alert.product;
                    const productName = productRecord?.product_name || 'Unknown Product';

                    results.push({
                        product_id: alert.product_id,
                        product_name: productName,
                        old_min_stock: oldMinStock,
                        new_min_stock: newMinStock,
                        change,
                        change_percent: changePercent,
                        success: true,
                        metrics: calculation.metrics
                    });
                } else {
                    // Failed calculation
                    const productRecord = Array.isArray(alert.product) 
                        ? alert.product[0] 
                        : alert.product;
                    const productName = productRecord?.product_name || 'Unknown Product';

                    results.push({
                        product_id: alert.product_id,
                        product_name: productName,
                        old_min_stock: alert.min_stock_level || 0,
                        new_min_stock: alert.min_stock_level || 0,
                        change: 0,
                        change_percent: 0,
                        success: false,
                        error: calculation.error
                    });
                }
            } catch (error: any) {
                console.error(`Error processing product ${alert.product_id}:`, error);
                
                const productRecord = Array.isArray(alert.product) 
                    ? alert.product[0] 
                    : alert.product;
                const productName = productRecord?.product_name || 'Unknown Product';

                results.push({
                    product_id: alert.product_id,
                    product_name: productName,
                    old_min_stock: alert.min_stock_level || 0,
                    new_min_stock: alert.min_stock_level || 0,
                    change: 0,
                    change_percent: 0,
                    success: false,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            updated_count: successCount,
            total_count: stockAlerts.length,
            results,
            message: auto_apply 
                ? `Successfully updated ${successCount} of ${stockAlerts.length} products`
                : `Successfully calculated ${successCount} of ${stockAlerts.length} products`
        });

    } catch (error: any) {
        console.error('Error in calculate-all-min API:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}