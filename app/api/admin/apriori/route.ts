import { NextResponse } from "next/server";
import { runApriori} from "@/app/functions/admin/apriori/apriori";

export async function GET() {
  try {
    const result = await runApriori();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Apriori error:", error);

    return NextResponse.json(
      {
        error: "Failed to run Apriori",
        details: error.message ?? error,
      },
      { status: 500 }
    );
  }
}
