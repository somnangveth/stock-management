"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Truck,
  Package,
  User,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { PurchaseOrderDetail, PurchaseItem } from "@/type/producttype";
import StatusDialog from "../components/postatusdialog";
import ReceiveDialog from "../components/porecievedmodel";
import { fetchPurchaseOrder } from "../action/purchaseorder"; // server function

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const [id, setId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [po, setPO] = useState<PurchaseOrderDetail | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);

  // Get poId from URL
  useEffect(() => {
    if (params.poid) {
      const purchaseid = Array.isArray(params.poid) ? params.poid[0] : params.poid;
      setId(purchaseid);
    }
  }, [params]);

  // Fetch PO details
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await fetchPurchaseOrder(id); 

        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.data) {
          throw new Error("No data returned from server");
        }

        setPO(result.data as PurchaseOrderDetail);
      } catch (err: any) {
        console.error("Error loading purchase order:", err);
        setError(err.message);
        toast.error("Failed to load purchase order: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleStatusDialogSuccess = () => {
    setShowStatusDialog(false);
    window.location.reload();
  };

  const handleReceiveSuccess = () => {
    setShowReceiveDialog(false);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
        <p className="text-red-600 text-lg mb-4">{error || "Purchase order not found"}</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-slate-100 text-slate-800",
      submitted: "bg-blue-100 text-blue-800",
      confirmed: "bg-purple-100 text-purple-800",
      received: "bg-green-100 text-green-800",
      completed: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const statusConfig = getStatusColor(po.status);
  const receivedCount = po.purchase_items.filter(
    (item) => (item.received_quantity || 0) >= item.quantity
  ).length;
  const completionPercentage =
    po.purchase_items.length === 0 ? 0 : Math.round((receivedCount / po.purchase_items.length) * 100);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* PO Info */}
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">PO Number</p>
                <h1 className="text-3xl font-bold">{po.po_number}</h1>
              </div>
              <div className={`${statusConfig} px-3 py-1 rounded-lg font-semibold`}>
                {po.status.toUpperCase()}
              </div>
            </div>

            <p className="text-gray-600 mb-4">{po.vendor_name}</p>

            <div className="flex gap-3 mb-6">
              <Button
                onClick={() => setShowStatusDialog(true)}
                variant="outline"
                className="flex-1 border-yellow-500 text-yellow-600"
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                Update Status
              </Button>

              <Button
                onClick={() => setShowReceiveDialog(true)}
                variant="outline"
                className="flex-1 border-rose-500 text-rose-600"
              >
                <Package className="h-4 w-4 mr-2" />
                Record Receipt
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <p>{new Date(po.purchase_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-600" />
                <p>{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : "-"}</p>
              </div>
            </div>
          </div>

          {/* Amount Card */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Amount</p>
            <h2 className="text-3xl font-bold mt-2">${po.total_amount?.toFixed(2)}</h2>
          </div>
        </div>

        {/* Vendor Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-yellow-600" />
            Vendor Information
          </h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {po.vendor_image ? (
                <Image
                  src={po.vendor_image}
                  alt={po.vendor_name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">{po.vendor_name}</h4>
              {po.payment_terms && (
                <p className="text-gray-600 mb-3">
                  <span className="font-semibold">Payment Terms:</span> {po.payment_terms}
                </p>
              )}
            </div>
          </div>
          {po.note && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Notes:</span> {po.note}
              </p>
            </div>
          )}
        </div>

        {/* Completion Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5  text-yellow-600" />
              Delivery Progress
            </h3>
            <span className="text-2xl font-bold text-yellow-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-linear-to-r from-yellow-500 to-yellow-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">{receivedCount} of {po.purchase_items.length} items fully received</p>
        </div>


        {/* Purchase Items */}
        {po.purchase_items.map((item: PurchaseItem) => (
          <div key={item.purchase_item_id} className="bg-white border rounded-xl p-4 mb-4 shadow-sm flex gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
              {item.product_image ? (
                <Image src={item.product_image} alt={item.product_name} width={96} height={96} />
              ) : (
                <Package className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold">{item.product_name}</h4>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              <p className="text-sm text-gray-500">Received: {item.received_quantity || 0}</p>
            </div>
          </div>
        ))}

        {/* Status Dialog */}
        {showStatusDialog && (
          <StatusDialog
            poId={po.purchase_id}
            currentStatus={po.status}
            poNumber={po.po_number}
            onSuccess={handleStatusDialogSuccess}
            onCancel={() => setShowStatusDialog(false)}
          />
        )}

        {/* Receive Dialog */}
        {showReceiveDialog && (
          <ReceiveDialog
            po={po}
            onSuccess={handleReceiveSuccess}
            onCancel={() => setShowReceiveDialog(false)}
          />
        )}
      </div>
    </div>
  );
}
