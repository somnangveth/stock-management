"use server";

import { createSupabaseServerClient } from "@/lib/supbase/action";

export async function addCategoryStaff(data:{
    category_name: string;
    slug: string;
}){
    const supabase = await createSupabaseServerClient();

    try{
        const {data: categoryData, error: categoryError} = await supabase
        .from("category")
        .insert({
            category_name: data.category_name,
            slug: data.slug,
        });

        if(categoryError){
            console.error("Failed to insert category data", categoryError.message);
        }

        return categoryData;
    }catch(error){
        throw error;
    }
}