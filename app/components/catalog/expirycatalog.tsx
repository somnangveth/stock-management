"use client";
import { ExpiryAlert } from "@/type/producttype";
import Image from "next/image";
import Barcode from "react-barcode";

function ProductImageBarcode({
  image,
  name,
  batch
}: {
  image?: string;
  name?: string;
  batch: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-23 w-23 overflow-hidden rounded-lg border bg-white">
        <Image
          src={image || "/assets/product_default.jpg"}
          alt={name || "product image"}
          fill
          className="object-cover"
        />
      </div>
      <Barcode
        value={String(batch)}
        width={0.8}
        height={10}
        fontSize={5}
        margin={0}
      />
    </div>
  );
}

export function MediumExpiryCatalog({
  expired,
  renderForm
}: {
  expired: ExpiryAlert[];
  renderForm?: (item: ExpiryAlert) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-amber-700">Near Expiry Products</h3>
      {expired.map((item: any) => (
        <div
          key={item.expiry_id}
          className="w-full rounded-xl bg-amber-100 border-2 border-amber-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
               <ProductImageBarcode
                image={item.product_image}
                name={item.product_name}
                batch={item.batch_number}
              />
            <div className="space-y-2">
              <p className="font-semibold">{item.product_name}</p>
              <p className="text-red-500 text-sm">
                Expiry date: {new Date(item.expiry_date).toLocaleDateString()}
              </p>
              <p>
                Qty: {item.quantity_remaining}
              </p>
              <div className="inline-block bg-amber-500 text-white py-1 px-3 rounded text-sm font-medium">
                Near Expiry
              </div>
            </div>
            </div>
            {renderForm && <div className="ml-4">{renderForm(item)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HighExpiryCatalog({
  expired,
  renderForm
}: {
  expired: ExpiryAlert[];
  renderForm?: (item: ExpiryAlert) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-orange-700">Expiring Soon</h3>
      {expired.map((item:any) => (
        <div
          key={item.expiry_id}
          className="w-full rounded-xl border-2 border-orange-500 bg-orange-100 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <ProductImageBarcode
                image={item.product_image}
                name={item.product_name}
                batch={item.batch_number}
              />
            <div className="space-y-2">
              <p className="text-sm">Product ID: {item.product_name}</p>
              <p className="text-red-500 text-sm">
                Expiry date: {new Date(item.expiry_date).toLocaleDateString()}
              </p>
              <p>
                Qty: {item.quantity_remaining}
              </p>
              <div className="inline-block bg-orange-700 text-white py-1 px-3 rounded text-sm font-medium">
                Expiring Soon
              </div>
            </div>
            </div>
            {renderForm && <div className="ml-4">{renderForm(item)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CriticalExpiryCatalog({
  expired,
  renderForm
}: {
  expired: ExpiryAlert[];
  renderForm?: (item: ExpiryAlert) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-red-700">Expired Products</h3>
      {expired.map((item: any) => (
        <div
          key={item.expiry_id}
          className="w-full bg-red-100 rounded-xl border-2 border-red-500 p-4"
        >
          <div className="flex items-center justify-between">
             <ProductImageBarcode
                image={item.product_image}
                name={item.product_name}
                batch={item.batch_number}
              />
            <div className="space-y-2">
              <p className="text-sm">Product Name: {item.product_name}</p>
              <p className="text-red-500 text-sm">
                Expiry date: {new Date(item.expiry_date).toLocaleDateString()}
              </p>
              <p>
                Qty: {item.quantity_remaining}
              </p>
              <div className="inline-block bg-red-500 text-white py-1 px-3 rounded text-sm font-medium">
                Expired
              </div>
            </div>
            {renderForm && <div className="ml-4">{renderForm(item)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}


type StockMovement = {
  movement_id: string | number;
  product_id: string | number;
  product_name: string;
  product_image?: string;
  batch_number: string | number;
  movement_type: "adjustment" | "return" | "damage";
  quantity: number;
  cost_loss?: number;
  movement_date: string;
  reason?: string;
  created_at?: string;
};

// Get badge styling based on movement type
function getMovementBadge(type: string) {
  switch (type) {
    case "adjustment":
      return {
        bg: "bg-blue-500",
        border: "border-blue-500",
        cardBg: "bg-blue-50",
        text: "Adjustment",
        icon: "📊"
      };
    case "return":
      return {
        bg: "bg-green-500",
        border: "border-green-500",
        cardBg: "bg-green-50",
        text: "Return",
        icon: "↩️"
      };
    case "damage":
      return {
        bg: "bg-red-500",
        border: "border-red-500",
        cardBg: "bg-red-50",
        text: "Damage",
        icon: "⚠️"
      };
    default:
      return {
        bg: "bg-gray-500",
        border: "border-gray-500",
        cardBg: "bg-gray-50",
        text: "Unknown",
        icon: "❓"
      };
  }
}
