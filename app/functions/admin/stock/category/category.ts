'use server';

import { createSupabaseAdmin } from "@/lib/supbase/action";


//Add Category
export async function addCategory(data: {
    category_name: string;
    slug: string;
}){
    const supabase = await createSupabaseAdmin();

    const {data: categoryData, error: categoryError} = await supabase
    .from('category')
    .insert({
        category_name: data.category_name,
        slug: data.slug,
    })
    .single();

    if(categoryError){
        console.error("Failed to insert into category", categoryError);
    }

    return categoryData;
}

//Update Category
export async function updateCategory(
    category_id: string,
    data: Partial<{
        category_name: string;
        slug: string;
    }>
){
    const supabase = await createSupabaseAdmin();

    const {data: categoryData, error: categoryError } = await supabase
    .from('category')
    .update({
        category_name: data.category_name,
        slug: data.slug,
    })
    .eq('category_id', category_id)
    .single();

    if(categoryError){
        console.error('Failed to update category data: ', categoryError);
    }

    return categoryData;
}

//Delete Category
export async function deleteCategory(category_id: string){
    const supabase = await createSupabaseAdmin();

    const { data: categoryData, error: categoryError } = await supabase
    .from('category')
    .delete()
    .eq('category_id', category_id)
    .single();

    if(categoryError){
        console.error('Failed to delete category data', categoryError);
    }

    return categoryData;
}

//Fetch All Category
export async function fetchCategory(){
    const supabase = await createSupabaseAdmin();

    const { data: categoryData, error: categoryError } = await supabase
    .from('category')
    .select('*');

    if(categoryError){
        console.error('Failed to fetch category datas', categoryError);
    }

    return categoryData;
}

