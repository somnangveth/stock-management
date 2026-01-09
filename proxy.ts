"use server";

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "./lib/auth/roles";

export async function proxy(request: NextRequest){
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
            getAll(){
                return request.cookies.getAll()
            },
            setAll(cookiesToSet){
                cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value))
                supabaseResponse = NextResponse.next({
                    request,
                })
                cookiesToSet.forEach(({name, value, options})=>
                    supabaseResponse.cookies.set(name,value,options)
                )
            },
        },
      }
    )

    //Refresh Session
    const {data: {session}} = await supabase.auth.getSession();
    const {data: {user}} = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isApiRoute = path.startsWith('/api');
    const role = user?.user_metadata?.role as UserRole | undefined;

    if(path.startsWith('/auth') || path === '/'){
        if(session && role){
            if(path === '/auth' || path === '/'){
                const dashboardUrl = role === 'admin' ? '/admin' : '/staff';
                return NextResponse.redirect(new URL(dashboardUrl, request.url));
            }
        }

        return supabaseResponse;
    }

    if(!session || !user){
        if(isApiRoute){
            return NextResponse.json(
                {error: 'Unauthorized - Auth session missing'},
                {status: 401}
            )
        }

        const redirectUrl = new URL('/auth', request.url);
        redirectUrl.searchParams.set('redirectedFrom',path);
        return NextResponse.redirect(redirectUrl);
    }

    //Role-based protection for pages
    if(path.startsWith('/admin')){
        if(role !== 'admin'){
            if(isApiRoute){
                return NextResponse.json(
                    {error: 'Forbidden - Admin access required'},
                    {status: 403},
                )
            }

            //redirect staff to their dashboard
            return NextResponse.redirect(new URL('/staff', request.url));
        }
    }

    if(path.startsWith('/staff')){
        if(role !== 'staff' && role !== 'admin'){
            if(isApiRoute){
                return NextResponse.json(
                    {error: 'Forbidden - Staff or Admin required'},
                    {status: 403}
                )
            }

            return NextResponse.redirect(new URL('/auth', request.url));
        }
    }

    //API route protection
    if(path.startsWith('/api/admin')){
        if(role !== 'admin'){
            return NextResponse.json(
                {error: 'Forbidden - Staff or Admin access required'},
                {status: 403}
            )
        }
    }

    if(path.startsWith('/api/staff')){
        if(role !== 'staff' && role !== 'admin'){
            return NextResponse.json(
                {error: 'Forbidden - Staff or Admin access required'},
                {status: 403}
            )
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/staff/:path*',
        '/api/staff/:path*',
        '/api/admin/:path*',
        '/auth',
        '/',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}