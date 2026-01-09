'use server';
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { revalidatePath } from "next/cache";


//Add Subcategory
export async function addSubcategory(data: {
  subcategory_name: string;
  category_id: string;
}){
  try{
    const supabase = await createSupabaseAdmin();
    const {data: categoryExists, error: categoryError } = await supabase
      .from('category')
      .select('category_id')
      .eq('category_id', data.category_id)
      .single();
      
    if(categoryError || !categoryExists){
      return JSON.stringify({
        error: "Category not found"
      });
    }
    
    //Check if subcategory already exists in this category
    const {data: existingSubcategory} = await supabase
      .from('subcategory')
      .select('subcategory_id')
      .eq('category_id', data.category_id)
      .eq('subcategory_name', data.subcategory_name.trim())
      .maybeSingle();
      
    if(existingSubcategory){
      return JSON.stringify({
        error: "Subcategory already exists in this category"
      });
    }
    
    //Insert subcategory
    const { data: subcategoryData, error: subcategoryError } = await supabase
      .from('subcategory')
      .insert({
        subcategory_name: data.subcategory_name.trim(),
        category_id: data.category_id
      })
      .select()
      .single();
      
    if(subcategoryError){
      console.error('Failed to insert subcategory data', subcategoryError);
      return JSON.stringify({
        error: 'Failed to create subcategory'
      });
    }
    
    revalidatePath('/admin/categories');
    
    // ADD THIS RETURN STATEMENT
    return JSON.stringify({
      success: true,
      data: subcategoryData
    });
    
  }catch(error){
    console.error('Error creating subcategory: ', error);
    return JSON.stringify({
      error: "Failed to create subcategory"
    });
  }
}


//Update subcategory
export async function updateSubcategory(
    subcategory_id: string,
    data: Partial <{
        subcategory_name: string;
        category_id: string;
    }>
){
    try{
        const supabase = await createSupabaseAdmin();

        //If category_id is being updated , check if it exists
        if(data.category_id){
            const {data: categoryExists, error: categoryError} = await supabase
            .from('category')
            .select('category_id')
            .eq('category_id', data.category_id)
            .single();

            if(categoryError || !categoryExists){
                return JSON.stringify({
                    error: "Category not found"
                })
            }
        }

        const updateData: any = {};

        if(data.subcategory_name) updateData.subcategory_name = data.subcategory_name.trim();
        if(data.category_id) updateData.category_id = data.category_id;

        const {data: subcategoryData, error: subcategoryError} = await supabase
        .from('subcategory')
        .update(updateData)
        .eq("subcategory_id", subcategory_id)
        .select()
        .single();

        if(subcategoryError){
            console.error('Failed to update subcategory data', subcategoryError);
            return JSON.stringify({
                error: "Failed to update subcategory"
            });
        }

        revalidatePath('/admin/categories');

        return JSON.stringify({
            success: true,
            subcategory: subcategoryData
        });
    }catch(error){
        console.error('Error updating subcategory: ', error);
        return JSON.stringify({
            error: "Failed to update subcategory"
        });
    }
}

//Delete Subcategory
export async function deleteSubcategory(subcategory_id: string){
    try{
        const supabase = await createSupabaseAdmin();

        //Check if subcategory has associated products
        const {data: productsExist, error: checkError} = await supabase
        .from('products')
        .select('product_id')
        .eq('subcategory_id', subcategory_id)
        .limit(1);

        if(checkError){
            console.error("Error checking products: ", checkError);
        }

        if(productsExist && productsExist.length > 0){
            return JSON.stringify({
                error: "Cannot delete subcategory with existing products"
            });
        }

        const {data: subcategoryData, error: subcategoryError} = await supabase
        .from('subcategory')
        .delete()
        .eq('subcategory_id', subcategory_id)
        .select()
        .single();

        if(subcategoryError){
            console.error("Failed to delete subcategory data: ", subcategoryError);
            return JSON.stringify({
                error: "Failed to delete subcategory"
            });
        }

        revalidatePath('/admin/categories');

        return JSON.stringify({
            success: true,
            subcategory: subcategoryData
        })
    }catch(error){
        console.error('Error deleting subcategory: ', error);
        return JSON.stringify({
            error: "Failed to delete subcategory"
        })
    }
}

//Fetch all Subcategories
export async function fetchSubcategory(){
    try{
        const supabase = await createSupabaseAdmin();

        const {data: subcategoryData, error: subcategoryError} = await supabase
        .from('subcategory')
        .select(`
            *,
            category: category_id(
            category_id,
            category_name
            )
        `)
        .order('subcategory', {ascending: true});

        if(subcategoryError){
            console.error('Faield to fetch subcategory', subcategoryError);
            return null;
        }

        return subcategoryData;
    }catch(error){
        console.error('Error fetching subcategories: ', error);
        return null;
    }
}


//Fetch Subcategories by Categories
export async function fetchSubcategoriesByCategory(category_id: string){
    try{
        const supabase = await createSupabaseAdmin();

        const {data: subcategoryData, error: subcategoryError} = await supabase
        .from('subcategory')
        .select('*')
        .eq('category_id', category_id)
        .order('subcategory_name', {ascending: true});

        if(subcategoryError){
            console.error('Failed to fetch subcategories by category', subcategoryError);
            return null;
        }

        return subcategoryData;
    }catch(error){
        console.error('Error fetching subcategories by categories: ', error);
        return null;
    }
}