"use client";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";
import Barcode from "react-barcode";

// 1️. Allowed table columns
type ColumnKey =
  | "select"
  | "sku-code"
  | "product_image"
  | "product_name"
  | "category_id"
  | "base_unit"

  | "sale_id"
  | "subtotal"
  | "payment_method"
  | "created_at"
  | "status"

  | "base_price"
  | "shipping"
  | "discount"
  | "total_price"
  | "b2b_price"

  | "quantity"
  | "date"
  | "description"

  | "current_quantity"
  | "alert_type"

  // Expired Batch
  | "manufacture_date"
  | "expiry_date"
  | "recieved_date"
  | "quantity_remaining"


  // Action
  | "action";

// 2️. Product type
type Product = {
  sku_code?: number | string;
  product_image?: string;
  product_name?: string;
  category_name?: string;
  subcategory_name?: string;
  base_unit?: string;

  //Sale
  sale_id?: string;
  subtotal?: string;
  payment_method?: string;
  created_at?: string;
  process_status?: string;

  //Price
  base_price?: number;
  profit_price?: number;
  tax_amount?: number;
  shipping?: number;
  discount_amount?: number;
  total_amount?: number; 
  b2b_price?: number;

  quantity?: number;
  date?: string;
  description?: string;

  current_quantity?: number;
  alert_type?: string;
  manufacture_date?: string;
  expiry_date?: string;
  received_date?: string;
  quantity_remaining?: number;
  batch_count?: number;
  batches?: any[];
};

const formatDate = (value: string | Date | undefined) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(); 
};

// 3️. Component props type
interface ProductTableProps {
  product: Product[];
  columns: ColumnKey[];
  form?: ReactNode | ((product: Product) => ReactNode);
  itemsPerPage: number;
  onSelectionChange?: (selectedProducts: Product[]) => void;
}

