import { createSupabaseAdmin } from "@/lib/supbase/action";

/**
 * Calculate dynamic minimum stock level based on sales velocity
 * Uses multiple calculation methods and selects the most appropriate one
 */

type SalesDataPoint = {
    quantity: number;
    created_at: string;
};

type SaleItemWithSale = {
    quantity: number;
    sale: Array<{
        created_at: string;
    }> | {
        created_at: string;
    } | null;
};

type MinStockConfig = {
    lookbackDays?: number;        // Days to analyze (default: 90)
    leadTimeDays?: number;         // Days to restock (default: 7)
    safetyStockMultiplier?: number; // Safety buffer (default: 1.5)
    minThreshold?: number;         // Absolute minimum (default: 10)
    seasonalAdjustment?: boolean;  // Consider seasonal trends (default: true)
};

export async function AutoMinStockLevel(
    product_id: string,
    config: MinStockConfig = {}
) {
    const supabase = await createSupabaseAdmin();

    // Default configuration
    const {
        lookbackDays = 90,
        leadTimeDays = 7,
        safetyStockMultiplier = 1.5,
        minThreshold = 10,
        seasonalAdjustment = true,
    } = config;

    try {
        // Calculate date range
        const lookbackDate = new Date();
        lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

        // Fetch sales data with date information
        const { data: saleItems, error: saleError } = await supabase
            .from("sale_item")
            .select(`
                quantity,
                sale:sale_id (
                    created_at
                )
            `)
            .eq('product_id', product_id)
            .not('sale', 'is', null);

        if (saleError) {
            console.error("Error fetching sales data:", saleError);
            return { 
                success: false, 
                error: saleError.message,
                min_stock_level: minThreshold 
            };
        }

        // If no sales data, return minimum threshold
        if (!saleItems || saleItems.length === 0) {
            return {
                success: true,
                min_stock_level: minThreshold,
                method: "default",
                message: "No sales history found, using minimum threshold",
                metrics: {
                    total_sales: 0,
                    days_analyzed: lookbackDays,
                    average_daily_sales: 0
                }
            };
        }

        // Transform data - handle sale as array and filter by date
        const salesData: SalesDataPoint[] = saleItems
            .filter(item => {
                // sale is an array, get the first element
                const saleRecord = Array.isArray(item.sale) ? item.sale[0] : item.sale;
                if (!saleRecord || !saleRecord.created_at) return false;
                
                // Filter by date range
                const saleDate = new Date(saleRecord.created_at);
                return saleDate >= lookbackDate;
            })
            .map(item => {
                // sale is an array, get the first element
                const saleRecord = Array.isArray(item.sale) ? item.sale[0] : item.sale;
                return {
                    quantity: item.quantity,
                    created_at: saleRecord.created_at
                };
            });

        // Calculate metrics
        const metrics = calculateSalesMetrics(salesData, lookbackDays);

        // Calculate minimum stock level using different methods
        const calculations = {
            velocity: calculateVelocityBased(metrics, leadTimeDays, safetyStockMultiplier),
            statistical: calculateStatisticalBased(salesData, leadTimeDays, safetyStockMultiplier),
            seasonal: seasonalAdjustment 
                ? calculateSeasonalBased(salesData, leadTimeDays, safetyStockMultiplier)
                : null,
            hybrid: 0
        };

        // Use hybrid approach (average of available methods)
        const availableMethods = Object.values(calculations).filter(v => v !== null && v > 0);
        calculations.hybrid = availableMethods.length > 0
            ? Math.round(availableMethods.reduce((a:any, b:any) => a + b, 0) / availableMethods.length)
            : minThreshold;

        // Ensure minimum threshold
        const recommendedLevel = Math.max(calculations.hybrid, minThreshold);

        return {
            success: true,
            min_stock_level: recommendedLevel,
            method: "hybrid",
            calculations,
            metrics: {
                total_sales: metrics.totalQuantity,
                days_analyzed: metrics.actualDaysWithSales,
                average_daily_sales: metrics.averageDailyDemand,
                peak_daily_sales: metrics.peakDailyDemand,
                std_deviation: metrics.standardDeviation,
                trend: metrics.trend
            },
            config: {
                lookback_days: lookbackDays,
                lead_time_days: leadTimeDays,
                safety_multiplier: safetyStockMultiplier,
                min_threshold: minThreshold
            }
        };

    } catch (error: any) {
        console.error("Error in AutoMinStockLevel:", error);
        return {
            success: false,
            error: error.message,
            min_stock_level: minThreshold
        };
    }
}

/**
 * Calculate comprehensive sales metrics
 */
