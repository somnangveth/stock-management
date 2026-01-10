// functions/admin/apriori.ts
const Apriori = require("apriori");
import { createSupabaseAdmin } from "@/lib/supbase/action";

/**
 * Fetch all sales transactions with product names
 * Returns an array of transactions where each transaction is an array of product names
 */
export async function fetchSalesTransactions() {
  const supabase = await createSupabaseAdmin();
  
  // Fetch sale_items with product information joined
  const { data, error } = await supabase
    .from("sale_items")
    .select(`
      sale_id,
      product_id,
      products!product_id (
        product_name,
        sku_code
      )
    `)
    .order("sale_id");

  if (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("No sale items found");
  }

  // Group items by sale_id into transactions
  const transactions: Record<string, string[]> = {};
  
  data.forEach((item: any) => {
    if (!item.sale_id || !item.products) return;
    
    const saleId = String(item.sale_id);
    // Handle both array and object responses from Supabase
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const productName = product?.product_name || `Product ${item.product_id}`;
    
    if (!transactions[saleId]) {
      transactions[saleId] = [];
    }
    
    // Add product name to transaction (avoid duplicates)
    if (!transactions[saleId].includes(productName)) {
      transactions[saleId].push(productName);
    }
  });

  // Convert to array of transactions
  const transactionArray = Object.values(transactions);
  
  console.log(`Total transactions: ${transactionArray.length}`);
  console.log(`Total unique products: ${new Set(
    data.map((d: any) => {
      const product = Array.isArray(d.products) ? d.products[0] : d.products;
      return product?.product_name;
    }).filter(Boolean)
  ).size}`);
  
  return transactionArray;
}

/**
 * Run Apriori algorithm on all sales data
 * @param minSupport - Minimum support threshold (default: 0.05 = 5%)
 * @param minConfidence - Minimum confidence threshold (default: 0.3 = 30%)
 * @returns Frequent itemsets and association rules
 */
export async function runAprioriAnalysis(
  minSupport: number = 0.05,
  minConfidence: number = 0.3
) {
  try {
    // Fetch all sales transactions
    const transactions = await fetchSalesTransactions();
    
    if (!transactions.length) {
      return {
        itemsets: [],
        rules: [],
        stats: {
          totalTransactions: 0,
          uniqueProducts: 0,
          minSupport,
          minConfidence
        }
      };
    }

    // Calculate statistics
    const uniqueProducts = new Set(transactions.flat());
    const stats = {
      totalTransactions: transactions.length,
      uniqueProducts: uniqueProducts.size,
      minSupport,
      minConfidence,
      avgItemsPerTransaction: (
        transactions.reduce((sum, t) => sum + t.length, 0) / transactions.length
      ).toFixed(2)
    };

    console.log("Running Apriori with:", stats);

    // Initialize Apriori algorithm
    const apriori = new Apriori.Algorithm(minSupport, minConfidence, true);
    
    // Analyze transactions
    const result = await apriori.analyze(transactions);

    console.log("Apriori result structure:", JSON.stringify(result, null, 2));

    // Format itemsets - the library returns frequentItemSets as an object with keys by size
    const itemsets: any[] = [];
    if (result.frequentItemSets) {
      Object.values(result.frequentItemSets).forEach((itemsetArray: any) => {
        if (Array.isArray(itemsetArray)) {
          itemsetArray.forEach((itemset: any) => {
            itemsets.push({
              items: itemset.itemSet || itemset.items,
              support: itemset.support
            });
          });
        }
      });
    }

    // Format association rules
    const rules = (result.associationRules || []).map((rule: any) => ({
      lhs: rule.lhs,
      rhs: rule.rhs,
      confidence: rule.confidence,
      lift: rule.lift || 0
    }));

    // Sort by support/confidence
    itemsets.sort((a: any, b: any) => b.support - a.support);
    rules.sort((a: any, b: any) => b.confidence - a.confidence);

    console.log(`Found ${itemsets.length} frequent itemsets`);
    console.log(`Found ${rules.length} association rules`);

    return {
      itemsets,
      rules,
      stats
    };
    
  } catch (error) {
    console.error("Error running Apriori analysis:", error);
    throw error;
  }
}

/**
 * Get top product combinations (most frequent itemsets)
 * @param limit - Number of top combinations to return
 */
export async function getTopProductCombinations(limit: number = 10) {
  const result = await runAprioriAnalysis();
  
  // Filter itemsets with 2+ items and get top ones
  const combinations = result.itemsets
    .filter((itemset: any) => itemset.items.length >= 2)
    .slice(0, limit);
    
  return combinations;
}

/**
 * Get recommendations for a specific product
 * @param productName - Name of the product to get recommendations for
 * @param minConfidence - Minimum confidence threshold
 */
export async function getProductRecommendations(
  productName: string,
  minConfidence: number = 0.3
) {
  const result = await runAprioriAnalysis(0.05, minConfidence);
  
  // Find rules where the product is on the left-hand side
  const recommendations = result.rules
    .filter((rule: any) => 
      rule.lhs.includes(productName) && 
      rule.confidence >= minConfidence
    )
    .map((rule: any) => ({
      products: rule.rhs,
      confidence: rule.confidence,
      lift: rule.lift
    }))
    .sort((a: any, b: any) => b.confidence - a.confidence);
    
  return recommendations;
}

/**
 * Analyze sales patterns by time period
 * @param startDate - Start date for analysis
 * @param endDate - End date for analysis
 */
export async function analyzeByTimePeriod(
  startDate?: string,
  endDate?: string,
  minSupport: number = 0.05
) {
  const supabase = await createSupabaseAdmin();
  
  let query = supabase
    .from("sale_items")
    .select(`
      sale_id,
      product_id,
      products!product_id (product_name),
      sales!sale_id (sale_date)
    `);
    
  if (startDate) {
    query = query.gte("sales.sale_date", startDate);
  }
  if (endDate) {
    query = query.lte("sales.sale_date", endDate);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  if (!data || data.length === 0) {
    return { itemsets: [], rules: [], stats: { totalTransactions: 0 } };
  }

  // Group by sale_id
  const transactions: Record<string, string[]> = {};
  data.forEach((item: any) => {
    if (!item.sale_id || !item.products) return;
    const saleId = String(item.sale_id);
    if (!transactions[saleId]) {
      transactions[saleId] = [];
    }
    const product = Array.isArray(item.products) ? item.products[0] : item.products;
    const productName = product?.product_name;
    if (productName && !transactions[saleId].includes(productName)) {
      transactions[saleId].push(productName);
    }
  });

  const transactionArray = Object.values(transactions);
  
  if (!transactionArray.length) {
    return { itemsets: [], rules: [], stats: { totalTransactions: 0 } };
  }

  const apriori = new Apriori.Algorithm(minSupport, 0.3, true);
  const result = await apriori.analyze(transactionArray);

  // Format itemsets from frequentItemSets object
  const itemsets: any[] = [];
  if (result.frequentItemSets) {
    Object.values(result.frequentItemSets).forEach((itemsetArray: any) => {
      if (Array.isArray(itemsetArray)) {
        itemsetArray.forEach((itemset: any) => {
          itemsets.push({
            items: itemset.itemSet || itemset.items,
            support: itemset.support
          });
        });
      }
    });
  }

  return {
    itemsets,
    rules: (result.associationRules || []).map((r: any) => ({
      lhs: r.lhs,
      rhs: r.rhs,
      confidence: r.confidence,
      lift: r.lift || 0
    })),
    stats: {
      totalTransactions: transactionArray.length,
      startDate,
      endDate
    }
  };
}