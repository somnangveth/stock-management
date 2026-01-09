"use client";

import { useState } from "react";
import { DeleteMemberProps } from "../admin/deletemember";
import { deleteMember } from "../../actions";
import { trash } from "@/app/components/ui";

export default function DeleteStaffForm({
    userId,
    onDeleted
}: DeleteMemberProps){
    const [isDeleting, setIsDeleting] = useState(false);

      const handleDelete = async () => {
        const confirmed = window.confirm(
          "Are you sure you want to delete this member? This action cannot be undone."
        );
        
        if (!confirmed) return;
    
        setIsDeleting(true);
    
        try {
          const result = await deleteMember(userId);
          
          if (result?.success) {
            onDeleted?.(); // Call callback to update parent state
          } else {
            alert(result?.error || "Failed to delete member");
          }
        } catch (err: any) {
          console.error("Error deleting member:", err);
          alert("An unexpected error occurred");
        } finally {
          setIsDeleting(false);
        }
      };

return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
      title="Delete member"
    >
      {isDeleting ? "..." : <>{trash}</>}
    </button>
  );
}