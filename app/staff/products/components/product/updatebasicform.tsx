'use client';
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import { Attribute, Categories, Price, Product, Vendors } from "@/type/producttype";
import { edit, EditIconBtn } from "@/app/components/ui";
import UpdateProductBasicInfo from "./updatebasicinfo";

type Props = {
  product: Product;
  price?: Price;
  attribute?: Attribute[];
  categories: Categories[];
  vendors: Vendors[];
  category?: Categories;
  vendor?: Vendors;
};

export default function UpdateBasicForm({ product, vendors, categories }: Props) {
  return (
    <DialogForm
      id="update-product" 
      title="Update Product"
      Trigger={
        <button className={EditIconBtn}>
          {edit}
        </button>
      }
      form={
        <UpdateProductBasicInfo 
          product={product} 
          vendors={vendors} 
          categories={categories}
        />
      }
    />
  );
}