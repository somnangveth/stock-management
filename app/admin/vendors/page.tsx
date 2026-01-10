"use client";

import DisplayVendors from "./components/displayvendors";
import VendorForm from "./components/vendorform";
import { useCallback, useState } from "react";
import SearchBar from "@/app/components/searchbar";
import { Vendors } from "@/type/producttype";


export default function VendorPage(){
    const [refreshKeys, setRefreshKey] = useState(0);
    const [vendors, setVendors] = useState<Vendors[]>([]);
    const [searchConfig, setSearchConfig] = useState<{
        searchKeys: (keyof Vendors)[],
        onSearch: (results: Vendors[])=> void
    } | null>(null);

    const registerSearch = useCallback(
        (
            data: Vendors[],
            onSearch: (results: Vendors[]) => void,
            searchKeys: (keyof Vendors)[]
        )=>{
            setVendors(data);
            setSearchConfig({searchKeys, onSearch});
        },
        [],
    );

    const handleProductAdded = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
    }, []);
    
    return(
        <div className="space-y-6 p-6">
            {searchConfig && (
                <SearchBar
                data={vendors}
                onSearch={searchConfig.onSearch}
                searchKeys={searchConfig.searchKeys}
                placeholder="Search Vendor Info..."/>
            )}

            <div className="flex justify-end">
                <VendorForm onVendorAdded={handleProductAdded}/>
            </div>
            <div className="mt-10">
                <DisplayVendors refreshKey={refreshKeys} onDataLoaded={registerSearch}/>
            </div>
        </div>
    )
}