// app/api/fetchUsers/route.ts
import { getLoggedInUser } from "@/app/auth/actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getLoggedInUser();

    if (!user) {
      // Not logged in
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
