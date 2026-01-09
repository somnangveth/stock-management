"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";


//Fetch datas from attribute table
export async function fetchAttributes() {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("attribute")
    .select("*");

  if (error) {
    console.error("Failed to fetch attribute", error);
    throw error;
  }

  return data;
}

//Fetch Datas from Product Attribute table
export async function fetchProductAttribute(){
  const supabase = await createSupabaseAdmin();

  const {data, error} = await supabase
  .from("product_attribute")
  .select("*");

  if(error){
    console.error("Failed to fetch product attribute data");
    throw error;
  }

  return data;
}

export async function UpdateAttributeValue(
  data: Array<{
    product_attribute_id: string;
    value?: string;
  }>
) {
  const supabase = await createSupabaseAdmin();
  
  try {
    const { data: attributeData, error: attributeError } = await supabase
      .from("product_attribute")
      .upsert(data, {
        onConflict: "product_attribute_id",
      })
      .select();
    
    if (attributeError) {
      console.error("Failed to update product attribute value:", attributeError);
      throw new Error(`Error updating product attribute value: ${attributeError.message}`);
    }
    
    return attributeData;
  } catch (error) {
    console.error("UpdateAttributeValue error:", error);
    throw error;
  }
}