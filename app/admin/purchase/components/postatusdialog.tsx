// app/admin/purchase/components/status-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { updatePurchaseOrderStatus } from "../action/status";
import type { PurchaseStatus } from "@/type/producttype";

interface StatusDialogProps {
  poId: string;
  currentStatus: PurchaseStatus;
  poNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUS_CONFIG: Record<PurchaseStatus, { label: string; color: string; icon: string; bgColor: string }> = {
  draft: { label: "Draft", color: "slate", icon: "📝", bgColor: "bg-slate-100" },
  submitted: { label: "Submitted", color: "blue", icon: "📤", bgColor: "bg-blue-100" },
  confirmed: { label: "Confirmed", color: "purple", icon: "✅", bgColor: "bg-purple-100" },
  received: { label: "Received", color: "green", icon: "📦", bgColor: "bg-green-100" },
  completed: { label: "Completed", color: "emerald", icon: "🎉", bgColor: "bg-emerald-100" },
  cancelled: { label: "Cancelled", color: "red", icon: "❌", bgColor: "bg-red-100" },
};

// 状态转换规则
const VALID_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["confirmed", "cancelled"],
  confirmed: ["received", "cancelled"],
  received: ["completed"],
  completed: [],
  cancelled: [],
};

// 获取当前状态的有效下一步
const getValidNextStatuses = (currentStatus: PurchaseStatus): PurchaseStatus[] => {
  return VALID_TRANSITIONS[currentStatus] || [];
};

export default function StatusDialog({
  poId,
  currentStatus,
  poNumber,
  onSuccess,
  onCancel,
}: StatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PurchaseStatus | null>(null);

  const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
  const currentConfig = STATUS_CONFIG[currentStatus];
  const isLocked = validNextStatuses.length === 0;

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error("Please select a new status");
      return;
    }

    try {
      setIsLoading(true);
      const result = await updatePurchaseOrderStatus(poId, selectedStatus);

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success(`Status updated to ${STATUS_CONFIG[selectedStatus].label}`);
      onSuccess();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Update Status</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Current Status */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Current Status</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${currentConfig.bgColor}`}>
              <span>{currentConfig.icon}</span>
              <span className="font-semibold text-gray-900">
                {currentConfig.label}
              </span>
            </div>
          </div>

Jade peakz, [9/1/26 15:12 ]


          {/* Locked State */}
          {isLocked && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">No Further Actions</p>
                <p className="text-xs text-gray-600 mt-1">
                  This purchase order cannot be changed from {currentConfig.label} status.
                </p>
              </div>
            </div>
          )}

          {/* Available Status */}
          {validNextStatuses.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Select Next Status</p>
              <div className="space-y-2">
                {validNextStatuses.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const isSelected = selectedStatus === status;

                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                        isSelected
                          ? `border-blue-500 bg-blue-50`
                          : `border-gray-200 bg-white hover:border-gray-300`
                      }`}
                    >
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{config.label}</p>
                        <p className="text-xs text-gray-600">
                          Move to {config.label.toLowerCase()}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-600 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">PO Number:</span> {poNumber}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedStatus || isLoading || isLocked}
            onClick={handleStatusChange}
            className="flex-1 bg-yellow-600 hover:bg-orange-400"
          >
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </div>
    </div>
  );
}