"use client";

import ProductTable from "@/app/components/tables/producttable";
import { Price, Product } from "@/type/producttype";
import { useMemo, useState } from "react";
import UpdateSinglePriceB2C from "./updateprice";
import DiscountMultipleForm from "../components/discountform";
import SingleDiscountForm from "../components/singlediscountform";
import ViewDiscountPage from "../components/viewdiscount";
import SearchBar from "@/app/components/searchbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertFromDollarToRiels } from "@/app/functions/admin/price/currency";
import UpdatePriceFormB2C from "./updateform";

interface PriceTableB2CProps {
  productData: Product[];
  priceData: Price[];
}

export default function PriceTableB2C({ productData, priceData }: PriceTableB2CProps) {
  const [selectedProducts, setSelectedProducts] = useState<Price[]>([]);
  const [currency, setCurrency] = useState<"riel" | "dollar">("dollar");
  const [filteredData, setFilteredData] = useState<any[]>([]);

  const mergedData = useMemo(() => {
    if (!priceData || !productData) return [];

    return productData.map((product: Product) => {
      const price = priceData.find(
        (p: Price) => p.product_id === product.product_id
      );

      if (!price) {
        return { ...product, base_price: null, profit_price: null, shipping: null };
      }

      return {
        ...product,
        ...price,
        base_price:
          currency === "riel"
            ? convertFromDollarToRiels(price.base_price)
            : price.base_price,
        profit_price:
          currency === "riel"
            ? convertFromDollarToRiels(price.profit_price)
            : price.profit_price,
        shipping:
          currency === "riel"
            ? convertFromDollarToRiels(price.shipping)
            : price.shipping,
      };
    });
  }, [productData, priceData, currency]);

  useMemo(() => {
    setFilteredData(mergedData);
  }, [mergedData]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SearchBar
          data={mergedData}
          onSearch={setFilteredData}
          searchKeys={["product_name"]}
          placeholder="Search product..."
          className="w-[300px]"
        />

        <div className="flex items-center gap-3">
          <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dollar">USD ($)</SelectItem>
              <SelectItem value="riel">Riel (៛)</SelectItem>
            </SelectContent>
          </Select>

          {selectedProducts.length > 0 && (
            <DiscountMultipleForm prices={selectedProducts} />
          )}

          <ViewDiscountPage />
        </div>
      </div>

      <ProductTable
        product={filteredData}
        itemsPerPage={10}
        columns={["select", "product_name", "base_price", "profit_price", "shipping", "action"]}
        form={(item) => (
          <>
            <UpdatePriceFormB2C priceData={item as Price} />
            <SingleDiscountForm price={item as Price} />
          </>
        )}
        onSelectionChange={(selected: any) => {
          console.log("Selection changed:", selected);
          setSelectedProducts(selected);
        }}
      />
    </div>
  );
}