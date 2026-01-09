"use server";
import { checkPermission } from "@/lib/permission/checkpermission";
import { createSupabaseServerClient } from "@/lib/supbase/action";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        console.log("API Route checking: Route Checking permission...");

        const hasPermission = await checkPermission('category.view');

        console.log("API Permission Rresult: ", hasPermission);

        if(!hasPermission){
            console.log("Permission denied, returning 403");
            return NextResponse.json(
                {error: "Unauthorized: Missing category.view permission"},
                {status: 403}
            )
        }
        console.log("Permission Granted, fetching category....");

        const supabase = await createSupabaseServerClient();

        const {data, error} = await supabase
        .from("category")
        .select("*")
        .order('category_id', {ascending: true});

        console.log("Category query result: ",
        {
            error: error?.message,
            count: data?.length ,
        });

        if(error){
            console.log('Database error', error);
            return NextResponse.json({error: error.message}, {status: 500});
        }

        console.log('✅ Returning category successfully');
        return NextResponse.json({ data, error: null });
    }catch(error){

    console.error('❌ API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    }
}