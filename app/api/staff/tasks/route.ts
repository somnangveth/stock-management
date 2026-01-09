import { verifyAdminOrStaffAuth } from "@/lib/auth/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
    const auth = await verifyAdminOrStaffAuth(request);

    if(!auth.authorized){
        return NextResponse.json(
            {error: 'Unauthorized'},
            {status: 403},
        )
    }

    return NextResponse.json({ 
    message: "Staff data",
    user: auth.user,
    role: auth.user?.role,
  });
}