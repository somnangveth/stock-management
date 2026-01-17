"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchAttribute } from "@/app/functions/admin/api/controller";

interface AttributeInput {
  id: string;
  attribute_name: string;
  module: string;
  quantity: number;
  import_price: number;
  sale_price: number;
}

export default function AddProductAttribute() {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [attributes, setAttributes] = useState<AttributeInput[]>([
    { id: "1", attribute_name: "", module: "", quantity: 0, import_price: 0, sale_price: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["productQuery"],
    queryFn: fetchProducts,
  });

  const { data: existingAttributes } = useQuery({
    queryKey: ["attributeQuery"],
    queryFn: fetchAttribute,
  });

  const modules = ["size", "color", "weight", "volume", "material"];

  const addAttribute = () => {
    const newId = (Math.max(...attributes.map(a => parseInt(a.id)), 0) + 1).toString();
    setAttributes([
      ...attributes,
      { id: newId, attribute_name: "", module: "", quantity: 0, import_price: 0, sale_price: 0 }
    ]);
  };

  const removeAttribute = (id: string) => {
    if (attributes.length > 1) {
      setAttributes(attributes.filter(attr => attr.id !== id));
    }
  };

  const updateAttribute = (id: string, field: keyof AttributeInput, value: any) => {
    setAttributes(attributes.map(attr =>
      attr.id === id ? { ...attr, [field]: value } : attr
    ));
  };

  const handleSubmit = async () => {
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    const invalidAttributes = attributes.filter(
      attr => !attr.attribute_name || !attr.module || attr.quantity <= 0
    );

    if (invalidAttributes.length > 0) {
      alert("Please fill in all required fields (name, module, quantity)");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, delete existing attributes for this product
      const deleteResponse = await fetch('/api/admin/deleteproductattributes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedProduct })
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete existing attributes");
      }

      // Then insert new attributes
      for (const attr of attributes) {
        // Create sale price entry
        const salePriceResponse = await fetch('/api/admin/createsaleprice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: selectedProduct,
            attribute_name: attr.attribute_name,
            module: attr.module,
            attribute_value: attr.quantity,
            price_value: attr.sale_price
          })
        });

        if (!salePriceResponse.ok) {
          throw new Error(`Failed to create sale price for ${attr.attribute_name}`);
        }

        const salePriceData = await salePriceResponse.json();
        const salePriceId = salePriceData.price_id;

        // Create import price entry linked to sale price
        const importPriceResponse = await fetch('/api/admin/createimportprice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sale_price_id: salePriceId,
            price_value: attr.import_price,
            price_variance: attr.sale_price - attr.import_price
          })
        });

        if (!importPriceResponse.ok) {
          throw new Error(`Failed to create import price for ${attr.attribute_name}`);
        }
      }

      alert("Attributes updated successfully!");
      
      // Reset form
      setAttributes([
        { id: "1", attribute_name: "", module: "", quantity: 0, import_price: 0, sale_price: 0 }
      ]);
      setSelectedProduct("");

    } catch (error) {
      console.error("Error updating attributes:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (productsLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading products...</div>
      </div>
    );
  }

  const selectedProductData = products?.find((p: any) => p.product_id === selectedProduct);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add/Update Product Attributes</h1>
        <p className="text-gray-600">Define attributes for a product. This will replace all existing attributes.</p>
      </div>

      {/* Product Selection */}
      <div className="bg-white border border-gray-300 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Product</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product *</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a product --</option>
              {products?.map((product: any) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.product_name} ({product.sku_code})
                </option>
              ))}
            </select>
          </div>
          {selectedProductData && (
            <div className="bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm"><strong>Package Type:</strong> {selectedProductData.package_type}</p>
              <p className="text-sm"><strong>Units per Package:</strong> {selectedProductData.units_per_package}</p>
            </div>
          )}
        </div>
      </div>

      {/* Attributes */}
      <div className="bg-white border border-gray-300 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Attributes</h2>
          <button
            onClick={addAttribute}
            className="bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            disabled={!selectedProduct}
          >
            + Add Attribute
          </button>
        </div>

        <div className="space-y-4">
          {attributes.map((attr, index) => (
            <div key={attr.id} className="border border-gray-200 p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium">Attribute {index + 1}</h3>
                {attributes.length > 1 && (
                  <button
                    onClick={() => removeAttribute(attr.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Attribute Name *</label>
                  <input
                    type="text"
                    value={attr.attribute_name}
                    onChange={(e) => updateAttribute(attr.id, "attribute_name", e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Small, Red"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Module *</label>
                  <select
                    value={attr.module}
                    onChange={(e) => updateAttribute(attr.id, "module", e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select --</option>
                    {modules.map(module => (
                      <option key={module} value={module}>{module.charAt(0).toUpperCase() + module.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={attr.quantity}
                    onChange={(e) => updateAttribute(attr.id, "quantity", parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Import Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={attr.import_price}
                    onChange={(e) => updateAttribute(attr.id, "import_price", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={attr.sale_price}
                    onChange={(e) => updateAttribute(attr.id, "sale_price", parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              {attr.import_price > 0 && attr.sale_price > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Profit Margin: ${(attr.sale_price - attr.import_price).toFixed(2)} 
                  ({attr.import_price > 0 ? ((attr.sale_price - attr.import_price) / attr.import_price * 100).toFixed(1) : 0}%)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => {
            setAttributes([
              { id: "1", attribute_name: "", module: "", quantity: 0, import_price: 0, sale_price: 0 }
            ]);
            setSelectedProduct("");
          }}
          className="bg-gray-500 text-white px-6 py-2 hover:bg-gray-600"
          disabled={isSubmitting}
        >
          Reset
        </button>
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-6 py-2 hover:bg-green-700 disabled:bg-gray-400"
          disabled={!selectedProduct || isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Attributes"}
        </button>
      </div>

      {/* Warning Message */}
      {selectedProduct && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>Warning:</strong> Clicking "Update Attributes" will delete all existing attributes for this product 
            and replace them with the ones defined above.
          </p>
        </div>
      )}
    </div>
  );
}