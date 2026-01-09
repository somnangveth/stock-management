"use client";

import { UserRole } from "@/lib/auth/roles";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getLoggedInUser } from "../auth/actions";

export function ProtectedComponent({requiredRoles}: {requiredRoles: UserRole[]}){
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function checkAuth(){
            const user = await getLoggedInUser();

            if(!user || !user.role || !requiredRoles.includes(user.role as UserRole)){
                router.push('/auth');
                return;
            }

            setAuthorized(true);
        }

        checkAuth();
    },[requiredRoles, router]);

    if(!authorized){
        return <div>Loading...</div>
    }
    return <div>Protected Content</div>
}