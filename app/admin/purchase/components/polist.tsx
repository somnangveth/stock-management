// app/admin/purchase/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Loader2, ChevronDown, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { fetchPurchaseOrder, fetchPurchaseOrders, deletePurchaseOrder } from "../action/purchaseorder";
import { PurchaseOrder, PurchaseOrderDetail } from "@/type/producttype";
import POEditForm from "./poupdate";

const STATUS_CONFIG = {
  draft: { color: "bg-slate-100 text-slate-800" },
  submitted: { color: "bg-blue-100 text-blue-800"},
  confirmed: { color: "bg-green-100 text-green-800"},
  received: { color: "bg-green-700 text-white"},
  completed: { color: "bg-emerald-100 text-emerald-800"},
  cancelled: { color: "bg-red-100 text-red-800"},
};

type POListProps = {
  refreshKey: number;

  onDataLoaded: (
    data: PurchaseOrder[],
    onSearch: (results: PurchaseOrder[]) => void,
    searchKeys: (keyof PurchaseOrder)[]
  ) => void;
};


export default function POList({ refreshKey, onDataLoaded }: POListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingPO, setEditingPO] = useState<PurchaseOrderDetail | null>(null);

  const router = useRouter();

      const {
        data: poList = [],
        isLoading,
        error,
        refetch,
      } = useQuery<PurchaseOrder[]>({
        queryKey: ["purchase-orders", refreshKey],
        queryFn: async () => {
          const result = await fetchPurchaseOrders();
          if (result.error) throw new Error(result.error);
          return result.data || [];
        },
      });

  const filteredPOs = useMemo(() => {
    if (!poList) return [];
    return poList.filter((po) => {
      const matchesSearch =
        po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [poList, searchTerm, statusFilter]);

  const getProgressPercentage = (po: PurchaseOrder) =>
    po.item_count === 0 ? 0 : Math.round((po.received_items_count / po.item_count) * 100);

  const handleDelete = async (poId: string, status: string) => {
    if (status !== "draft") return toast.error("Can only delete draft purchase orders");
    if (!confirm("Are you sure you want to delete this purchase order?")) return;

    try {
      const result = await deletePurchaseOrder(poId);
      if (result.error) toast.error("Failed to delete purchase order");
      else {
        toast.success("Purchase order deleted successfully");
        refetch();
      }
    } catch {
      toast.error("An error occurred while deleting the purchase order");
    }
  };

  const handleEdit = async (poId: string) => {
    try {
      const result = await fetchPurchaseOrder(poId);
      if (result.error) {
        toast.error("Failed to load purchase order");
        return;
      }
      if (result.data) {
        setEditingPO(result.data as PurchaseOrderDetail);
      }
    } catch (error: any) {
      toast.error("Error loading purchase order: " + error.message);
    }
  };

  const handleEditSuccess = () => {
    setEditingPO(null);
    refetch();
  };

  const handleEditCancel = () => {
    setEditingPO(null);
  };

  // Show edit form if editing
  if (editingPO) {
    return (
      <POEditForm
        po={editingPO}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />
    );
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load purchase orders</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* 头部和筛选条件 */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by PO Number or Vendor Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 h-10 bg-white border-gray-200"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10 bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600">
          {poList.length > 0 && (
            <>
              Showing <span className="font-semibold text-gray-900">{filteredPOs.length}</span> / Total{" "}
              <span className="font-semibold text-gray-900">{poList.length}</span> purchase orders
            </>
          )}
        </div>
      </div>

      {/* 卡片网格 */}
      {filteredPOs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-600">
            {poList.length === 0
              ? "No purchase orders yet, create one to get started!"
              : "No purchase orders match your search criteria"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPOs.map((po) => {
            const config = STATUS_CONFIG[po.status];
            const progress = getProgressPercentage(po);
            const isExpanded = expandedId === po.purchase_id;


            return (
              <div
                key={po.purchase_id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                {/* 卡片头部 */}
                <div className="p-5 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">{po.po_number}</h3>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{po.vendor_name}</p>
                    </div>
                    <Badge className={`${config.color} border-0 whitespace-nowrap text-xs font-semibold`}>
                      {po.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-600 mb-1">Create At</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(po.purchase_date).toLocaleDateString("en-US")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Expected Delivery</p>
                      <p className="font-semibold text-gray-900">
                        {po.expected_delivery_date
                          ? new Date(po.expected_delivery_date).toLocaleDateString("en-US")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 金额和进度 */}
                <div className="p-5 border-b border-gray-100">
                  <p className="text-xs text-gray-600 mb-2">Order Total</p>
                  <p className="text-3xl font-bold text-gray-900 mb-5">${po.total_amount.toFixed(2)}</p>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-gray-600">Receiving Progress</p>
                      <p className="text-xs font-bold text-amber-600">
                        {po.received_items_count}/{po.item_count} • {progress}%
                      </p>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-yellow-500 to-yellow-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 采购项目 */}
                <div className="flex-1 flex flex-col">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : po.purchase_id)}
                    className="px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-sm font-semibold text-gray-900">
                      Purchase Item{" "}
                      {po.item_count > 0 && (
                        <span className="text-xs font-normal text-gray-600 ml-1">({po.item_count})</span>
                      )}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="flex-1 p-4 space-y-2 max-h-64 overflow-y-auto">
                      {po.items && po.items.length > 0 ? (
                        po.items.map((item) => (
                          <div
                            key={item.purchase_item_id}
                            className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <p className="font-semibold text-sm text-gray-900 truncate mb-2">
                              {item.product_name}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Quantity:</span>
                                <span className="font-semibold text-gray-900">
                                  {item.received_quantity}/{item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Unit Price:</span>
                                <span className="font-semibold text-gray-900">
                                  ${item.unit_price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200 text-xs">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-bold text-gray-900">${item.total_price.toFixed(2)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-4 text-sm">No purchase items</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400"
                    onClick={() => router.push(`/admin/purchase/${po.purchase_id}`)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View
                  </Button>

                  {po.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400"
                      onClick={() => handleEdit(po.purchase_id)}
                    >
                      <Edit2 className="h-4 w-4 mr-1.5" />
                      Edit
                    </Button>
                  )}

                  {po.status === "draft" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="px-3"
                      onClick={() => handleDelete(po.purchase_id, po.status)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}