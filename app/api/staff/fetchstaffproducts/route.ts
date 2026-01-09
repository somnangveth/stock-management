import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supbase/action";
import { checkPermission } from "@/lib/permission/checkpermission";

export async function GET() {
  try {
    console.log('🔍 API Route: Checking product.view permission...');
    
    const hasPermission = await checkPermission('product.view');
    
    console.log('🔍 API Route: Permission result:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ Permission denied, returning 403');
      return NextResponse.json(
        { error: 'Unauthorized: Missing product.view permission' },
        { status: 403 }
      );
    }
    
    console.log('✅ Permission granted, fetching products...');
    
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sku_code', { ascending: true });
    
    console.log('📦 Products query result:', { 
      count: data?.length || 0, 
      error: error?.message 
    });
    
    if (error) {
      console.log('❌ Database error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('✅ Returning products successfully');
    return NextResponse.json({ data, error: null });
    
  } catch (error) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
