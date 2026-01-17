// app/admin/ledger/components/receipt-list.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnhancedLedger } from "@/type/membertype";
import { fetchLedger } from "../action/ledger";
import { fetchLedgerAlert, fetchLedgerAlertDetailed } from "../action/ledgeralert";
import { LedgerAlert } from "@/type/duedateledger";
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Printer } from "lucide-react";
import UpdateReceiptForm from "./updateledger";
import DeleteReceipt from "./deleteledger";

interface ReceiptListProps {
  refreshKey?: number;
  onDataLoaded?: (
    data: EnhancedLedger[],
    onSearch: (results: EnhancedLedger[]) => void,
    searchKeys: (keyof EnhancedLedger)[]
  ) => void;
  onReceiptUpdated?: () => void;
  onReceiptDeleted?: () => void;
}

export default function ReceiptList({ 
  refreshKey = 0, 
  onDataLoaded,
  onReceiptUpdated,
  onReceiptDeleted,
}: ReceiptListProps) {
  const [displayReceipts, setDisplayReceipts] = useState<EnhancedLedger[]>([]);
  const [alert, setAlert] = useState<LedgerAlert>({ 
    overSoonCount: 0, overdateCount: 0 });
  const [alertDetails, setAlertDetails] = useState<any>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleSearchResults = useCallback((results: EnhancedLedger[]) => {
    setDisplayReceipts(results);
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["receipts", refreshKey],
    queryFn: async () => {
      const res = await fetchLedger();
      if (res.error) throw new Error(res.error);

      const list = res.data || [];

      return list.map((item: any): EnhancedLedger => {
        const vendorName = item.vendor_name || "Unknown Vendor";
        const debit = Number(item.debit ?? 0);
        const credit = Number(item.credit ?? 0);
        
        let payment_status: "paid" | "unpaid" | "partial" = "unpaid";
        if (credit === 0) payment_status = "unpaid";
        else if (credit < debit) payment_status = "partial";
        else payment_status = "paid";

        const today = new Date();
        const due = item.payment_duedate ? new Date(item.payment_duedate) : null;
        let term_status: "low" | "medium" | "high" | "overdue" = "medium";
        if (due) {
          const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) term_status = "overdue";
          else if (diffDays <= 7) term_status = "low";
          else if (diffDays <= 14) term_status = "medium";
          else term_status = "high";
        }

        return {
          id: item.id, 
          key: item.id,
          ledger_id: item.ledger_id,
          vendor_id: item.vendor_id,
          vendor_name: vendorName,
          source_type: item.source_type as "purchase" | "refund",
          source_id: item.source_id ?? null,
          debit,
          credit,
          balance: Number(item.balance ?? debit - credit),
          note: item.note || "",
          created_at: item.created_at,
          payment_duedate: item.payment_duedate || item.over_date || "",
          created_by: item.created_by || "",
          payment_status,
          term_status,
        };
      });
    },
  });

  useEffect(() => {
    fetchLedgerAlert()
      .then(setAlert)
      .catch((err: any) => console.error("Failed to fetch receipt alert:", err));
  }, [refreshKey]);

  useEffect(() => {
    if (showAlertDetails) {
      fetchLedgerAlertDetailed()
        .then(setAlertDetails)
        .catch((err: any) => console.error("Failed to fetch receipt alert details:", err));
    }
  }, [showAlertDetails, refreshKey]);

  useEffect(() => {
    if (!data) return;
    setDisplayReceipts(data);


    if (onDataLoaded) {
      const searchKeys: (keyof EnhancedLedger)[] = 
      ["vendor_name", "source_type", "note", "ledger_id"];
      onDataLoaded(data, handleSearchResults, searchKeys);
    }
  }, [data, onDataLoaded, handleSearchResults]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const handlePaymentSuccess = () => {
    refetch();
  };

  if (isLoading) return <p className=" w-full p-8 text-center text-slate-500">Loading...</p>;

  if (error)
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load receipt records</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );

  if (displayReceipts.length === 0) 
    return <p className="p-8 text-center text-slate-500">No receipt records found.</p>;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-full mx-auto space-y-6">
        
        {/* Alert */}
        {(alert.overSoonCount > 0 || alert.overdateCount > 0) && (
          <div className="bg-linaer-to-r bg-red-50 to-red-100 rounded-xl p-6 border border-red-400 ">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-6">
                {alert.overdateCount > 0 && (
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">{alert.overdateCount} Overdue</p>
                      <p className="text-sm text-slate-600">Action needed</p>
                    </div>
                  </div>
                )}
                {alert.overSoonCount > 0 && (
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-slate-900">{alert.overSoonCount} Due Soon</p>
                      <p className="text-sm text-slate-600">Within 7 days</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAlertDetails(!showAlertDetails)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showAlertDetails ? "Hide" : "View"}
              </button>
            </div>

            {showAlertDetails && alertDetails && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                {alertDetails.overdated.length > 0 && (
                  <div className="mb-4">
                    <p className="text-lg font-semibold text-amber-700 uppercase mb-2">Overdue</p>
                    <div className="space-y-2">
                      {alertDetails.overdated.map((item: any) => (
                        <div key={item.ledger_id} className="flex justify-between text-sm text-slate-700">
                          <span>{item.vendor_name}</span>
                          <span className="font-semibold">${item.balance.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {alertDetails.dueSoon.length > 0 && (
                  <div>
                    <p className="text-lg font-semibold text-red-600 uppercase mb-2">Due Soon</p>
                    <div className="space-y-2">
                      {alertDetails.dueSoon.map((item: any) => (
                        <div key={item.ledger_id} className="flex justify-between text-sm text-slate-700">
                          <span>{item.vendor_name}</span>
                          <span className="font-semibold">${item.balance.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {displayReceipts.map((receipt) => {
            const isExpanded = expandedIds.has(receipt.ledger_id);
            const daysUntilDue = receipt.payment_duedate
              ? Math.ceil(
                  (new Date(receipt.payment_duedate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null;

            let statusColor = "slate";
            let statusLabel = "Safe";
            if (receipt.term_status === "overdue") {
              statusColor = "red";
              statusLabel = "Overdue";
            } else if (receipt.term_status === "low") {
              statusColor = "amber";
              statusLabel = "Due Soon";
            } else if (receipt.term_status === "medium") {
              statusColor = "blue";
              statusLabel = "Pending";
            }

            return (
              <div
                key={receipt.ledger_id}
                className="bg-white rounded-xl border-2 border-amber-100 overflow-hidden hover:border-yellow-500 transition-all hover:shadow-sm"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{receipt.vendor_name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{receipt.ledger_id}</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg hover:bg-slate-100 transition text-slate-600"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5 space-y-5">
                  
                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 text-xs mb-1">Created</p>
                      <p className="font-medium text-slate-900">{new Date(receipt.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-xs mb-1">Due</p>
                      <p className="font-medium text-slate-900">{receipt.payment_duedate ? new Date(receipt.payment_duedate).toLocaleDateString() : "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-xs mb-1">Days</p>
                      <p className={`font-medium ${daysUntilDue && daysUntilDue < 0 ? "text-red-600" : "text-slate-900"}`}>
                        {daysUntilDue !== null ? (daysUntilDue < 0 ? `-${Math.abs(daysUntilDue)}` : daysUntilDue) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      statusColor === "red" ? "bg-red-50 text-red-700" :
                      statusColor === "amber" ? "bg-amber-50 text-amber-700" :
                      statusColor === "blue" ? "bg-blue-50 text-blue-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {statusLabel}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      receipt.payment_status === "paid" ? "bg-emerald-50 text-emerald-700" :
                      receipt.payment_status === "unpaid" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {receipt.payment_status === "paid" ? "Paid" : receipt.payment_status === "unpaid" ? "Unpaid" : "Partial"}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      receipt.source_type === "purchase" ? "bg-indigo-50 text-indigo-700" : "bg-teal-50 text-teal-700"
                    }`}>
                      {receipt.source_type === "purchase" ? "Purchase" : "Refund"}
                    </span>
                  </div>

                  {/* Amounts - 完整的费用信息 */}
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Amount</span>
                      <span className="font-semibold text-slate-900">${receipt.debit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Amount Paid</span>
                      <span className="font-semibold text-emerald-600">${receipt.credit.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between">
                      <span className="font-semibold text-slate-900">Remaining Balance</span>
                      <span className={`text-lg font-semibold ${receipt.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        ${receipt.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {receipt.note && (
                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => toggleExpand(receipt.ledger_id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition text-sm font-medium text-slate-900"
                    >
                      <span>Notes</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-6 pb-4 text-sm text-slate-700 bg-slate-50 border-t border-slate-100">
                        {receipt.note}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer - 添加快速付款按钮 */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                  <UpdateReceiptForm receipt={receipt} onSuccess={onReceiptUpdated} />
                  <DeleteReceipt receipt_id={receipt.ledger_id} vendor_name={receipt.vendor_name} onSuccess={onReceiptDeleted} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}