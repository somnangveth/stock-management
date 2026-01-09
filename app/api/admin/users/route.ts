import { verifyAdminAuth } from "@/lib/auth/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
    const auth = await verifyAdminAuth(request);

    if(!auth.authorized){
        return NextResponse.json(
            {error: 'Unauthorized'},
            {status: 403}
        )
    }

    return NextResponse.json({
        message: 'Admin data',
        user: auth.user
    });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  
  if (!auth.authorized) {
    return NextResponse.json(
        {error: 'Unauthorized'},
        {status: 403},
    )
  }

  const body = await request.json();
  
  return NextResponse.json({ 
    success: true,
    message: "Created by admin"
  });
}