// 4️. Table component
export default function ProductTable({ 
  product, 
  columns, 
  form, 
  itemsPerPage,
  onSelectionChange
}: ProductTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set());

  if (!product || !Array.isArray(product)) {
    return <p>No products to display</p>;
  }

  if (product.length === 0) {
    return <p className="text-center p-4 text-gray-500">No products found matching your filters</p>;
  }

  //Alert Type Labels 
  const alertTypeLabels: Record<string, string> = {
    active: "active",
    overstock: "overstock",
    low_stock: "low stock",
    out_of_stock: "out of stock",
  }
  const totalPages = Math.ceil(product.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = product.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle individual row selection
  const handleRowSelect = (skuCode: number | string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(skuCode)) {
      newSelected.delete(skuCode);
    } else {
      newSelected.add(skuCode);
    }
    setSelectedRows(newSelected);
    
    // Call callback with selected products
    if (onSelectionChange) {
      const selected = product.filter(p => newSelected.has(p.sku_code!));
      onSelectionChange(selected);
    }
  };


  // Handle select all on current page
  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedRows);
    
    if (checked) {
      currentProducts.forEach(p => {
        if (p.sku_code) newSelected.add(p.sku_code);
      });
    } else {
      currentProducts.forEach(p => {
        if (p.sku_code) newSelected.delete(p.sku_code);
      });
    }
    
    setSelectedRows(newSelected);
    
    if (onSelectionChange) {
      const selected = product.filter(p => newSelected.has(p.sku_code!));
      onSelectionChange(selected);
    }
  };

  // Check if all current page items are selected
  const isAllCurrentPageSelected = currentProducts.every(p => 
    p.sku_code && selectedRows.has(p.sku_code)
  );

  // Check if some (but not all) current page items are selected
  const isSomeCurrentPageSelected = currentProducts.some(p => 
    p.sku_code && selectedRows.has(p.sku_code)
  ) && !isAllCurrentPageSelected;

  return (
    <div className="space-y-4">

      <Table className="w-full">
        {/* Header */}
        <TableHeader>
          <TableRow>
            {columns.includes("select") && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  ref={input => {
                    if (input) input.indeterminate = isSomeCurrentPageSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
              </TableHead>
            )}
            {columns.includes("sku-code") && <TableHead>ID</TableHead>}
            {columns.includes("sale_id") && <TableHead>Receipt ID:</TableHead>}

            {columns.includes("product_image") && <TableHead>Image</TableHead>}
            {columns.includes("product_name") && <TableHead>Name</TableHead>}
            {columns.includes("category_id") && <TableHead className="text-center">Category</TableHead>}
            {columns.includes("base_unit") && <TableHead>Unit</TableHead>}

            {columns.includes("base_price") && <TableHead>Base Price</TableHead>}
            {columns.includes("subtotal") && <TableHead>Subtotal</TableHead>}
            {columns.includes("shipping") && <TableHead>Shipping </TableHead>}
            {columns.includes("discount") && <TableHead>Discount</TableHead>}
            {columns.includes("b2b_price") && <TableHead>B2B Price</TableHead>}
            {columns.includes("total_price") && <TableHead>Total Price</TableHead>}

            {columns.includes("payment_method") && <TableHead>Payment Method</TableHead>}

            {columns.includes("quantity") && <TableHead>Qty</TableHead>}
            {columns.includes("date") && <TableHead>Date</TableHead>}
            {columns.includes("description") && <TableHead>Description</TableHead>}

            {columns.includes("current_quantity") && <TableHead className="text-center">Current Qty</TableHead>}
            {columns.includes("alert_type") && <TableHead className="text-center">Status</TableHead>}

            {columns.includes("manufacture_date") && <TableHead>Manufacture Date</TableHead>}
            {columns.includes("recieved_date") && <TableHead>Received Date</TableHead>}
            {columns.includes("expiry_date") && <TableHead>Expiry Date</TableHead>}

            {columns.includes("created_at") && <TableHead>Created At</TableHead>}
            {columns.includes("status") && <TableHead>Status</TableHead>}

            {columns.includes("quantity_remaining") && <TableHead>In Stock</TableHead>}
            {columns.includes("action") && <TableHead className="text-left">Action</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {currentProducts.map((products, index) => (
            <TableRow 
              key={products.sku_code || index}
              className="hover:bg-amber-50 transition-colors"
            >
              {columns.includes("select") && (
                <TableCell>
                  <input
                    type="checkbox"
                    checked={products.sku_code ? selectedRows.has(products.sku_code) : false}
                    onChange={() => products.sku_code && handleRowSelect(products.sku_code)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </TableCell>
              )}
              {columns.includes("sku-code") && <TableCell>{products.sku_code}</TableCell>}
              {columns.includes("sale_id") && 
              <TableCell>
                <Barcode 
                height={15} 
                width={0.3} 
                value={String(products.sale_id)}
                fontSize={5}
                textMargin={2}/>
              </TableCell>}

              {columns.includes("product_image") && (
                <TableCell>
                  {products.product_image ? (
                    <img 
                      src={products.product_image} 
                      alt={products.product_name} 
                      className="w-10 h-10 rounded-lg object-cover" 
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
              )}
              {columns.includes("product_name") && <TableCell>{products.product_name || "—"}</TableCell>}
              {columns.includes("category_id") && (
                <TableCell className="text-center">
                  <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-amber-700">
                    {products.category_name || "—"}
                  </p>
                </TableCell>
              )}
              
              {columns.includes("base_unit") && <TableCell>{products.base_unit || "—"}</TableCell>}


              {columns.includes("base_price") && <TableCell>{products.base_price || "0"}</TableCell>}
              {columns.includes("subtotal") && <TableCell>{products.subtotal}</TableCell>}
              {columns.includes("shipping") && <TableCell>{products.shipping || "0"}</TableCell>}
              {columns.includes("discount") && <TableCell>{products.discount_amount || "0"}</TableCell>}
              {columns.includes("b2b_price") && <TableCell>{products.b2b_price || "0"}</TableCell>}
              {columns.includes("total_price") && <TableCell>{products.total_amount || "0"}</TableCell>}

              {columns.includes("payment_method") && <TableCell>{products.payment_method}</TableCell>}

              {columns.includes("quantity") && <TableCell>{products.quantity ?? "—"}</TableCell>}
              {columns.includes("date") && <TableCell>{products.date || "—"}</TableCell>}
              {columns.includes("description") && <TableCell>{products.description || "—"}</TableCell>}

              {columns.includes("current_quantity") && <TableCell className="text-center">{products.current_quantity || "-"}</TableCell>}
              {columns.includes("alert_type") && (
                <TableCell className="text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    products.alert_type === "active"
                    ? "text-green-700 bg-green-300"
                    : products.alert_type === "overstock"
                      ? "text-orange-600 bg-yellow-300"
                      : products.alert_type === "low_stock"
                        ? "text-amber-700 bg-orange-300"
                        : products.alert_type === "out_of_stock"
                          ? "text-red-700 bg-red-300"
                          : "bg-gray-100 text-gray-700"
                  }`}>
                    {alertTypeLabels[products.alert_type as string] || "-"}
                  </span>
                </TableCell>
              )}
              {columns.includes("manufacture_date") && (
                <TableCell>{formatDate(products.manufacture_date)}</TableCell>
              )}
              {columns.includes("recieved_date") && (
                <TableCell>{formatDate(products.received_date)}</TableCell>
              )}
              {columns.includes("expiry_date") && (
                <TableCell>{formatDate(products.expiry_date)}</TableCell>
              )}

              {columns.includes("created_at") && (
                <TableCell>{formatDate(products.created_at)}</TableCell>
              )}

              {columns.includes("status") && <TableCell>{products.process_status}</TableCell>}
              {columns.includes("quantity_remaining") && (
                <TableCell>
                  <span className={products.quantity_remaining === 0 ? 'text-red-600 font-bold' : ''}>
                    {products.quantity_remaining ?? "—"}
                  </span>
                </TableCell>
              )}
              {columns.includes("action") && (
                <TableCell className="text-right">
                  {typeof form === "function" ? form(products) : form}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, product.length)} of {product.length} products
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    currentPage === page
                      ? "bg-amber-200 text-white"
                      : "border border-amber-300 hover:bg-amber-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-amber-400 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}