"use client";

import { Dealer } from "@/type/membertype";
import { Product, Sale } from "@/type/producttype";

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

export interface InvoiceTableProps {
  saleItemData: SaleItem[];
  saleData: Sale;
  dealer: Dealer;
}

/* ================= HELPERS ================= */

const safeNumber = (value: any): number => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

const currency = (value: number) => value.toFixed(2);

const formatDate = (value?: string | Date) => {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

/* ================= COMPONENT ================= */

export default function InvoiceTable({
  saleItemData,
  saleData,
  dealer
}: InvoiceTableProps) {
  const subtotal = safeNumber(saleData?.subtotal);
  const taxRate = safeNumber(saleData?.tax_amount);
  const taxAmount = safeNumber(saleData?.tax_amount);
  const discountAmount = safeNumber(saleData?.discount_amount);
  const totalAmount = safeNumber(saleData?.total_amount);

  return (
    <div className="max-w-5xl mx-auto bg-white p-10 shadow-md text-sm text-gray-800">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-xl font-semibold">
            {dealer.business_name || "[Company Name]"}
          </h1>
          <p className="text-gray-500">{dealer.shop_address}</p>
          <p className="text-gray-500">
            Phone: {dealer.contact_number || "—"}
          </p>
        </div>

        <div className="text-right">
          <h2 className="text-3xl font-bold text-blue-600">INVOICE</h2>

          <div className="mt-4 border border-gray-200">
            <div className="grid grid-cols-2 bg-blue-600 text-white text-xs font-semibold">
              <div className="px-3 py-2">INVOICE #</div>
              <div className="px-3 py-2">DATE</div>
            </div>
            <div className="grid grid-cols-2 text-center">
              <div className="px-3 py-2">{saleData?.sale_id}</div>
              <div className="px-3 py-2">
                {formatDate(saleData?.created_at)}
              </div>
            </div>
          </div>

          <div className="mt-2 border border-gray-200">
            <div className="grid grid-cols-2 bg-blue-600 text-white text-xs font-semibold">
              <div className="px-3 py-2">CUSTOMER</div>
              <div className="px-3 py-2">TERMS</div>
            </div>
            <div className="grid grid-cols-2 text-center">
              <div className="px-3 py-2">
                {dealer.dealer_name || "—"}
              </div>
              <div className="px-3 py-2">
                {dealer.payment_duedate || "Due Upon Receipt"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BILL TO ================= */}
      <div className="mb-8">
        <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 inline-block">
          BILL TO
        </div>
        <div className="border border-gray-200 p-4">
          <p>{dealer.dealer_name}</p>
          <p>{dealer.business_name}</p>
          <p>{dealer.shop_address}</p>
          <p>{dealer.contact_number}</p>
          <p>{dealer.email_address}</p>
        </div>
      </div>

      {/* ================= ITEMS TABLE ================= */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-blue-600 text-white text-xs">
            <tr>
              <th className="px-3 py-2 text-left">DESCRIPTION</th>
              <th className="px-3 py-2 text-center w-20">PKG QTY</th>
              <th className="px-3 py-2 text-right w-32">UNIT PRICE</th>
              <th className="px-3 py-2 text-right w-32">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {saleItemData?.map((item, index) => (
              <tr key={index} className="border-t">
                <td className="px-3 py-2">
                  {item?.product?.product_name || "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  {item?.package_qty}
                </td>
                <td className="px-3 py-2 text-right">
                  {currency(safeNumber(item?.unit_price))}
                </td>
                <td className="px-3 py-2 text-right">
                  {currency(safeNumber(item?.total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= TOTALS ================= */}
      <div className="flex justify-between items-end mt-10">
        <p className="italic text-gray-500">
          Thank you for your business!
        </p>

        <div className="w-72 border border-gray-200">
          <div className="flex justify-between px-4 py-2">
            <span>SUBTOTAL</span>
            <span>{currency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between px-4 py-2">
              <span>DISCOUNT</span>
              <span>-{currency(discountAmount)}</span>
            </div>
          )}

          {taxRate > 0 && (
            <div className="flex justify-between px-4 py-2">
              <span>TAX RATE</span>
              <span>{taxRate}%</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div className="flex justify-between px-4 py-2">
              <span>TAX</span>
              <span>{currency(taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between px-4 py-3 bg-blue-100 font-semibold">
            <span>TOTAL</span>
            <span>{currency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <p className="text-center text-xs text-gray-500 mt-10">
        If you have any questions about this invoice, please contact
        <br />
        {dealer.contact_number|| "[Name, Phone, Email]"}
      </p>
    </div>
  );
}
