"use server";
import { createSupabaseAdmin } from "@/lib/supbase/action";
import { revalidatePath } from "next/cache";

// ✅ 创建供应商
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
    
    // 验证必填字段
    if (!data.vendor_id) {
      console.error("Vendor ID is required");
      return {
        success: false,
        error: "Vendor ID is required"
      };
    }

    // 检查 vendor_id 是否已存在
    const { data: existingVendor } = await supabase
      .from("vendors")
      .select("vendor_id")
      .eq("vendor_id", data.vendor_id)
      .single();

    if (existingVendor) {
      console.error("Vendor ID already exists:", data.vendor_id);
      return {
        success: false,
        error: `Vendor ID "${data.vendor_id}" already exists`
      };
    }
    
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
      return {
        success: false,
        error: vendorError.message || "Failed to create vendor"
      };
    }
    
    console.log("✅ Vendor created successfully:", vendorData.vendor_id);
    revalidatePath("/admin/vendors");
    
    return {
      success: true,
      data: vendorData
    };
    
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}

// ✅ updateVendor - 正确处理主键变更和错误响应
export async function updateVendor(data: Partial<{
  vendor_id: string | number;
  vendor_id_original?: string | number;
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

    const lookupId = data.vendor_id_original ?? data.vendor_id;

    if (!lookupId) {
      return { 
        success: false,
        error: "Vendor ID is required" 
      };
    }

    console.log(`🔍 Looking up vendor with ID: ${lookupId}`);

    // 检查原记录是否存在
    const { data: originalData, error: fetchError } = await supabase
      .from('vendors')
      .select('*')
      .eq('vendor_id', lookupId)
      .single();

    if (fetchError || !originalData) {
      console.error("❌ Vendor not found:", fetchError);
      return {
        success: false,
        error: "Vendor not found"
      };
    }

    // 情况 1：vendor_id 没有改变 → 直接更新
    if (String(data.vendor_id) === String(lookupId)) {
      console.log("📝 Updating vendor (ID unchanged)");

      const { data: updatedData, error: updateError } = await supabase
        .from('vendors')
        .update({
          vendor_name: data.vendor_name ?? originalData.vendor_name,
          contact_person: data.contact_person ?? originalData.contact_person,
          phone_number1: data.phone_number1 ?? originalData.phone_number1,
          phone_number2: data.phone_number2 ?? originalData.phone_number2,
          vendor_email: data.vendor_email ?? originalData.vendor_email,
          vendor_image: data.vendor_image ?? originalData.vendor_image,
          source_link: data.source_link ?? originalData.source_link,
          vendortype: data.vendor_type ?? originalData.vendortype,
          address: data.address ?? originalData.address,
          city: data.city ?? originalData.city,
          country: data.country ?? originalData.country,
          payment_terms: data.payment_terms ?? originalData.payment_terms,
          notes: data.notes ?? originalData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('vendor_id', lookupId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Update failed:", updateError);
        return {
          success: false,
          error: updateError.message || "Failed to update vendor"
        };
      }

      console.log("✅ Update successful");
      revalidatePath("/admin/vendors");
      return { 
        success: true,
        data: updatedData 
      };
    }

    // 情况 2：vendor_id 被改变了 → 删除旧记录，创建新记录
    console.log(`🔄 Vendor ID changed from ${lookupId} to ${data.vendor_id}`);

    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('vendor_id')
      .eq('vendor_id', data.vendor_id)
      .single();

    if (existingVendor) {
      return {
        success: false,
        error: `Vendor ID "${data.vendor_id}" already exists`
      };
    }

    const { error: deleteError } = await supabase
      .from('vendors')
      .delete()
      .eq('vendor_id', lookupId);

    if (deleteError) {
      console.error("❌ Delete failed:", deleteError);
      return {
        success: false,
        error: "Failed to update vendor ID"
      };
    }

    const { data: newVendorData, error: insertError } = await supabase
      .from('vendors')
      .insert({
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name ?? originalData.vendor_name,
        contact_person: data.contact_person ?? originalData.contact_person,
        phone_number1: data.phone_number1 ?? originalData.phone_number1,
        phone_number2: data.phone_number2 ?? originalData.phone_number2,
        vendor_email: data.vendor_email ?? originalData.vendor_email,
        vendor_image: data.vendor_image ?? originalData.vendor_image,
        source_link: data.source_link ?? originalData.source_link,
        vendortype: data.vendor_type ?? originalData.vendortype,
        address: data.address ?? originalData.address,
        city: data.city ?? originalData.city,
        country: data.country ?? originalData.country,
        payment_terms: data.payment_terms ?? originalData.payment_terms,
        notes: data.notes ?? originalData.notes,
        created_at: originalData.created_at,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Insert failed:", insertError);
      return {
        success: false,
        error: "Failed to update vendor ID"
      };
    }

    console.log("✅ Vendor ID update successful");
    revalidatePath("/admin/vendors");
    return { 
      success: true,
      data: newVendorData 
    };

  } catch (error: any) {
    console.error('❌ Unexpected error in updateVendor:', error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}

// ✅ 删除供应商
export async function deleteVendor(vendor_id: string){
  try {
    const supabase = await createSupabaseAdmin();

    if (!vendor_id) {
      return {
        success: false,
        error: "Vendor ID is required"
      };
    }


    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .delete()
      .eq('vendor_id', vendor_id)
      .select()
      .single();

    if (vendorError) {
      console.error("Failed to delete vendor", vendorError);
      return {
        success: false,
        error: vendorError.message || "Failed to delete vendor"
      };
    }

    if (!vendorData) {
      return {
        success: false,
        error: "Vendor not found"
      };
    }

    revalidatePath("/admin/vendors");

    return { 
      success: true,
      data: vendorData,
      message: "Vendor deleted successfully" 
    };

  } catch (error: any) {
    console.error("Failed to delete vendor", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}

// 获取所有供应商
export async function fetchVendors(){
  try {
    const supabase = await createSupabaseAdmin();

    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .order('created_at', { ascending: false });

    if (vendorError) {
      console.error("Failed to fetch vendor data", vendorError);
      return {
        success: false,
        error: vendorError.message || "Failed to fetch vendors data"
      };
    }

    return vendorData || [];

  } catch (error: any) {
    console.error("Failed to fetch vendors", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
  }
}