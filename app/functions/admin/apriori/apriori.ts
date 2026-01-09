const  Apriori  = require("apriori");
import { createSupabaseAdmin } from "@/lib/supbase/action";

export async function fetchSales() {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("sale_items")
    .select("sale_id, product_id");

  if (error) throw error;

  const transactions: Record<string, string[]> = {};

  data.forEach(item => {
    if (!item.sale_id || !item.product_id) return;

    if (!transactions[item.sale_id]) {
      transactions[item.sale_id] = [];
    }

    transactions[item.sale_id].push(item.product_id);
  });

  return Object.values(transactions);
}

export async function runApriori() {
  const transactions = await fetchSales();

  if (!transactions.length) {
    throw new Error("No transactions found");
  }

  const apriori = new Apriori.Algorithm(0.1);
  const result = await apriori.analyze(transactions);

  return result;
}