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
import { useState } from "react";
import { toast } from "sonner";
import {  DeleteBtn, DeleteIconBtn, trash } from "@/app/components/ui";
import { Dealer } from "@/type/membertype";
import { deleteDealer } from "@/app/functions/admin/sale/dealer";
import { styledToast } from "@/app/components/toast";
import { useRouter } from "next/navigation";

export default function DeleteDealer({ dealer }: { dealer: Dealer }) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();


    async function handleDelete() {
        if (isDeleting) return;
        
        // Validate product exists
        if (!dealer || !dealer.dealer_id) {
            toast.error('Invalid dealer data');
            console.error('Product data is missing or invalid:', dealer);
            return;
        }
        
        setIsDeleting(true);
        try {
            const result = await deleteDealer(dealer.dealer_id);
            
            if (!result) {
                console.error('Failed to delete');
                styledToast.error("Failed to delete dealer");
            } else {
                styledToast.success('Dealer deleted successfully');
                router.replace("/")
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
    if (!dealer || !dealer.dealer_id) {
        console.error('DeleteProduct: Invalid product prop', dealer);
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
                        Are you sure you want to delete this dealer? This action cannot be undone.
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