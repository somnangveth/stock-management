'use client';

import { styledToast } from "@/app/components/toast";
import { trash } from "@/app/components/ui";
import { deleteCategory } from "@/app/functions/admin/stock/category/category";
import { AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Categories } from "@/type/producttype";
import { useState } from "react";

export default function DeleteCategoryForm({category}:{category: Categories}){
    const [ open , setOpen ] = useState(false);

    async function handleDelete(){
        try{
            const result = await deleteCategory(String(category.category_id));

            if(!result){
                console.error('Failed to delete');
            }
            styledToast.success("Delete category successfully!");
            window.location.reload();
        }catch(error){
            console.error('Failed to delete category', error);
        }
    }
    return(
        <AlertDialog open={open} onOpenChange={setOpen} >
            <AlertDialogTrigger asChild>
                <Button
                className="bg-transparent text-red-700 text-sm rounded-xl hover:bg-transparent hover:text-red-900">
                    {trash}
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-semibold text-red-700">
                        Confirm Deletion
                    </AlertDialogTitle>
                    <AlertDescription>
                        Are you sure you want to delete?
                    </AlertDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex gap-2">
                    <AlertDialogCancel
                    className="border border-gray-300 hover:bg-gray-100 rounded-xl">
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-200 border-2 border-red-700 rounded-xl text-red-700">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}