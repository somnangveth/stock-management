"use client";

import InvoiceTable, { InvoiceTableProps } from "@/app/components/catalog/invoicetable";
import MemberDetailCatalog from "@/app/components/catalog/memberdetailcatalog.tsx";
import { SaleItem } from "@/app/components/catalog/receiptcard";
import { styledToast } from "@/app/components/toast";
import { SubmitBtn, view, ViewIconBtn } from "@/app/components/ui";
import {
  fetchContact,
  fetchDealers,
  fetchProducts,
  fetchSaleItems,
  fetchSales,
} from "@/app/functions/admin/api/controller";
import { updateProcessStatus } from "@/app/functions/admin/sale/sale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"
import { Dealer } from "@/type/membertype";
import { Sale, Product } from "@/type/producttype";
import { useQueries } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import Barcode from "react-barcode";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type BaseSalePanelProps = {
  title?: string;
  sales?: Sale[];
  allowedStatuses?: string[];
  showInvoiceFields?: boolean;
};

type InvoiceTablePanelProps = {
  dealer: Dealer;
  saleData: Sale;
  saleItemData: SaleItem[];
  onBack: () => void;
};


type InvoicePanelProps = {
  sales: (Sale & { items: SaleItem[] })[];
  dealer: Dealer;
};

export function InvoiceTablePanel({
  dealer,
  saleData,
  saleItemData,
  onBack,
}: InvoiceTablePanelProps) {
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <InvoiceTable
        dealer={dealer}
        saleData={saleData}
        saleItemData={saleItemData}
      />
    </div>
  );
}

