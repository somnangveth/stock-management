"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";
type AttributeProps = {
  attribute_name: string[];
  module: string;
}

export async function addNewAttribute(attribute: AttributeProps[]) {
  const supabase = await createSupabaseAdmin();

  try {
    const allInsertedData = [];
    const errors = [];

    for (const data of attribute) {
      // Insert each attribute name individually for this module
      for (const name of data.attribute_name) {
        const { data: attributeData, error: attributeError } = await supabase
          .from("attribute")
          .insert({
            attribute_name: name,  // Fixed typo: was "attibute_name"
            module: data.module
          })
          .select();  // Added .select() to return the inserted data

        if (attributeError) {
          console.error(`Failed to insert attribute "${name}" for module "${data.module}": ${attributeError.message}`);
          errors.push({
            name,
            module: data.module,
            error: attributeError.message
          });
        } else {
          allInsertedData.push(attributeData);
        }
      }
    }

    // If there were any errors, throw them
    if (errors.length > 0) {
      throw new Error(`Failed to insert ${errors.length} attribute(s): ${JSON.stringify(errors)}`);
    }

    return allInsertedData;
  } catch (error) {
    console.error("Error in addNewAttribute:", error);
    throw error;
  }
}

export async function deleteProductAttributes(productId: string) {
  const supabase = await createSupabaseAdmin();
  
  try {
    // First, get all sale_price records for this product
    const { data: salePrices, error: fetchError } = await supabase
      .from("sale_price")
      .select("price_id")
      .eq("product_id", productId);

    if (fetchError) {
      throw new Error(`Failed to fetch sale prices: ${fetchError.message}`);
    }

    if (salePrices && salePrices.length > 0) {
      const salePriceIds = salePrices.map(sp => sp.price_id);

      // Delete import prices linked to these sale prices
      const { error: importDeleteError } = await supabase
        .from("import_price")
        .delete()
        .in("sale_price_id", salePriceIds);

      if (importDeleteError) {
        throw new Error(`Failed to delete import prices: ${importDeleteError.message}`);
      }
    }

    // Delete sale prices for this product
    const { error: saleDeleteError } = await supabase
      .from("sale_price")
      .delete()
      .eq("product_id", productId);

    if (saleDeleteError) {
      throw new Error(`Failed to delete sale prices: ${saleDeleteError.message}`);
    }

    return { success: true, message: "All attributes deleted successfully" };
  } catch (error) {
    console.error("Error in deleteProductAttributes:", error);
    throw error;
  }
}

export async function createSalePrice(data: {
  product_id: string;
  attribute_name: string;
  module: string;
  attribute_value: number;
  price_value: number;
}) {
  const supabase = await createSupabaseAdmin();
  
  try {
    const { data: salePriceData, error: salePriceError } = await supabase
      .from("sale_price")
      .insert({
        product_id: data.product_id,
        attribute_id: `${data.module}_${data.attribute_name.toLowerCase().replace(/\s+/g, '_')}`, // Generate unique attribute_id
        attribute_value: data.attribute_value,
        price_value: data.price_value
      })
      .select()
      .single();

    if (salePriceError) {
      throw new Error(`Failed to create sale price: ${salePriceError.message}`);
    }

    // Also create or update the attribute in the attribute table
    const { error: attributeError } = await supabase
      .from("attribute")
      .upsert({
        attribute_id: `${data.module}_${data.attribute_name.toLowerCase().replace(/\s+/g, '_')}`,
        attribute_name: data.attribute_name,
        module: data.module
      }, {
        onConflict: 'attribute_id'
      });

    if (attributeError) {
      console.warn("Failed to upsert attribute:", attributeError.message);
      // Don't throw error here as sale_price is already created
    }

    return salePriceData;
  } catch (error) {
    console.error("Error in createSalePrice:", error);
    throw error;
  }
}

export async function createImportPrice(data: {
  sale_price_id: string;
  price_value: number;
  price_variance: number;
}) {
  const supabase = await createSupabaseAdmin();
  
  try {
    const { data: importPriceData, error: importPriceError } = await supabase
      .from("import_price")
      .insert({
        sale_price_id: data.sale_price_id,
        price_value: data.price_value,
        price_variance: data.price_variance
      })
      .select()
      .single();

    if (importPriceError) {
      throw new Error(`Failed to create import price: ${importPriceError.message}`);
    }

    return importPriceData;
  } catch (error) {
    console.error("Error in createImportPrice:", error);
    throw error;
  }
}

// Combined function to update all product attributes at once
export async function updateProductAttributes(
  productId: string,
  attributes: Array<{
    attribute_name: string;
    module: string;
    quantity: number;
    import_price: number;
    sale_price: number;
  }>
) {
  const supabase = await createSupabaseAdmin();
  
  try {
    // Step 1: Delete existing attributes
    await deleteProductAttributes(productId);

    // Step 2: Insert new attributes
    const results = [];
    
    for (const attr of attributes) {
      // Create attribute_id
      const attributeId = `${attr.module}_${attr.attribute_name.toLowerCase().replace(/\s+/g, '_')}`;

      // Create/update attribute definition
      const { error: attributeError } = await supabase
        .from("attribute")
        .upsert({
          attribute_id: attributeId,
          attribute_name: attr.attribute_name,
          module: attr.module
        }, {
          onConflict: 'attribute_id'
        });

      if (attributeError) {
        console.warn(`Failed to upsert attribute ${attr.attribute_name}:`, attributeError.message);
      }

      // Create sale price
      const { data: salePriceData, error: salePriceError } = await supabase
        .from("sale_price")
        .insert({
          product_id: productId,
          attribute_id: attributeId,
          attribute_value: attr.quantity,
          price_value: attr.sale_price
        })
        .select()
        .single();

      if (salePriceError) {
        throw new Error(`Failed to create sale price for ${attr.attribute_name}: ${salePriceError.message}`);
      }

      // Create import price
      const { data: importPriceData, error: importPriceError } = await supabase
        .from("import_price")
        .insert({
          sale_price_id: salePriceData.price_id,
          price_value: attr.import_price,
          price_variance: attr.sale_price - attr.import_price
        })
        .select()
        .single();

      if (importPriceError) {
        throw new Error(`Failed to create import price for ${attr.attribute_name}: ${importPriceError.message}`);
      }

      results.push({
        attribute: attr.attribute_name,
        sale_price: salePriceData,
        import_price: importPriceData
      });
    }

    return {
      success: true,
      message: `Successfully updated ${results.length} attribute(s)`,
      data: results
    };
  } catch (error) {
    console.error("Error in updateProductAttributes:", error);
    throw error;
  }
}
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