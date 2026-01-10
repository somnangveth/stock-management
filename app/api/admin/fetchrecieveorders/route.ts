import { fetchReceiveOrders } from "@/app/admin/purchase/action/recieve";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await fetchReceiveOrders();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Failed to fetch receive orders", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
