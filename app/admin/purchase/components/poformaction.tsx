import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface POFormActionsProps {
  isPending: boolean;
  onCancel: () => void;
}

export function POFormActions({ isPending, onCancel }: POFormActionsProps) {
  return (
    <div className="flex gap-4">
     
      {/* 取消按钮 */}
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
        className="
          flex-1
          border-amber-400 text-amber-600
          hover:bg-amber-50 hover:text-amber-700
        "
      >
        Cancel
      </Button>

       {/* 主按钮 */}
      <Button
        type="submit"
        disabled={isPending}
        className="  flex-1 bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-amber-400 hover:border-yellow-400 font-medium transition-colors"
      >
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isPending ? "Creating..." : "Create Purchase Order"}
      </Button>

    </div>
  );
}
