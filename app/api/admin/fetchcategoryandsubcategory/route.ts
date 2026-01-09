import { fetchCategoriesAndSubcategories, fetchProducts } from "@/app/functions/admin/stock/product/product";
import { NextResponse } from "next/server";

export async function GET(){
    try{
        const {categories, subcategories} = await fetchCategoriesAndSubcategories();
        const product = await fetchProducts();
        return NextResponse.json({categories, subcategories, product});
    }catch(error: any){
        console.error(error);
        return NextResponse.json({error: error.message});
    }
}