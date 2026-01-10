"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchDisposedProducts } from "@/app/functions/admin/stock/expiry/expiry";
import { format } from "date-fns";

export default function DisposedProductsView() {
  const { data: disposedProducts, isLoading, error } = useQuery({
    queryKey: ["disposedProducts"],
    queryFn: fetchDisposedProducts,
  });

  if (isLoading) {
    return <div className="p-4">Loading disposed products...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading disposed products</div>;
  }

  if (!disposedProducts || disposedProducts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No disposed products found
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Disposed Products History</h2>
      
      <div className="space-y-4">
        {disposedProducts.map((disposal: any) => (
          <div
            key={disposal.product_disposal_id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Product ID</p>
                <p className="font-medium">{disposal.product_id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Batch ID</p>
                <p className="font-medium">{disposal.batch_id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Quantity Disposed</p>
                <p className="font-medium">{disposal.quantity_disposed}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Cost Loss</p>
                <p className="font-medium text-red-600">
                  ${disposal.cost_loss.toFixed(2)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Disposal Date</p>
                <p className="font-medium">
                  {format(new Date(disposal.disposal_date), "MMM dd, yyyy")}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Disposal Method</p>
                <p className="font-medium capitalize">
                  {disposal.disposal_method.replace("_", " ")}
                </p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Reason</p>
                <p className="font-medium">{disposal.reason}</p>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-400">
              Created: {format(new Date(disposal.created_at), "MMM dd, yyyy HH:mm")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}