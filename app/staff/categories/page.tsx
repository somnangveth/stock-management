'use client';

import { useCallback, useState } from "react";
import DisplayAll from "./components/filter/displayall";
import { EnhancedProduct } from "../products/components/product/productlists";
import SearchBar from "@/app/components/searchbar";
import TotalSubcategoryCatalog from "@/app/components/catalog/totalcatandsub";

export default function CategoryPage(){
    const [visibleProducts, setVisibleProducts] = useState<EnhancedProduct[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    //Store product list locally
    const [product, setProducts] = useState<EnhancedProduct[]>([]);


    //Store search config
    const [searchConfig, setSearchConfig] = useState<{
        searchKeys: (keyof EnhancedProduct)[];
        onSearch: (results: EnhancedProduct[]) => void;
    } | null>(null);

    const registerSearch = useCallback(
        (
            data: EnhancedProduct[],
            onSearch: (results: EnhancedProduct[]) => void,
            searchKeys: (keyof EnhancedProduct)[],
        )=> {
            setProducts(data);
            setSearchConfig({searchKeys, onSearch});
        }, []
    );

    const handleProductAdded = useCallback(() => {
        setRefreshKey((prev) => prev + 1)
    }, []);
    return(
    <div>
        <div className="flex justify-end">
              <div className="w-1/3">
                {/* Search bar shows only after ProductList registers keys */}
              {searchConfig && (
                <SearchBar
                  data={visibleProducts}
                  onSearch={searchConfig.onSearch}
                  searchKeys={searchConfig.searchKeys}
                  placeholder="Search products by name, SKU, or category..."
                />
              )}
            </div>
              </div>


       <div className="flex w-full mt-10">
         <TotalSubcategoryCatalog/>
       </div>
        <div className="mt-10">
            <DisplayAll 
            refreshKey={refreshKey} 
            onDataLoaded={registerSearch}
            onFilteredChange={(filtered) => setVisibleProducts(filtered)}/>
        </div>
    </div>
    )
}