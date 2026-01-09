import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supbase/action";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseAdmin();

  // List all users
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data.users);
}
