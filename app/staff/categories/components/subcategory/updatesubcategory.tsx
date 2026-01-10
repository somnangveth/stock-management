"use client";

import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo, useState, useTransition } from "react";
import { Categories, Subcategories } from "@/type/producttype";
import { useQuery } from "@tanstack/react-query";
import { fetchCategoryAndSubcategory } from "@/app/functions/admin/api/controller";
import { useParams } from "next/navigation";
import { updateSubcategory } from "@/app/functions/admin/stock/category/subcategory";
import { styledToast } from "@/app/components/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { btnStyle } from "@/app/components/ui";


//Update Schema 
const UpdateSchema = z.object({
    category_id: z.string().optional(),
    subcategory_name: z.string().optional(),
});

export default function UpdateSubcategory({subcategory}:{subcategory: Subcategories}){
    const [category, setCategory] = useState<Categories[]>();
    const[isPending, startTransition] = useTransition();


    const param = useParams();
    const id = param.id;

    const {data, isLoading, error} = useQuery({
        queryKey: ["category-subcategory"],
        queryFn: fetchCategoryAndSubcategory,
    });

    //Filter Subcategory using Category Id
    const CategorySubcategoryData = useMemo(() => {
        if(!data) return [];
        data.categories.filter((cat:Categories,sub:Subcategories) => (
            cat.category_id === id
        ))
    }, [data, id]);


    //Form
    const form = useForm<z.infer<typeof UpdateSchema>>({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            subcategory_name: subcategory.subcategory_name,
            category_id: String(id),
        }
    });

    function onSubmit(formData: z.infer<typeof UpdateSchema>){
        startTransition(async() => {
            try{
              const result = await updateSubcategory(subcategory.subcategory_id, formData);

              if(!result){
                console.error("Failed to update subcategory!");
                styledToast.error("Failed to upate subcategory!");
              }

              styledToast.success("Update subcategory successfully!");
              window.location.reload();
              document.getElementById("sub-update")?.click();

            }catch(error){
                console.error("Fialed to update");
            }
        });
    }
    return(
        <Form {...form}>
            <form 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4">

                <FormField
                control={form.control}
                name="subcategory_name"
                render={({field}) => (
                    <FormItem>
                       <FormLabel className="text-sm text-gray-500">Subcategory Name: </FormLabel>
                       <FormControl>
                        <Input
                        type="text"
                        defaultValue={field.value}
                        onChange={field.onChange}/>
                       </FormControl>
                    </FormItem>
                )}/>
                
                <Button
                className={btnStyle}>
                    {isPending ? (
                        <AiOutlineLoading3Quarters className="animate-spin"/>
                    ):(
                    <>
                    Update Subcategory
                    </>
                    )}
                </Button>
            </form>
        </Form>
    )
}