'use client';
import DialogForm from "@/app/components/dialogform";
import { Button } from "@/components/ui/button";
import { Attribute, Categories, Price, Product, Subcategories, Vendors } from "@/type/producttype";
import UpdateProduct from "./updateproduct"; // Import the actual form component
import { edit, EditIconBtn } from "@/app/components/ui";

type Props = {
  product: Product;
  price?: Price;
  attribute?: Attribute[];


  categories: Categories[];
  subcategories: Subcategories[];
  vendors: Vendors[];

  category?: Categories;
  subcategory?: Subcategories;
  vendor?: Vendors;
};

export default function UpdateForm({product, categories, subcategories, vendors}: Props){
    return(
        <DialogForm
            id="update-trigger"
            title="Update Product"
            Trigger={
                <button
                    className={EditIconBtn}>
                    {edit}
                </button>
            }
            form = {<UpdateProduct product={product} categories={categories} subcategories={subcategories} vendors={vendors}/>}
        />
    )
}