"use client";

import { btnStyle } from "@/app/components/ui";
import { fetchAttribute, fetchImportPrice, fetchProducts, fetchSalePrice } from "@/app/functions/admin/api/controller";
import { useQueries } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import UpdateAttributeForm from "../../addproductattform";

export default function AttributeDetail() {
    const param = useParams();
    const router = useRouter();
    const id = param.id as string;
    
    const [editMode, setEditMode] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    const results = useQueries({
        queries: [
            {
                queryKey: ["attributeQuery"],
                queryFn: fetchAttribute,
            },
            {
                queryKey: ["importpriceQuery"],
                queryFn: fetchImportPrice
            },
            {
                queryKey: ["salepriceQuery"],
                queryFn: fetchSalePrice,
            },
            {
                queryKey: ["productQuery"],
                queryFn: fetchProducts,
            }
        ]
    });

    const [attributeQuery, importPriceQuery, salePriceQuery, productQuery] = results;
    
    const isLoading = results.some(result => result.isLoading);
    const isError = results.some(result => result.isError);

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-12">Loading...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-red-600">Error loading data</div>
            </div>
        );
    }

    const attributes = attributeQuery.data || [];
    const importPrices = importPriceQuery.data || [];
    const salePrices = salePriceQuery.data || [];
    const products = productQuery.data || [];

    // Find the current product
    const product = products.find((p: any) => p.product_id === id);

    if (!product) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-red-600">Product not found</div>
            </div>
        );
    }

    // Get sale prices for this product
    const productSalePrices = salePrices.filter((price: any) => price.product_id === id);

    // Get attribute details by ID
    const getAttributeDetails = (attributeId: string) => {
        return attributes.find((attr: any) => attr.attribute_id === attributeId);
    };

    // Create a map of import prices by sale_price_id for quick lookup
    const importPriceMap = new Map();
    importPrices.forEach((ip: any) => {
        if (ip.sale_price_id) {
            importPriceMap.set(ip.sale_price_id, ip);
        }
    });

    // Group prices by module
    const pricesByModule = productSalePrices.reduce((acc: any, salePrice: any) => {
        const attr = getAttributeDetails(salePrice.attribute_id);
        if (attr) {
            if (!acc[attr.module]) {
                acc[attr.module] = [];
            }
            
            // Find the corresponding import price using sale_price_id
            const importPrice = importPriceMap.get(salePrice.price_id);
            
            acc[attr.module].push({
                sale_price_id: salePrice.price_id,
                import_price_id: importPrice?.price_id || null,
                sale_price_value: salePrice.price_value,
                import_price_value: importPrice?.price_value || 0,
                price_variance: importPrice?.price_variance || 0,
                attribute_value: salePrice.attribute_value,
                attribute_id: salePrice.attribute_id,
                attribute_name: attr.attribute_name
            });
        }
        return acc;
    }, {});

    const handleEdit = (salePriceId: string, currentData: any) => {
        setEditMode(salePriceId);
        setEditValues({
            sale_price_value: currentData.sale_price_value,
            attribute_value: currentData.attribute_value,
            import_price_value: currentData.import_price_value
        });
    };

    const handleCancel = () => {
        setEditMode(null);
        setEditValues({});
    };

    const handleSave = async (salePriceId: string, importPriceId: string | null) => {
        try {
            // Update sale price
            const salePriceResponse = await fetch('/api/admin/updatesaleprice', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price_id: salePriceId,
                    price_value: parseFloat(editValues.sale_price_value),
                    attribute_value: parseInt(editValues.attribute_value)
                })
            });

            if (!salePriceResponse.ok) {
                const errorData = await salePriceResponse.json();
                console.error('Sale price update failed:', errorData);
                alert(`Failed to update sale price: ${errorData.error}`);
                return;
            }

            // Update import price if it exists
            if (importPriceId) {
                const importPriceResponse = await fetch('/api/admin/updateimportprice', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        price_id: importPriceId,
                        price_value: parseFloat(editValues.import_price_value),
                        sale_price_id: salePriceId
                    })
                });

                if (!importPriceResponse.ok) {
                    const errorData = await importPriceResponse.json();
                    console.error('Import price update failed:', errorData);
                    alert(`Failed to update import price: ${errorData.error}`);
                    return;
                }
            }

            // Refetch data
            await Promise.all([
                salePriceQuery.refetch(),
                importPriceQuery.refetch()
            ]);
            
            setEditMode(null);
            setEditValues({});
            alert('Prices updated successfully!');
        } catch (error) {
            console.error('Error updating prices:', error);
            alert('An unexpected error occurred while updating prices');
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <button
                        className="flex items-center gap-2"
                        onClick={() => router.back()}>
                        ← Back
                    </button>
                </div>
                <h1 className="text-2xl font-bold">{product.product_name}</h1>
                <div className="text-sm text-gray-500">{product.sku_code}</div>
            </div>

            <div className="bg-white border border-gray-300 p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Product Details</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium">Package Type:</span> {product.package_type}
                    </div>
                    <div>
                        <span className="font-medium">Units per Package:</span> {product.units_per_package}
                    </div>
                    {product.description && (
                        <div className="col-span-2">
                            <span className="font-medium">Description:</span> {product.description}
                        </div>
                    )}
                </div>
            </div>
            <div className="space-y-6">
                {Object.entries(pricesByModule).map(([module, modulePrices]) => {
                    const pricesArray = modulePrices as any[];
                    
                    return (
                        <div key={module} className="bg-white border border-gray-300 p-6">
                            <h3 className="text-lg font-semibold capitalize mb-4">{module}</h3>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Attribute</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Import Price</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sale Price</th>

                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pricesArray.map((price: any) => {
                                            const isEditing = editMode === price.sale_price_id;
                                            
                                            return (
                                                <tr key={price.sale_price_id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm capitalize">
                                                        {price.attribute_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                value={editValues.attribute_value}
                                                                onChange={(e) => setEditValues({
                                                                    ...editValues,
                                                                    attribute_value: e.target.value
                                                                })}
                                                                className="border border-gray-300 px-2 py-1 w-20"
                                                            />
                                                        ) : (
                                                            price.attribute_value
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={editValues.import_price_value}
                                                                onChange={(e) => setEditValues({
                                                                    ...editValues,
                                                                    import_price_value: e.target.value
                                                                })}
                                                                className="border border-gray-300 px-2 py-1 w-24"
                                                            />
                                                        ) : (
                                                            `$${price.import_price_value.toFixed(2)}`
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={editValues.sale_price_value}
                                                                onChange={(e) => setEditValues({
                                                                    ...editValues,
                                                                    sale_price_value: e.target.value
                                                                })}
                                                                className="border border-gray-300 px-2 py-1 w-24"
                                                            />
                                                        ) : (
                                                            `$${price.sale_price_value.toFixed(2)}`
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-sm">
                                                        {isEditing ? (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleSave(price.sale_price_id, price.import_price_id)}
                                                                    className="bg-green-600 text-white px-3 py-1 text-xs hover:bg-green-700">
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={handleCancel}
                                                                    className="bg-gray-600 text-white px-3 py-1 text-xs hover:bg-gray-700">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleEdit(price.sale_price_id, price)}
                                                                className="bg-amber-600 text-white px-3 py-1 text-xs hover:bg-amber-700">
                                                                Edit
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>

            {Object.keys(pricesByModule).length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white border border-gray-300">
                    No attributes assigned to this product
                </div>
            )}
        </div>
    );
}