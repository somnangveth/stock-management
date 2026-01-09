import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, UserRole } from "./roles";

export async function verifyAuth(request: NextRequest){
    try{
        const user = await getCurrentUser();

        if(!user){
            return{
                authorized: false,
                response: NextResponse.json(
                    {error: 'Unauthorized - No active session'},
                    {status: 401}
                )
            };
        }

        return{
            authorized: true,
            user,
        };
    }catch(error){
        return {
            authorized: false,
            response: NextResponse.json(
                {error: 'Authentication error'},
                {status: 500}
            )
        };
    }
}

export async function verifyRoleAuth(request: NextRequest, allowedRoles: UserRole[]){
    const auth = await verifyAuth(request);

    if(!auth.authorized){
        return auth;
    }

    if (!auth.user?.role || !allowedRoles.includes(auth.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `Forbidden - ${allowedRoles.join(' or ')} access required` },
        { status: 403 }
      )
    };
  }
  return {
    authorized: true,
    user: auth.user,
    role: auth.user.role
  };
}

export async function verifyAdminAuth(request: NextRequest){
    return verifyRoleAuth(request, ['admin']);
}

export async function verifyStaffAuth(request: NextRequest){
    return verifyRoleAuth(request, ['staff']);
}

export async function verifyAdminOrStaffAuth(request: NextRequest){
    return verifyRoleAuth(request, ['admin', 'staff']);
}