export function InvoicePanel({ sales, dealer }: InvoicePanelProps) {
  const [mode, setMode] = useState<"list" | "invoice">("list");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedItems, setSelectedItems] = useState<SaleItem[]>([]);

  /* ================= INVOICE VIEW ================= */
  if (mode === "invoice" && selectedSale) {
    return (
      <InvoiceTablePanel
        dealer={dealer}
        saleData={selectedSale}
        saleItemData={selectedItems}
        onBack={() => {
          setMode("list");
          setSelectedSale(null);
          setSelectedItems([]);
        }}
      />
    );
  }

  /* ================= LIST VIEW ================= */
  return (
    <div>
      <Link
        href="/admin/salesb2b/components/dealerdetail"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back
      </Link>
      {/* Header */}
      <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm font-semibold text-gray-600 border-b mb-5">
        <span>Sale ID</span>
        <span>Created At</span>
        <span>Total</span>
        <span>Due Date</span>
        <span>Status</span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3">
        {sales.map((sale) => (
          <div
            key={sale.sale_id}
            className="grid grid-cols-5 gap-4 items-center border rounded-lg p-4 bg-white"
          >
            <Barcode
              value={String(sale.sale_id)}
              fontSize={6}
              height={18}
              width={0.2}
            />

            <span className="text-gray-500">
              {sale.created_at.split("T")[0]}
            </span>

            <span className="font-semibold">
              ${sale.total_amount}
            </span>

            <span>{sale.payment_duedate}</span>

            <Button
              className={ViewIconBtn}
              onClick={() => {
                setSelectedSale(sale);
                setSelectedItems(sale.items || []);
                setMode("invoice");
              }}
            >
              {view}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DraftPanel({
  sales
}: BaseSalePanelProps) {
  const [isPending, startTransition] = useTransition();


  async function onUpdate(saleId: string) {
    startTransition(async () => {
      try {
        const result = await updateProcessStatus(saleId, "delivered");
        if (!result) {
          styledToast.error("Failed to update status");
          return;
        }
        styledToast.success(`Status updated to "delivered"`);
        window.location.reload(); 
      } catch (error) {
        console.error(error);
        styledToast.error("Something went wrong");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-5 md:grid-cols-6 gap-4 px-4 py-2 text-sm font-semibold text-gray-600 border-b mb-5">
        <span>Sale ID</span>
        <span className="text-center">Created At</span>
        <span className="text-center">Total Amount</span>
        <span className="text-center">Process Status</span>
        <span className="text-center">Action</span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3">
        {sales?.map((sale) => (
          <div
            key={sale.sale_id}
            className="grid grid-cols-5 md:grid-cols-5 gap-4 items-center border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition"
          >
            {/* Sale ID */}
            <div className="flex justify-center md:justify-start">
              <Barcode value={String(sale.sale_id)} fontSize={6} height={18} width={0.4} />
            </div>

            {/* Date */}
            <div className="text-gray-500 text-sm">
              {sale.created_at.split("T")[0]}
            </div>

            {/* Total */}
            <div className="font-semibold text-lg text-gray-800">
              ${sale.total_amount}
            </div>

            <div className="text-center">
             <span className={`inline-flex font-medium text-xs rounded-full px-2 py-1
              ${sale.process_status === "draft"
                ? "text-amber-700 bg-yellow-100"
                : "bg-gray-100"
              }`}>
               {sale.process_status}
             </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Button
              className={ViewIconBtn}
              onClick={() => <></>}>
                {view}
              </Button>
              <Button
              className="bg-amber-600 text-white text-xs"
              onClick={() => onUpdate(sale.sale_id)}>
                {isPending ? (
                  "updating..."
                ):("Packaged")}
              </Button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export function DeliverPanel({
  sales
}: BaseSalePanelProps) {
  const [isPending, startTransition] = useTransition();


  async function onUpdate(saleId: string) {
    startTransition(async () => {
      try {
        const result = await updateProcessStatus(saleId, "completed");
        if (!result) {
          styledToast.error("Failed to update status");
          return;
        }
        styledToast.success(`Status updated to "delivered"`);
        window.location.reload(); 
      } catch (error) {
        console.error(error);
        styledToast.error("Something went wrong");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-5 md:grid-cols-6 gap-4 px-4 py-2 text-sm font-semibold text-gray-600 border-b mb-5">
        <span>Sale ID</span>
        <span className="text-center">Created At</span>
        <span className="text-center">Total Amount</span>
        <span className="text-center">Process Status</span>
        <span className="text-center">Action</span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3">
        {sales?.map((sale) => (
          <div
            key={sale.sale_id}
            className="grid grid-cols-5 md:grid-cols-5 gap-4 items-center border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition"
          >
            {/* Sale ID */}
            <div className="flex justify-center md:justify-start">
              <Barcode value={String(sale.sale_id)} fontSize={6} height={18} width={0.4} />
            </div>

            {/* Date */}
            <div className="text-gray-500 text-sm">
              {sale.created_at.split("T")[0]}
            </div>

            {/* Total */}
            <div className="font-semibold text-lg text-gray-800">
              ${sale.total_amount}
            </div>

            <div className="text-center">
             <span className="inline-flex font-medium text-xs px-2 py-1 text-purple-700 bg-purple-100">
              packaged
             </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Button
              className="bg-blue-600 text-white px-2 py-1"
              onClick={() => onUpdate(sale.sale_id)}>
                {isPending ? (
                  "updating..."
                ):("Deliver")}
              </Button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

export function CompletePanel({
  sales
}: BaseSalePanelProps) {
  const [isPending, startTransition] = useTransition();


  async function onUpdate(saleId: string) {
    startTransition(async () => {
      try {
        const result = await updateProcessStatus(saleId, "completed");
        if (!result) {
          styledToast.error("Failed to update status");
          return;
        }
        styledToast.success(`Status updated to "delivered"`);
        window.location.reload(); 
      } catch (error) {
        console.error(error);
        styledToast.error("Something went wrong");
      }
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-5 md:grid-cols-6 gap-4 px-4 py-2 text-sm font-semibold text-gray-600 border-b mb-5">
        <span>Sale ID</span>
        <span className="text-center">Created At</span>
        <span className="text-center">Total Amount</span>
        <span className="text-center">Process Status</span>
        <span className="text-center">Action</span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3">
        {sales?.map((sale) => (
          <div
            key={sale.sale_id}
            className="grid grid-cols-5 md:grid-cols-5 gap-4 items-center border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition"
          >
            {/* Sale ID */}
            <div className="flex justify-center md:justify-start">
              <Barcode value={String(sale.sale_id)} fontSize={6} height={18} width={0.4} />
            </div>

            {/* Date */}
            <div className="text-gray-500 text-sm">
              {sale.created_at.split("T")[0]}
            </div>

            {/* Total */}
            <div className="font-semibold text-lg text-gray-800">
              ${sale.total_amount}
            </div>

            <div className="text-center">
             <span className="inline-flex font-medium text-xs px-2 py-1 text-purple-700 bg-purple-100">
              packaged
             </span>
            </div>

            <div className="flex items-center gap-2 text-gray-600">
              <Button
              className="bg-green-600 text-white px-2 py-1">
                Completed
              </Button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
/* ================= PAGE ================= */
export default function DealerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Fetch all queries
  const results = useQueries({
    queries: [
      { queryKey: ["dealerQuery"], queryFn: fetchDealers },
      { queryKey: ["contactQuery"], queryFn: fetchContact },
      { queryKey: ["saleQuery"], queryFn: fetchSales },
      { queryKey: ["saleItemQuery"], queryFn: fetchSaleItems },
      { queryKey: ["productQuery"], queryFn: fetchProducts },
    ],
  });

  // Always provide safe defaults to avoid undefined
  const dealerData = results[0].data || [];
  const contactData = results[1].data || [];
  const allSaleData = results[2].data || [];
  const saleItemData = results[3].data || [];
  const productData = results[4].data || [];

  const isLoading = results.some((q) => q.isLoading);
  const hasError = results.some((q) => q.isError);

  // All hooks called unconditionally
  const currentDealer = useMemo(
    () => dealerData.find((d: any) => d.dealer_id === id) || null,
    [dealerData, id]
  );

  const currentContact = useMemo(
    () =>
      currentDealer
        ? contactData.find((c: any) => c.contact_id === currentDealer.contact_id) || null
        : null,
    [currentDealer, contactData]
  );

  const saleData = useMemo(
    () => allSaleData.filter((s: Sale) => s.customertype === "Dealer" && s.dealer_id === id),
    [allSaleData, id]
  );

  console.log('sale data', saleData);

  const productMap = useMemo(
    () =>
      productData.reduce((acc: any, p: Product) => {
        acc[p.product_id] = p;
        return acc;
      }, {}),
    [productData]
  );

  const saleItemsBySaleId = useMemo(
    () =>
      saleItemData.reduce((acc: any, item: any) => {
        if (!acc[item.sale_id]) acc[item.sale_id] = [];
        acc[item.sale_id].push({
          ...item,
          product: item.product || productMap[item.product_id] || {
            product_id: item.product_id,
            product_name: "Unknown Product",
            price: 0,
          },
        });
        return acc;
      }, {}),
    [saleItemData, productMap]
  );

  const enhancedSales = useMemo(
    () =>
      saleData.map((s: Sale) => {
        const items = saleItemsBySaleId[s.sale_id] || [];
        return { ...s, items, itemCount: items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) };
      }),
    [saleData, saleItemsBySaleId]
  );

  console.log('enhanced sales', enhancedSales);


  // Split by status
  const invoiceSales = enhancedSales;
  const draftSales = enhancedSales.filter((s: Sale) => s.process_status === "draft"); 
  const deliveredSales = enhancedSales.filter((s: Sale) => s.process_status === "delivered");
  const completedSales = enhancedSales.filter((s: Sale) => s.process_status === "completed");


  const extraPanels = [
    { key: "Invoice", 
      label: "Invoice", 
      component: 
      <InvoicePanel
      dealer={currentDealer}
      sales={invoiceSales}/> 
    },
    { 
      key: "Draft", 
      label: "Draft", 
      component: 
      <DraftPanel
      title="Draft"
      sales={draftSales}
      allowedStatuses={["delivered", "completed"]}
    />
    },
    { 
      key: "Delivered", 
      label: "Delivered", 
      component: 
      <DeliverPanel
      sales={deliveredSales}
    />
    },
    { 
      key: "Completed", 
      label: "Completed", 
      component: 
      <CompletePanel
      sales={completedSales}
    />
    },
  ];

  if (isLoading) return <p className="flex items-center justify-center">Loading...</p>;
  if (hasError) return <p className="flex items-center justify-center text-red-500">Failed to fetch data</p>;
  if (!currentDealer) return <p className="flex items-center justify-center">No Dealer Found</p>;

  return <MemberDetailCatalog dealer={currentDealer}  extraPanels={extraPanels} />;
}

