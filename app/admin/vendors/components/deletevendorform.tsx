'use client';

import { deleteVendor } from "../actions/vendor"; // 调整为vendor路径
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Vendors } from "@/type/producttype";
import { useState } from "react";
import { toast } from "sonner";
import { trash } from "@/app/components/ui";

export default function DeleteVendor({ vendor }: { vendor: Vendors }) {
    const [open, setOpen] = useState(false);

    async function handleDelete() {
        try {
            const result = await deleteVendor(vendor.vendor_id.toString());

            // Check if deletion was successful
            if (result) {
                toast.success('Vendor deleted successfully');
                setOpen(false);
            } else {
                console.error('Failed to delete vendor: ', result);
                toast.error('Failed to delete vendor');
            }
        } catch (error) {
            console.error('Delete error: ', error);
            toast.error('Something went wrong while deleting');
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    className="w-11 h-5 text-sm bg-transparent text-red-500 rounded-xl"
                >
                    {trash}
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-semibold text-red-700">
                        Confirm Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete
                        <span className="font-semibold text-indigo-700">
                            {vendor.vendor_name}
                        </span>?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel className="border border-gray-300 hover:bg-gray-100 rounded-xl">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-200 border-2 border-red-700 rounded-xl text-red-700"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
