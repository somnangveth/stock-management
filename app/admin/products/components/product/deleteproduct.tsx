'use client';
import { deleteProduct } from "@/app/functions/admin/stock/product/product";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle, 
    AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Product } from "@/type/producttype";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteBtn, trash } from "@/app/components/ui";

export default function DeleteProduct({ product }: { product: Product }) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (isDeleting) return;
        
        // Validate product exists
        if (!product || !product.product_id) {
            toast.error('Invalid product data');
            console.error('Product data is missing or invalid:', product);
            return;
        }
        
        setIsDeleting(true);
        try {
            const res = await deleteProduct(product);
            const result = JSON.parse(res);
            
            if (result.error) {
                console.error('Failed to delete: ', result.error);
                toast.error('Failed to delete product');
            } else {
                toast.success('Product deleted successfully');
                setOpen(false);
            }
        } catch (error) {
            console.error('Delete error: ', error);
            toast.error('Something went wrong while deleting');
        } finally {
            setIsDeleting(false);
        }
    }

    // Don't render if product is invalid
    if (!product || !product.product_id) {
        console.error('DeleteProduct: Invalid product prop', product);
        return null;
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="bg-transparent hover:bg-transparent text-red-500 hover:bg-red-700"
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
                        Are you sure you want to delete this product? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel 
                        disabled={isDeleting}
                        className="border border-gray-300 hover:bg-gray-100 rounded-xl"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-200 border-2 border-red-700 rounded-xl text-red-700 hover:bg-red-300"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}