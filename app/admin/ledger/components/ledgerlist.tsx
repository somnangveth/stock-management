"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnhancedLedger } from "@/type/membertype";
import { fetchLedger } from "../action/ledger";
import { fetchLedgerAlert, fetchLedgerAlertDetailed } from "../action/ledgeralert";
import { LedgerAlert } from "@/type/duedateledger";
import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import UpdateLedgerForm from "./updateledgerform";
import DeleteLedger from "./deleteledger";

interface LedgerListProps {
  refreshKey?: number;
  onDataLoaded?: (
    data: EnhancedLedger[],
    onSearch: (results: EnhancedLedger[]) => void,
    searchKeys: (keyof EnhancedLedger)[]
  ) => void;
  onLedgerUpdated?: () => void;
  onLedgerDeleted?: () => void;
}

export default function LedgerList({ 
  refreshKey = 0, 
  onDataLoaded,
  onLedgerUpdated,
  onLedgerDeleted,
}: LedgerListProps) {
  const [displayLedgers, setDisplayLedgers] = useState<EnhancedLedger[]>([]);
  const [alert, setAlert] = useState<LedgerAlert>({ 
    overSoonCount: 0, overdateCount: 0 });
  const [alertDetails, setAlertDetails] = useState<any>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // 搜索回调
  const handleSearchResults = useCallback((results: EnhancedLedger[]) => {
    setDisplayLedgers(results);
  }, []);

  // 获取 Ledger 数据
  const { data, isLoading, error } = useQuery({
    queryKey: ["ledgers", refreshKey],
    queryFn: async () => {
      const res = await fetchLedger();
      if (res.error) throw new Error(res.error);

      const list = res.data || [];
      console.log("📊 Raw ledger data:", list);

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

  // 获取提示
  useEffect(() => {
    fetchLedgerAlert()
      .then(setAlert)
      .catch((err) => console.error("Failed to fetch ledger alert:", err));
  }, [refreshKey]);

  // 获取详细提示信息
  useEffect(() => {
    if (showAlertDetails) {
      fetchLedgerAlertDetailed()
        .then(setAlertDetails)
        .catch((err) => console.error("Failed to fetch ledger alert details:", err));
    }
  }, [showAlertDetails, refreshKey]);

  // 当数据变化时更新显示
  useEffect(() => {
    if (!data) return;
    setDisplayLedgers(data);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue":
        return { bg: "bg-white", border: "border-red-300", badge: "bg-red-100 text-red-700", accent: "text-red-600" };
      case "low":
        return { bg: "bg-white", border: "border-orange-300", badge: "bg-orange-100 text-orange-700", accent: "text-orange-600" };
      case "medium":
        return { bg: "bg-white", border: "border-yellow-300", badge: "bg-yellow-100 text-yellow-700", accent: "text-yellow-600" };
      case "high":
        return { bg: "bg-white", border: "border-gray-300", badge: "bg-gray-100 text-gray-700", accent: "text-gray-600" };
      default:
        return { bg: "bg-white", border: "border-gray-300", badge: "bg-gray-100 text-gray-700", accent: "text-gray-600" };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-700 bg-green-100";
      case "unpaid":
        return "text-red-700 bg-red-100";
      case "partial":
        return "text-orange-700 bg-orange-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  if (isLoading) return <p className="p-8 text-gray-500">Loading ledger records...</p>;

  if (error)
    return (
      <div className="p-8 text-red-500">
        Failed to load ledger records: {
        error instanceof Error ? error.message : "Unknown error"}
        <button
          onClick={() => window.location.reload()}
          className="ml-4 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );

  if (displayLedgers.length === 0) 
    return 
    <p className="p-8 text-gray-500">No ledger records found.</p>;

  return (
    <div className="space-y-6">
      {/* 提醒卡片 */}
      {(alert.overSoonCount > 0 || alert.overdateCount > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {alert.overdateCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      {alert.overdateCount} Overdue Payment{alert.overdateCount > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-red-600">
                      Immediate action required
                    </p>
                  </div>
                </div>
              )}

              {alert.overSoonCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-yellow-700">
                      {alert.overSoonCount} Payment{alert.overSoonCount > 1 ? "s" : ""} Due Soon
                    </p>
                    <p className="text-xs text-yellow-600">
                      Due within 7 days
                    </p>
                  </div>
                </div>
              )}
            </div>

Jade peakz, [9/1/26 15:25 ]


            <button
              onClick={() => setShowAlertDetails(!showAlertDetails)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {showAlertDetails ? "Hide Details" : "View Details"}
            </button>
          </div>

          {/* 详细信息展开 */}
          {showAlertDetails && alertDetails && (
            <div className="mt-4 border-t border-amber-200 pt-4">
              {alertDetails.overdated.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-semibold text-red-700">Overdue Payments:</h4>
                  <div className="space-y-2">
                    {alertDetails.overdated.map((item: any) => (
                      <div
                        key={item.ledger_id}
                        className="flex items-center justify-between rounded bg-red-50 p-2 text-sm"
                      >
                        <span className="font-medium text-red-900">{item.vendor_name}</span>
                        <div className="flex gap-4 text-red-700">
                          <span>Due: {new Date(item.payment_duedate).toLocaleDateString()}</span>
                          <span className="font-semibold">${item.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alertDetails.dueSoon.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-yellow-700">Due Soon:</h4>
                  <div className="space-y-2">
                    {alertDetails.dueSoon.map((item: any) => (
                      <div
                        key={item.ledger_id}
                        className="flex items-center justify-between rounded bg-yellow-50 p-2 text-sm"
                      >
                        <span className="font-medium text-yellow-900">{item.vendor_name}</span>
                        <div className="flex gap-4 text-yellow-700">
                          <span>In {item.daysUntilDue} days</span>
                          <span className="font-semibold">${item.balance.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 卡片式列表 */}
      <div className="grid grid-cols-1 gap-4">
        {displayLedgers.map((ledger) => {
          const isExpanded = expandedIds.has(ledger.ledger_id);
          const colors = getStatusColor(ledger.term_status);
          const daysUntilDue = ledger.payment_duedate
            ? Math.ceil(
                (new Date(ledger.payment_duedate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;


          return (
            <div
              key={ledger.ledger_id}
              className={`rounded-lg border-2 transition-all ${colors.border} ${colors.bg} shadow-sm hover:shadow-md`}
            >
              {/* 卡片头部 */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* 左侧：供应商信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{ledger.vendor_name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${ledger.source_type === "purchase"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {ledger.source_type === "purchase" ? "Purchase" : "Refund"}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
                        {ledger.term_status === "overdue"
                          ? "Overdue"
                          : ledger.term_status === "low"
                          ? "Due Soon"
                          : ledger.term_status === "medium"
                          ? "Medium"
                          : "Safe"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600">
                      Created: {new Date(ledger.created_at).toLocaleDateString()}
                      {ledger.payment_duedate && (
                        <>
                          {" "} • Due: {new Date(ledger.payment_duedate).toLocaleDateString()}
                          {daysUntilDue !== null && (
                            <>
                              {" "}
                              <span
                                className={
                                  daysUntilDue < 0
                                    ? "text-red-600 font-semibold"
                                    : daysUntilDue <= 7
                                    ? "text-orange-600 font-semibold"
                                    : "text-gray-600"
                                }
                              >
                                ({daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days remaining`})
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>

                  {/* 右侧：金额 & 按钮 */}
                  <div className="text-right flex flex-col items-end gap-3">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        Total: <span className="text-lg font-bold text-blue-600">${
                        ledger.debit.toFixed(2)
                        }</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Paid: <span className="text-lg font-bold text-green-600">${
                        ledger.credit.toFixed(2)}</span>
                      </div>
                      <div className={`text-sm font-semibold ${ledger.balance > 0 ? "text-red-600" : "text-gray-400"}`}>
                        Balance: ${
                        ledger.balance.toFixed(2)}
                      </div>
                    </div>

Jade peakz, [9/1/26 15:25 ]


                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <UpdateLedgerForm
                        ledger={ledger}
                        onSuccess={onLedgerUpdated}
                      />
                      <DeleteLedger
                        ledger_id={ledger.ledger_id}
                        vendor_name={ledger.vendor_name}
                        onSuccess={onLedgerDeleted}
                      />
                    </div>
                  </div>

                  {/* 展开按钮 */}
                  {ledger.note && (
                    <button
                      onClick={() => toggleExpand(ledger.ledger_id)}
                      className="text-gray-500 hover:text-gray-700 transition"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>

                {/* 付款状态 */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(ledger.payment_status)}`}
                  >
                    {ledger.payment_status.charAt(0).toUpperCase() + ledger.payment_status.slice(1)}
                  </span>
                </div>
              </div>

              {/* 展开详情 - 备注 */}
              {isExpanded && ledger.note && (
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Note:</p>
                  <p className="text-sm text-gray-600">{ledger.note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}