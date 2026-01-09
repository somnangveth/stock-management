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
import { Product, ProductBatch } from "@/type/producttype";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteBtn, DeleteIconBtn, trash } from "@/app/components/ui";
import { deleteBatch } from "@/app/functions/admin/stock/product_batches/productbatches";

export default function DeleteBatch({ batch, product }: { batch: ProductBatch, product: Product }) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (isDeleting) return;
        
        // Validate product exists
        if (!batch || !batch.batch_id) {
            toast.error('Invalid batch data');
            console.error('Batch data is missing or invalid:', batch);
            return;
        }
        
        setIsDeleting(true);
        try {
            const result = await deleteBatch(batch.batch_id, product.product_id);
            const res = typeof result === "string" ? JSON.parse(result) : result;
            
            if (!res) {
                console.error('Failed to delete: ');
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
    if (!batch || !batch.product_id) {
        console.error('DeleteProduct: Invalid product prop', batch);
        return null;
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={DeleteIconBtn}
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
                        className={DeleteBtn}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}