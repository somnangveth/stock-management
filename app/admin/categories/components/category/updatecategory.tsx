'use client';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Categories } from "@/type/producttype";
import { useTransition } from "react";
import { updateCategory } from "@/app/functions/admin/stock/category/category";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { btnStyle } from "@/app/components/ui";
import { styledToast } from "@/app/components/toast";

const UpdateSchema = z.object({
    category_name: z.string().optional(),
    slug: z.string().optional(),
});

export default function UpdateCategory({category}:{category: Categories}){

    //-- Hooks --
    const [isPending, startTransition] = useTransition();


    const form = useForm<z.infer<typeof UpdateSchema>>({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            category_name: category.category_name,
            slug: category.slug,
        }
    });

    function onSubmit(data: z.infer<typeof UpdateSchema>){
        startTransition(async()=> {
            try{
                const result = await updateCategory(category.category_id, data);

                if(!result){
                    console.error('Failed to update category');
                    toast.error('Failed to update Category', )
                }

                toast.success('Category updated successfully!');
                document.getElementById('category-update-trigger')?.click();
                window.location.reload();
            }catch(error){
                console.error('Failed to update category', error);
            }
        })
    }

    return(
        <Form {...form}>
            <div
            className="space-y-4"
            >
                <form 
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4">
                                    
                                    
            {/* Category Name */}
                <FormField
                control={form.control}
                name="category_name"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Category Name: </FormLabel>
                        <FormControl>
                            <Input
                            type="text"
                            {...field}
                            onChange={(e) => field.onChange(String(e.target.value))}
                            />
                        </FormControl>
                    </FormItem>
                )}/>

                {/* Slug */}
                <FormField
                control={form.control}
                name="slug"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Slug: </FormLabel>
                        <FormControl>
                            <Input
                            type="text"
                            {...field}
                            onChange={(e) => field.onChange(String(e.target.value))}/>
                        </FormControl>
                    </FormItem>
                )}/>

                <Button
                className={btnStyle}>
                    {isPending ?
                    (
                        <AiOutlineLoading3Quarters className={cn("animate-spin")}/>
                    ):(
                        "Update Category"
                    )}
                </Button>
                </form>
            </div>
        </Form>
    )
}