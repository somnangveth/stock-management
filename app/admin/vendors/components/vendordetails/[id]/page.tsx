"use client";
import VendorDetailCatalog from "@/app/components/catalog/vendordetailcatalog.tsx";
import { fetchProducts, fetchVendors } from "@/app/functions/admin/api/controller";
import { cn } from "@/lib/utils";
import { Product, Vendors } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function VendorDetailPage(){
  const param = useParams();
  const id = param.id;

  
  const result = useQueries({
    queries: [
      {
        queryKey: ["vendorQuery"],
        queryFn: fetchVendors,
      },
      {
        queryKey: ["productsQuery"],
        queryFn: fetchProducts,
      }
    ]
  });
  
  const vendorData = result[0].data;
  const productData = result[1].data;
  const isLoading = result[0].isLoading || result[1].isLoading;
  const hasError = result[0].error || result[1].error;
  
  //Extract Vendor Info to a specific ID
  const vendors = useMemo(() => {
    if(!vendorData || !id) return null;
    const vendorArray = vendorData;
    if(!Array.isArray(vendorArray)) return null;
    // Compare both as strings to handle type mismatches
    return vendorArray.find((vendor: Vendors) => 
      String(vendor.vendor_id) === String(id)
    );
  }, [vendorData, id]);
  

  const products = useMemo(() => {
    if(!productData || !vendors) return null;
    const productArray = productData;
    if(!Array.isArray(productArray)) return null;
    return productArray.find((product: Product) => product.vendor_id === vendors.vendor_id);
  }, [productData, vendors]);
  
  // Added loading state
  if(isLoading) {
    return(
      <div className="text-gray-500 flex items-center justify-center h-screen">
        <p className="flex items-center gap-2">
          Loading <AiOutlineLoading3Quarters className={cn("animate-spin")}/>
        </p>
      </div>
    )
  }
  
  // Added error state
  if(hasError) {
    return(
      <div className="text-gray-500 flex items-center justify-center h-screen">
        <p>Failed to Load</p>
      </div>
    )
  }
  
  // Added null checks before rendering
  if(!vendors) {
    return(
      <div className="text-gray-500 flex items-center justify-center h-screen">
        <p>Vendor not found</p>
      </div>
    )
  }
  
  // Note: products can be null if vendor has no products
  return(
    <div>
      <VendorDetailCatalog product={products} vendor={vendors}/>
    </div>
  )
}