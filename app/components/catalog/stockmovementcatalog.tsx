"use client";
import Image from "next/image";
import Barcode from "react-barcode";

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

export function StockMovementCatalog({
  movements,
  renderForm
}: {
  movements: StockMovement[];
  renderForm?: (item: StockMovement) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">Stock Movements</h3>
      {movements.map((item) => {
        const badge = getMovementBadge(item.movement_type);
        
        return (
          <div
            key={item.movement_id}
            className={`w-full rounded-xl border-2 ${badge.border} ${badge.cardBg} p-4 transition-shadow hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <ProductImageBarcode
                  image={item.product_image}
                  name={item.product_name}
                  batch={item.batch_number}
                />
                
                <div className="space-y-2">
                  <p className="font-semibold text-gray-800">{item.product_name}</p>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Movement Date:</span>
                    <span className="text-sm font-medium">
                      {new Date(item.movement_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Quantity:</span>
                    <span className={`text-sm font-bold ${
                      item.quantity < 0 ? "text-red-600" : "text-green-600"
                    }`}>
                      {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                    </span>
                  </div>
                  
                  {item.cost_loss !== undefined && item.cost_loss > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Cost Loss:</span>
                      <span className="text-sm font-semibold text-red-600">
                        ${item.cost_loss.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {item.reason && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Reason:</span>
                      <span className="text-sm italic text-gray-700">{item.reason}</span>
                    </div>
                  )}
                  
                  <div className={`inline-flex items-center gap-1 ${badge.bg} text-white py-1 px-3 rounded text-sm font-medium`}>
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </div>
                </div>
              </div>
              
              {renderForm && <div className="ml-4">{renderForm(item)}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Separate catalogs for each movement type
export function AdjustmentCatalog({
  movements,
  renderForm
}: {
  movements: StockMovement[];
  renderForm?: (item: StockMovement) => React.ReactNode;
}) {
  const adjustments = movements.filter(m => m.movement_type === "adjustment");
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-blue-700">📊 Stock Adjustments</h3>
      {adjustments.map((item) => (
        <div
          key={item.movement_id}
          className="w-full rounded-xl border-2 border-blue-500 bg-blue-50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <ProductImageBarcode
                image={item.product_image}
                name={item.product_name}
                batch={item.batch_number}
              />
              
              <div className="space-y-2">
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-sm text-gray-600">
                  Date: {new Date(item.movement_date).toLocaleDateString()}
                </p>
                <p className={`font-bold ${item.quantity < 0 ? "text-red-600" : "text-green-600"}`}>
                  Qty: {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                </p>
                {item.reason && <p className="text-sm italic">Reason: {item.reason}</p>}
                <div className="inline-block bg-blue-500 text-white py-1 px-3 rounded text-sm font-medium">
                  Adjustment
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

export function ReturnCatalog({
  movements,
  renderForm
}: {
  movements: StockMovement[];
  renderForm?: (item: StockMovement) => React.ReactNode;
}) {
  const returns = movements.filter(m => m.movement_type === "return");
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-green-700">↩️ Product Returns</h3>
      {returns.map((item) => (
        <div
          key={item.movement_id}
          className="w-full rounded-xl border-2 border-green-500 bg-green-50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <ProductImageBarcode
                image={item.product_image}
                name={item.product_name}
                batch={item.batch_number}
              />
              
              <div className="space-y-2">
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-sm text-gray-600">
                  Return Date: {new Date(item.movement_date).toLocaleDateString()}
                </p>
                <p className="font-bold text-green-600">Qty: +{item.quantity}</p>
                {item.reason && <p className="text-sm italic">Reason: {item.reason}</p>}
                <div className="inline-block bg-green-500 text-white py-1 px-3 rounded text-sm font-medium">
                  Return
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

export function DamageCatalog({
  movements,
  renderForm
}: {
  movements: StockMovement[];
  renderForm?: (item: StockMovement) => React.ReactNode;
}) {
  const damages = movements.filter(m => m.movement_type === "damage");
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-red-700">⚠️ Damaged Products</h3>
      {damages.map((item) => (
        <div
          key={item.movement_id}
          className="w-full rounded-xl border-2 border-red-500 bg-red-50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <ProductImageBarcode
                image={item.product_image}
                name={item.product_name}
                batch={item.batch_number}
              />
              
              <div className="space-y-2">
                <p className="font-semibold">{item.product_name}</p>
                <p className="text-sm text-gray-600">
                  Damage Date: {new Date(item.movement_date).toLocaleDateString()}
                </p>
                <p className="font-bold text-red-600">Qty Lost: {Math.abs(item.quantity)}</p>
                {item.cost_loss && (
                  <p className="text-red-600 font-semibold">
                    Cost Loss: ${item.cost_loss.toFixed(2)}
                  </p>
                )}
                {item.reason && <p className="text-sm italic">Reason: {item.reason}</p>}
                <div className="inline-block bg-red-500 text-white py-1 px-3 rounded text-sm font-medium">
                  Damage
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