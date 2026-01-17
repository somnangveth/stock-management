"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";
import { getCategoryDescendants } from "@/type/producttype";


export async function fetchCategory() {
  const supabase = await createSupabaseAdmin();
  
  try {
    const { data: categories, error } = await supabase
      .from("category")
      .select("*")
      .order("category_name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return categories;
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

export async function createNewCategory(data: {
  category_name: string;
  parent_id?: string | null;
}) {
  const supabase = await createSupabaseAdmin();
  
  try {
    // Validate parent exists if provided
    if (data.parent_id) {
      const { data: parent, error: parentError } = await supabase
        .from("category")
        .select("category_id")
        .eq("category_id", data.parent_id)
        .single();

      if (parentError || !parent) {
        throw new Error("Parent category does not exist");
      }
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from("category")
      .insert({
        category_name: data.category_name,
        parent_id: data.parent_id || null,
      })
      .select()
      .single();

    if (categoryError) {
      throw new Error(`Failed to insert category: ${categoryError.message}`);
    }

    return categoryData;
  } catch (error: any) {
    console.error("Error creating category:", error);
    throw error;
  }
}

export async function updateCategory(
  categoryId: string,
  data: {
    category_name?: string;
    slug?: string;
    parent_id?: string | null;
  }
) {
  const supabase = await createSupabaseAdmin();
  
  try {
    // Validate category exists
    const { data: existingCategory, error: fetchError } = await supabase
      .from("category")
      .select("*")
      .eq("category_id", categoryId)
      .single();

    if (fetchError || !existingCategory) {
      throw new Error("Category not found");
    }

    // Prevent circular reference if parent_id is being updated
    if (data.parent_id !== undefined) {
      // Category cannot be its own parent
      if (data.parent_id === categoryId) {
        throw new Error("Category cannot be its own parent");
      }

      // Category cannot have its descendants as parent
      if (data.parent_id) {
        const allCategories = await fetchCategory();
        const descendants = getCategoryDescendants(categoryId, allCategories);
        
        if (descendants.includes(data.parent_id)) {
          throw new Error("Cannot set a descendant category as parent (circular reference)");
        }

        // Validate parent exists
        const { data: parent, error: parentError } = await supabase
          .from("category")
          .select("category_id")
          .eq("category_id", data.parent_id)
          .single();

        if (parentError || !parent) {
          throw new Error("Parent category does not exist");
        }
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (data.category_name !== undefined) updateData.category_name = data.category_name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.parent_id !== undefined) updateData.parent_id = data.parent_id || null;

    // Perform update
    const { data: categoryData, error: updateError } = await supabase
      .from("category")
      .update(updateData)
      .eq("category_id", categoryId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update category: ${updateError.message}`);
    }

    return categoryData;
  } catch (error: any) {
    console.error("Error updating category:", error);
    throw error;
  }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createSupabaseAdmin();
  
  try {
    const { error } = await supabase
      .from("category")
      .delete()
      .eq("category_id", categoryId);

    if (error) {
      throw new Error(`Failed to delete category: ${error.message}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    throw error;
  }
}