function calculateSalesMetrics(salesData: SalesDataPoint[], lookbackDays: number) {
    // Total quantity sold
    const totalQuantity = salesData.reduce((sum, item) => sum + item.quantity, 0);

    // Group sales by day
    const dailySales = new Map<string, number>();
    salesData.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        dailySales.set(date, (dailySales.get(date) || 0) + item.quantity);
    });

    // Calculate daily demand statistics
    const dailyDemands = Array.from(dailySales.values());
    const actualDaysWithSales = dailyDemands.length;
    const averageDailyDemand = actualDaysWithSales > 0 
        ? totalQuantity / actualDaysWithSales 
        : 0;
    const peakDailyDemand = dailyDemands.length > 0 
        ? Math.max(...dailyDemands) 
        : 0;

    // Calculate standard deviation
    const variance = dailyDemands.reduce((sum, demand) => {
        return sum + Math.pow(demand - averageDailyDemand, 2);
    }, 0) / Math.max(dailyDemands.length - 1, 1);
    const standardDeviation = Math.sqrt(variance);

    // Calculate trend (simple linear regression)
    const trend = calculateTrend(Array.from(dailySales.entries()));

    return {
        totalQuantity,
        actualDaysWithSales,
        averageDailyDemand,
        peakDailyDemand,
        standardDeviation,
        trend,
        dailySales
    };
}

/**
 * Method 1: Velocity-based calculation
 * min_stock = (average_daily_sales × lead_time) × safety_multiplier
 */
function calculateVelocityBased(
    metrics: any,
    leadTimeDays: number,
    safetyMultiplier: number
): number {
    const baseStock = metrics.averageDailyDemand * leadTimeDays;
    return Math.round(baseStock * safetyMultiplier);
}

/**
 * Method 2: Statistical-based calculation
 * Accounts for demand variability using standard deviation
 * min_stock = (avg × lead_time) + (std_dev × √lead_time × z_score)
 */
function calculateStatisticalBased(
    salesData: SalesDataPoint[],
    leadTimeDays: number,
    safetyMultiplier: number
): number {
    const metrics = calculateSalesMetrics(salesData, 90);
    
    // Z-score for 95% service level ≈ 1.65
    const zScore = 1.65;
    
    const baseStock = metrics.averageDailyDemand * leadTimeDays;
    const safetyStock = metrics.standardDeviation * Math.sqrt(leadTimeDays) * zScore;
    
    return Math.round(baseStock + safetyStock);
}

/**
 * Method 3: Seasonal-based calculation
 * Considers recent trends and seasonality
 */
function calculateSeasonalBased(
    salesData: SalesDataPoint[],
    leadTimeDays: number,
    safetyMultiplier: number
): number {
    const metrics = calculateSalesMetrics(salesData, 90);
    
    // Weight recent sales more heavily
    const last30Days = salesData.filter(item => {
        const daysDiff = (new Date().getTime() - new Date(item.created_at).getTime()) 
            / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
    });

    const recent30DayMetrics = calculateSalesMetrics(last30Days, 30);
    
    // Blend recent and historical data (70% recent, 30% historical)
    const blendedAverage = (recent30DayMetrics.averageDailyDemand * 0.7) + 
                          (metrics.averageDailyDemand * 0.3);
    
    // Adjust for trend
    const trendAdjustment = metrics.trend === 'increasing' ? 1.2 : 
                           metrics.trend === 'decreasing' ? 0.8 : 1.0;
    
    const adjustedDemand = blendedAverage * trendAdjustment;
    const baseStock = adjustedDemand * leadTimeDays;
    
    return Math.round(baseStock * safetyMultiplier);
}

/**
 * Calculate sales trend
 */
function calculateTrend(dailySalesEntries: [string, number][]): 'increasing' | 'decreasing' | 'stable' {
    if (dailySalesEntries.length < 7) return 'stable';

    // Split into first and second half
    const midpoint = Math.floor(dailySalesEntries.length / 2);
    const firstHalf = dailySalesEntries.slice(0, midpoint);
    const secondHalf = dailySalesEntries.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, [, qty]) => sum + qty, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, [, qty]) => sum + qty, 0) / secondHalf.length;

    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (percentChange > 15) return 'increasing';
    if (percentChange < -15) return 'decreasing';
    return 'stable';
}

/**
 * Batch update minimum stock levels for all products
 */
export async function UpdateAllMinStockLevels(config?: MinStockConfig) {
    const supabase = await createSupabaseAdmin();

    try {
        // Get all products
        const { data: products, error: productsError } = await supabase
            .from('product')
            .select('product_id, product_name');

        if (productsError || !products) {
            return { 
                success: false, 
                error: productsError?.message || "No products found" 
            };
        }

        const results = [];
        
        for (const product of products) {
            const result = await AutoMinStockLevel(product.product_id, config);
            
            if (result.success) {
                // Update stock_alert table
                const { error: updateError } = await supabase
                    .from('stock_alert')
                    .upsert({
                        product_id: product.product_id,
                        min_stock_level: result.min_stock_level,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'product_id'
                    });

                results.push({
                    product_id: product.product_id,
                    product_name: product.product_name,
                    min_stock_level: result.min_stock_level,
                    metrics: result.metrics,
                    success: !updateError
                });
            }
        }

        return {
            success: true,
            updated_count: results.filter(r => r.success).length,
            total_count: products.length,
            results
        };

    } catch (error: any) {
        console.error("Error in UpdateAllMinStockLevels:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get minimum stock level recommendation without updating
 */
export async function GetMinStockRecommendation(
    product_id: string,
    config?: MinStockConfig
) {
    return await AutoMinStockLevel(product_id, config);
}