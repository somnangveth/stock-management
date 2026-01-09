"use server";
import { createSupabaseAdmin } from "@/lib/supbase/action";

export async function createVendor(data: Partial<{
  vendor_id: string;
  vendor_name: string;
  contact_person: string;
  phone_number1: string;
  phone_number2: string;
  vendor_email: string;
  vendor_image: string;
  source_link: string;
  vendor_type: 'local' | 'non-local';
  address: string;
  city: string;
  country: string;
  payment_terms: string;
  notes: string;
}>){
  try {
    const supabase = await createSupabaseAdmin();
    
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        contact_person: data.contact_person,
        phone_number1: data.phone_number1,
        phone_number2: data.phone_number2,
        vendor_email: data.vendor_email,
        vendor_image: data.vendor_image,
        source_link: data.source_link,
        vendortype: data.vendor_type,
        address: data.address,
        city: data.city,
        country: data.country,
        payment_terms: data.payment_terms,
        notes: data.notes
      })
      .select()
      .single();
    
    if(vendorError){
      console.error("Failed to insert vendor:", vendorError);
      return JSON.stringify({ error: { message: vendorError.message } });
    }
    
    return JSON.stringify({ data: vendorData });
    
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return JSON.stringify({ error: { message: error.message || "Unknown error occurred" } });
  }
}

//Update Suppliers Info
export async function updateVendor(
    vendor_id: string,
    data: Partial<{
        vendor_name: string;
        contact_person: string;
        phone_number1: string;
        phone_number2: string;
        vendor_email: string;
        vendor_image: string;
        source_link: string;
        vendor_type: 'local' | 'non-local';
        address: string;
        city: string;
        country: string;
        payment_terms: string;
        notes: string;
    }>
){
    const supabase = await createSupabaseAdmin();

try{
        const {data: vendorData, error: vendorError} = await supabase
    .from('vendors')
    .update({
        vendor_id: vendor_id,
        vendor_name: data.vendor_name,
        contact_person: data.contact_person,
        phone_number1: data.phone_number1,
        phone_number2: data.phone_number2,
        vendor_email: data.vendor_email,
        vendor_image: data.vendor_image,
        source_link: data.source_link,
        vendor_type: data.vendor_type,
        address: data.address,
        city: data.city,
        country: data.country,
        payment_terms: data.payment_terms,
        notes: data.notes,
    })
    .eq('vendor_id', vendor_id)
    .single();

    if(!vendor_id){
        console.log("Vendor ID not found");
    }

    if(vendorError || !vendorData){
        console.error("Failed to update vendor data", vendorError);
        return JSON.stringify(
            {
                error: "Failed to update vendor data",
            }
        )
    }

    return vendorData;
}catch(error){
console.log('failed to update vendor data', error);
}

}

//Delete Suppliers
export async function deleteVendor(vendor_id: string){
    const supabase = await createSupabaseAdmin();

try{
    const {data: vendorData, error: vendorError} = await supabase
    .from("vendors")
    .delete()
    .eq('vendor_id', vendor_id)
    .single();

    if(!vendor_id){
        console.log("Vendor ID not found");
    }

    if(vendorError || !vendorData){
        console.error("Failed to delete vendors", vendorError);
    }

    return vendorData;
}catch(error){
    console.error("failed to delete vendor", error);
}
}

//Fetch all Suppliers
export async function fetchVendors(){
    const supabase = await createSupabaseAdmin();

    const { data: vendorData, error: vendorError } = await supabase
    .from("vendors")
    .select("*");

    if(vendorError || !vendorData){
        console.error("Failed to fetch vendor datas", vendorError);
        return JSON.stringify({
            error: "Failed to fetch Vendors data",
        })
    }

    return vendorData;
}