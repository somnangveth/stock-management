"use client";
import { view } from "@/app/components/ui";
import MemberTable from "@/app/components/tables/membertable";
import { fetchVendors } from "@/app/functions/admin/api/controller";
import { Vendors } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";
import { Divide } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function DisplayVendors({
  refreshKey = 0,
  onDataLoaded
}: {
  refreshKey?: number,
  onDataLoaded?: (
    data: Vendors[],
    onSearch: (results: Vendors[]) => void,
    searchKeys: (keyof Vendors)[]
  ) => void
}) {
  const [displayVendors, setDisplayVendors] = useState<Vendors[]>([]);

  const handleSearchResults = useCallback((results: Vendors[]) => {
    setDisplayVendors(results);
  }, []);

  const { data: vendors, isLoading, error } = useQuery<Vendors[]>({
    queryKey: ["query-vendors", refreshKey],
    queryFn: fetchVendors,
  });

  // Update display vendors when data changes
  useEffect(() => {
    if (vendors) {
      setDisplayVendors(vendors);
      
      if (onDataLoaded) {
        onDataLoaded(
          vendors,
          handleSearchResults,
          ['vendor_name', 'vendor_id']
        );
      }
    }
  }, [vendors, onDataLoaded, handleSearchResults]);

  if (isLoading) return <p>Vendor Data is Loading...</p>;
  if (error || !vendors) 
  {
    return(
    <button
    onClick={() => window.location.reload()}
    className="ml-4 text-blue-600 hover:underline">
        Retry
  </button>);
  }

  if(displayVendors.length === 0){
    return(
        <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">
                No Vendor Found.
            </p>
        </div>
    )
  }
  return (
    <div className="mt-10">
      <MemberTable
      itemsPerPage={5}
        members={displayVendors}
        columns={[
          "vendor_id",
          "vendor_image",
          "vendor_name",
          "contact_person",
          "action"
        ]}

        form={(vendor) =>{
          const v = vendor as Vendors;
          return(
            <div>
              <Link href={`/admin/vendors/components/vendordetails/${v.vendor_id}`}>
              {view}
              </Link>
            </div>
          )
        }
        }
      />
    </div>
  );
}