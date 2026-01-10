// app/api/admin/apriori/route.ts
import { NextResponse } from "next/server";
import { runAprioriAnalysis } from "../../../functions/admin/apriori/apriori";

export async function GET(request: Request) {
  try {
    // Get query parameters for custom thresholds
    const { searchParams } = new URL(request.url);
    const minSupport = parseFloat(searchParams.get("minSupport") || "0.05");
    const minConfidence = parseFloat(searchParams.get("minConfidence") || "0.3");

    // Run Apriori analysis
    const result = await runAprioriAnalysis(minSupport, minConfidence);

    return NextResponse.json(result, { status: 200 });
    
  } catch (error: any) {
    console.error("Apriori API Error:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to run Apriori analysis",
        itemsets: [],
        rules: [],
        stats: { totalTransactions: 0 }
      },
      { status: 500 }
    );
  }
}