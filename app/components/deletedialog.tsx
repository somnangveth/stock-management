"use client";
import { useState } from "react";
import { styledToast } from "@/app/components/toast";
import { Button } from "@/components/ui/button";
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
import { trash } from "@/app/components/ui";
import { Loader2 } from "lucide-react";

interface DeleteMemberProps {
    userId: string;
    deleteAction: (userId: string) => Promise<{ success: boolean; error?: string }>;
    onDeleted?: () => void;
    entityName?: string;
    triggerButton?: React.ReactNode;
    title?: string;
    description?: string;
}

export default function DeleteDialogForm({
    userId,
    deleteAction,
    onDeleted,
    entityName = "member",
    triggerButton,
    title,
    description,
}: DeleteMemberProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!userId) {
            styledToast.error("User ID is required");
            return;
        }

        setIsDeleting(true);

        try {
            const result = await deleteAction(userId);

            if (result?.success) {
                styledToast.success(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully`);
                setOpen(false);
                onDeleted?.();
            } else {
                styledToast.error(result?.error || `Failed to delete ${entityName}`);
            }
        } catch (error: any) {
            console.error(`Error deleting ${entityName}:`, error);
            styledToast.error(error.message || "An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    const defaultTrigger = (
        <Button
            className="
                h-7 w-15
                bg-transparent text-red-700
                text-sm
                rounded-xl
                hover:bg-red-500 hover:text-red-100
                transition-colors
            "
            aria-label={`Delete ${entityName}`}
        >
            {trash}
        </Button>
    );

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {triggerButton || defaultTrigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-semibold text-red-700">
                        {title || "Confirm Deletion"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description || 
                            `Are you sure you want to delete this ${entityName}? This action cannot be undone. All associated data including permissions will be permanently removed.`
                        }
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
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-red-200 border-2 border-red-700 rounded-xl text-red-700 hover:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}