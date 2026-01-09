"use client";

import { Product, Sale } from "@/type/producttype";
import Barcode from "react-barcode";

export type SaleItem = {
  product_id: string;
  sale_id: any;
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  package_qty: number;
};

export interface ReceiptCardProps {
  saleItemData: SaleItem[];
  productData: Product;
  saleData: Sale;
}

export default function ReceiptCard({ saleItemData, productData, saleData }: ReceiptCardProps) {
  // Styling classes
  const text = "text-sm text-gray-600";
  const thead = "text-sm font-semibold text-gray-700";
  const label = "text-sm text-gray-600";
  const value = "text-sm font-medium text-gray-800";

  // Helper function to safely parse numbers
  const safeParseFloat = (value: any): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    return value.toFixed(2);
  };

  // Calculations with null safety
  const subtotal = safeParseFloat(saleData?.subtotal);
  const taxAmount = safeParseFloat(saleData?.tax_amount);
  const discountAmount = safeParseFloat(saleData?.discount_amount);
  const totalAmount = safeParseFloat(saleData?.total_amount);
  const totalItems = saleItemData?.reduce((sum, item) => sum + (item?.quantity || 0), 0) || 0;

  // Format date
  const formatDate = (value: string | Date | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(); 
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-6 font-mono">
      {/* Header */}
      <p className="font-bold text-lg text-center border-b border-gray-300 pb-3 mb-4">
        RECEIPT
      </p>

      {/* Receipt Info */}
      <div className="flex justify-between mb-6">
        <div className="flex flex-col gap-1">
          <p className={text}>Created: {formatDate(saleData?.created_at)}</p>
          <p className={text}>Payment: {saleData?.payment_method || "N/A"}</p>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <p className={text}>Receipt #:</p>
          <div className="scale-75 origin-top-right">
            <Barcode 
              height={15} 
              width={0.1} 
              value={String(saleData?.sale_id || "0")}
              fontSize={8}
              textMargin={2}
            />
          </div>
        </div>
      </div>

      {/* Product Lists */}
      <div className="mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className={`${thead} text-left pb-2`}>Description</th>
              <th className={`${thead} text-center pb-2`}>Qty</th>
              <th className={`${thead} text-right pb-2`}>Unit</th>
              <th className={`${thead} text-right pb-2`}>Amount</th>
            </tr>
          </thead>
        </table>
        <div className="overflow-y-auto max-h-[200px]">
          <table className="w-full border-collapse">
            <tbody>
              {saleItemData?.map((item, index) => {
                const itemTotal = safeParseFloat(item?.total);
                const unitPrice = safeParseFloat(item?.unit_price);
                const quantity = item?.quantity || 0;
                
                return (
                  <tr key={index} className={`${text} border-b border-gray-200`}>
                    <td className="py-2 w-15 truncate">{item?.product?.product_name || "—"}</td>
                    <td className="py-2 text-center">{quantity}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(unitPrice)}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subtotal Calculation */}
      <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-gray-300">
        <div className="flex justify-between">
          <span className={label}>SUBTOTAL:</span>
          <span className={value}>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span className={label}>DISCOUNT:</span>
            <span className={value}>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between">
            <span className={label}>TAX:</span>
            <span className={value}>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className={label}>ITEMS:</span>
          <span className={value}>{totalItems}</span>
        </div>
      </div>

      {/* Total Calculation */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold text-gray-800">TOTAL:</span>
          <span className="text-base font-bold text-gray-800">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-300 text-center">
        <p className="text-xs text-gray-500">Thank you for your purchase!</p>
        <p className="text-xs text-gray-500">Please come again</p>
      </div>
    </div>
  );
}