"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";
import type { PurchaseOrder, PurchaseOrderDetail, CreatePurchaseOrderInput, UpdatePurchaseOrderInput, ServerResponse } from "@/type/producttype";

// Fetch all purchase orders
export async function fetchPurchaseOrders(): Promise<ServerResponse<PurchaseOrder[]>> {
  try {
    const supabase = await createSupabaseAdmin();

    // Get all purchases
    const { data: purchases, error: poError } = await supabase
      .from("purchases")
      .select("*")
      .order("created_at", { ascending: false });

    if (poError) {
      console.error("Error fetching purchases:", poError);
      throw poError;
    }

    if (!purchases || purchases.length === 0) {
      return { data: [], error: null };
    }

    console.log("Fetched purchases:", purchases.length);
    console.log("First purchase sample:", purchases[0]);

    // Get all vendors
    const { data: vendors, error: vendorError } = await supabase
      .from("vendors")
      .select("vendor_id, vendor_name");

    if (vendorError) {
      console.warn("Warning: Failed to fetch vendors:", vendorError);
    }

    // Create vendor map
    const vendorMap = new Map();
    vendors?.forEach((v: any) => {
      vendorMap.set(v.vendor_id, v.vendor_name);
    });

    // Get all purchase items
    const { data: allItems, error: itemsError } = await supabase
      .from("purchase_items")
      .select(`
        purchase_item_id,
        purchase_id,
        quantity,
        received_quantity,
        unit_price,
        total_price,
        products (
          product_id,
          product_name
        )
      `);

    if (itemsError) {
      console.warn("Warning: Failed to fetch purchase items:", itemsError);
    }

    // Create items map
    const itemsMap = new Map<string, any[]>();
    allItems?.forEach((item: any) => {
      if (!itemsMap.has(item.purchase_id)) {
        itemsMap.set(item.purchase_id, []);
      }
      itemsMap.get(item.purchase_id)!.push(item);
    });

    // Format data
    const formattedData = purchases.map((po: any) => {
      const items = itemsMap.get(po.purchase_id) || [];
      const vendorName = vendorMap.get(po.vendor_id) || "Unknown Vendor";

      return {
        purchase_id: po.purchase_id,
        po_number: po.po_number || "PENDING",
        vendor_id: po.vendor_id,
        vendor_name: vendorName,
        total_amount: Number(po.total_amount) || 0,
        status: po.status,
        purchase_date: po.purchase_date,
        expected_delivery_date: po.expected_delivery_date,
        actual_delivery_date: po.actual_delivery_date,
        item_count: items.length,
        received_items_count: items.filter(
          (item: any) => (item.received_quantity || 0) >= item.quantity
        ).length,
        items: items.map((item: any) => ({
          purchase_item_id: item.purchase_item_id,
          product_id: item.product_id || "",
          product_name: item.products?.product_name || "Unknown",
          sku_code: item.products?.sku_code || "",
          quantity: item.quantity,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || 0,
          received_quantity: item.received_quantity || 0,
        })),
      };
    });

    console.log("Formatted data sample:", formattedData[0]);
    console.log("Fetched purchase orders:", formattedData.length);
    return { data: formattedData, error: null };
  } catch (err: any) {
    console.error("Error in fetchPurchaseOrders:", err);
    return { data: null, error: err.message };
  }
}

// Fetch single purchase order detail
export async function fetchPurchaseOrder(poId: string): Promise<ServerResponse<PurchaseOrderDetail>> {
  try {
    const supabase = await createSupabaseAdmin();

    const { data: po, error: poError } = await supabase
      .from("purchases")
      .select("*")
      .eq("purchase_id", poId)
      .single();

    if (poError) {
      throw new Error(poError.message);
    }

    if (!po) return { data: null, error: "Purchase order not found" };

    const { data: vendor } = await supabase
      .from("vendors")
      .select("vendor_name, vendor_image")
      .eq("vendor_id", po.vendor_id)
      .single();

    const { data: items } = await supabase
      .from("purchase_items")
      .select(`
        purchase_item_id,
        product_id,
        quantity,
        received_quantity,
        unit_price,
        total_price,
        batch_number,
        expiry_date,
        warehouse_location,
        products (
          product_id,
          product_name,
          sku_code,
          product_image
        )
      `)
      .eq("purchase_id", poId);

    const formattedData: PurchaseOrderDetail = {
      ...po,
      vendor_name: vendor?.vendor_name || "Unknown Vendor",
      vendor_image: vendor?.vendor_image || null,
      purchase_items: items?.map((item: any) => ({
        purchase_item_id: item.purchase_item_id,
        product_id: item.product_id,
        product_name: item.products?.product_name || "Unknown",
        sku_code: item.products?.sku_code || "",
        quantity: item.quantity,
        received_quantity: item.received_quantity || 0,
        unit_price: Number(item.unit_price) || 0,
        total_price: Number(item.total_price) || 0,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        warehouse_location: item.warehouse_location,
        product_image: item.products?.product_image || null,
      })) || [],
    };

    return { data: formattedData, error: null };
  } catch (err: any) {
    console.error("Error fetching PO:", err);
    return { data: null, error: err.message };
  }
}

// Fetch purchase items
export async function fetchPurchaseItems(poId: string) {
  try {
    console.log("Fetching items for purchase order:", poId);

    const supabase = await createSupabaseAdmin();

    const { data, error } = await supabase
      .from("purchase_items")
      .select(`
        purchase_item_id,
        product_id,
        quantity,
        unit_price,
        total_price,
        expiry_date,
        batch_number,
        warehouse_location,
        received_quantity,
        batch_id,
        products (
          product_id,
          product_name,
          sku_code
        )
      `)
      .eq("purchase_id", poId);

    if (error) {
      console.error("Error fetching purchase items:", error);
      throw error;
    }

    const items = data?.map((item: any) => ({
      purchase_item_id: item.purchase_item_id,
      product_id: item.product_id,
      product_name: item.products?.product_name || "Unknown",
      sku_code: item.products?.sku_code || "",
      quantity: item.quantity,
      unit_price: Number(item.unit_price) || 0,
      total_price: Number(item.total_price) || 0,
      expiry_date: item.expiry_date,
      batch_number: item.batch_number,
      warehouse_location: item.warehouse_location,
      received_quantity: item.received_quantity || 0,
      batch_id: item.batch_id,
    }));

    console.log("Items fetched:", items?.length);
    return { data: items, error: null };
  } catch (err: any) {
    console.error("Error in fetchPurchaseItems:", err);
    return { data: null, error: err.message };
  }
}

// Create purchase order
export async function createPurchaseOrder(formData: {
  vendor_id: number;
  purchase_date: string;
  expected_delivery_date?: string;
  payment_terms?: string;
  note?: string;
  subtotal: number;
  status?: string;
  tax: number;
  total_amount: number;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    expiry_date?: string;
    batch_number?: string;
    warehouse_location?: string;
  }>;
}) {
  try {
    console.log("Creating new purchase order");

    const supabase = await createSupabaseAdmin();

    const { data: po, error: poError } = await supabase
      .from("purchases")
      .insert({
        vendor_id: formData.vendor_id,
        purchase_date: formData.purchase_date,
        expected_delivery_date: formData.expected_delivery_date || null,
        payment_terms: formData.payment_terms || null,
        note: formData.note || null,
        subtotal: formData.subtotal,
        tax: formData.tax,
        total_amount: formData.total_amount,
        status: "draft",
      })
      .select()
      .single();

    if (poError) {
      console.error("Error creating purchase:", poError);
      throw poError;
    }

    console.log("PO created:", po.po_number);

    // Create purchase items
    if (formData.items && formData.items.length > 0) {
      const purchaseItems = formData.items.map((item) => ({
        purchase_id: po.purchase_id,
        product_id: item.product_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        expiry_date: item.expiry_date || null,
        batch_number: item.batch_number || null,
        warehouse_location: item.warehouse_location || null,
        received_quantity: 0,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItems);

      if (itemsError) {
        console.error("Error creating purchase items:", itemsError);
        // Rollback: delete created PO
        await supabase.from("purchases").delete().eq("purchase_id", po.purchase_id);
        throw itemsError;
      }

      console.log("Purchase items created:", purchaseItems.length);
    }

    return { data: po, error: null };
  } catch (err: any) {
    console.error("Error in createPurchaseOrder:", err);
    return { data: null, error: err.message };
  }
}

// Update purchase order status
export async function updatePurchaseOrderStatus(
  poId: string,
  status: "draft" | "submitted" | "confirmed" | "received" | "completed" | "cancelled"
) {
  try {
    console.log("Updating purchase order status to:", status);

    const supabase = await createSupabaseAdmin();

    const { data, error } = await supabase
      .from("purchases")
      .update({ status })
      .eq("purchase_id", poId)
      .select()
      .single();

    if (error) {
      console.error("Error updating purchase order status:", error);
      throw error;
    }

    console.log("PO status updated");
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in updatePurchaseOrderStatus:", err);
    return { data: null, error: err.message };
  }
}

// Delete purchase order (draft only)
export async function deletePurchaseOrder(poId: string) {
  try {
    console.log("Deleting purchase order:", poId);

    const supabase = await createSupabaseAdmin();

    // Check status
    const { data: po, error: checkError } = await supabase
      .from("purchases")
      .select("status")
      .eq("purchase_id", poId)
      .single();

    if (checkError) {
      console.error("Error checking PO status:", checkError);
      return { error: "Purchase order not found" };
    }


    if (po.status !== "draft") {
      console.warn("Cannot delete non-draft purchase order");
      return { error: "Only draft purchase orders can be deleted" };
    }

    // Delete purchase items
    const { error: itemsError } = await supabase
      .from("purchase_items")
      .delete()
      .eq("purchase_id", poId);

    if (itemsError) {
      console.error("Error deleting purchase items:", itemsError);
      throw itemsError;
    }

    // Delete purchase order
    const { error: poError } = await supabase
      .from("purchases")
      .delete()
      .eq("purchase_id", poId);

    if (poError) {
      console.error("Error deleting purchase order:", poError);
      throw poError;
    }

    console.log("PO deleted successfully");
    return { error: null };
  } catch (err: any) {
    console.error("Error in deletePurchaseOrder:", err);
    return { error: err.message };
  }
}

// Update received quantity
export async function updateReceivedQuantity(
  purchaseItemId: string,
  receivedQuantity: number
) {
  try {
    console.log("Updating received quantity:", purchaseItemId, receivedQuantity);

    const supabase = await createSupabaseAdmin();

    const { data, error } = await supabase
      .from("purchase_items")
      .update({ received_quantity: receivedQuantity })
      .eq("purchase_item_id", purchaseItemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating received quantity:", error);
      throw error;
    }

    console.log("Received quantity updated");
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in updateReceivedQuantity:", err);
    return { data: null, error: err.message };
  }
}

// Update purchase order
export async function updatePurchaseOrder(
  poId: string,
  formData: {
    expected_delivery_date?: string;
    payment_terms?: string;
    note?: string;
  }
) {
  try {
    console.log("Updating purchase order:", poId);

    const supabase = await createSupabaseAdmin();

    const updateData: any = {};
    if (formData.expected_delivery_date)
      updateData.expected_delivery_date = formData.expected_delivery_date;
    if (formData.payment_terms) updateData.payment_terms = formData.payment_terms;
    if (formData.note) updateData.note = formData.note;

    const { data, error } = await supabase
      .from("purchases")
      .update(updateData)
      .eq("purchase_id", poId)
      .select()
      .single();

    if (error) {
      console.error("Error updating purchase order:", error);
      throw error;
    }

    console.log("PO updated");
    return { data, error: null };
  } catch (err: any) {
    console.error("Error in updatePurchaseOrder:", err);
    return { data: null, error: err.message };
  }
}

/**
 * Update a purchase item (quantity, price, batch info)
 * Used when editing draft purchase orders
 */
export async function updatePurchaseOrderItem(
  purchaseItemId: string,
  updateData: {
    quantity?: number;
    unit_price?: number;
    total_price?: number;
    batch_number?: string | null;
    expiry_date?: string | null;
    warehouse_location?: string | null;
  }
): Promise<ServerResponse<any>> {
  try {
    console.log("Updating purchase item:", purchaseItemId, updateData);

    if (!purchaseItemId) {
      throw new Error("Purchase item ID is required");
    }

    // Validation
    if (updateData.quantity !== undefined && updateData.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (updateData.unit_price !== undefined && updateData.unit_price <= 0) {
      throw new Error("Unit price must be greater than 0");
    }

    const supabase = await createSupabaseAdmin();

    // Get current item to check if it can be edited
    const { data: currentItem, error: fetchError } = await supabase
      .from("purchase_items")
      .select("purchase_id, received_quantity")
      .eq("purchase_item_id", purchaseItemId)
      .single();

    if (fetchError) {
      throw new Error("Purchase item not found");
    }


    // Check if PO is in draft status (only draft can be edited)
    const { data: po, error: poError } = await supabase
      .from("purchases")
      .select("status")
      .eq("purchase_id", currentItem.purchase_id)
      .single();

    if (poError) {
      throw new Error("Purchase order not found");
    }

    if (po.status !== "draft") {
      throw new Error("Only draft purchase orders can be edited");
    }

    // Build update payload
    const updatePayload: any = {};

    if (updateData.quantity !== undefined) {
      updatePayload.quantity = updateData.quantity;
    }
    if (updateData.unit_price !== undefined) {
      updatePayload.unit_price = updateData.unit_price;
    }
    if (updateData.total_price !== undefined) {
      updatePayload.total_price = updateData.total_price;
    }
    if (updateData.batch_number !== undefined) {
      updatePayload.batch_number = updateData.batch_number;
    }
    if (updateData.expiry_date !== undefined) {
      updatePayload.expiry_date = updateData.expiry_date;
    }
    if (updateData.warehouse_location !== undefined) {
      updatePayload.warehouse_location = updateData.warehouse_location;
    }

    // Update purchase item
    const { data, error } = await supabase
      .from("purchase_items")
      .update(updatePayload)
      .eq("purchase_item_id", purchaseItemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating purchase item:", error);
      throw new Error(`Failed to update item: ${error.message}`);
    }

    // Recalculate PO totals if quantity or price changed
    if (updateData.quantity !== undefined || updateData.unit_price !== undefined) {
      await recalculatePOTotals(supabase, currentItem.purchase_id);
    }

    console.log("Purchase item updated successfully");
    return { data, error: null };
  } catch (error: any) {
    console.error("Error in updatePurchaseOrderItem:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Create a new purchase item
 * Used when adding items to existing draft purchase orders
 */
export async function createPurchaseOrderItem(
  purchaseId: string,
  itemData: {
    product_id: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    expiry_date?: string | null;
    batch_number?: string | null;
    warehouse_location?: string | null;
  }
): Promise<ServerResponse<any>> {
  try {
    console.log("Creating new purchase item for PO:", purchaseId, itemData);

    if (!purchaseId) {
      throw new Error("Purchase ID is required");
    }

    // Validation
    if (itemData.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (itemData.unit_price <= 0) {
      throw new Error("Unit price must be greater than 0");
    }

    const supabase = await createSupabaseAdmin();

    // Check if PO is in draft status (only draft can be edited)
    const { data: po, error: poError } = await supabase
      .from("purchases")
      .select("status")
      .eq("purchase_id", purchaseId)
      .single();

    if (poError) {
      throw new Error("Purchase order not found");
    }

    if (po.status !== "draft") {
      throw new Error("Only draft purchase orders can be edited");
    }

    // Create purchase item
    const { data, error } = await supabase
      .from("purchase_items")
      .insert({
        purchase_id: purchaseId,
        product_id: itemData.product_id || null,
        quantity: itemData.quantity,
        unit_price: itemData.unit_price,
        total_price: itemData.total_price,
        expiry_date: itemData.expiry_date || null,
        batch_number: itemData.batch_number || null,
        warehouse_location: itemData.warehouse_location || null,
        received_quantity: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating purchase item:", error);
      throw new Error(`Failed to create item: ${error.message}`);
    }

    // Recalculate PO totals
    await recalculatePOTotals(supabase, purchaseId);


    console.log("Purchase item created successfully");
    return { data, error: null };
  } catch (error: any) {
    console.error("Error in createPurchaseOrderItem:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Delete a purchase item
 * Used when removing items from existing draft purchase orders
 */
export async function deletePurchaseOrderItem(
  purchaseItemId: string
): Promise<ServerResponse<null>> {
  try {
    console.log("Deleting purchase item:", purchaseItemId);

    if (!purchaseItemId) {
      throw new Error("Purchase item ID is required");
    }

    const supabase = await createSupabaseAdmin();

    // Get the item to find the PO and check status
    const { data: item, error: fetchError } = await supabase
      .from("purchase_items")
      .select("purchase_id, received_quantity")
      .eq("purchase_item_id", purchaseItemId)
      .single();

    if (fetchError) {
      throw new Error("Purchase item not found");
    }

    // Check if already received
    if (item.received_quantity > 0) {
      throw new Error("Cannot delete items that have been partially or fully received");
    }

    // Check if PO is in draft status
    const { data: po, error: poError } = await supabase
      .from("purchases")
      .select("status")
      .eq("purchase_id", item.purchase_id)
      .single();

    if (poError) {
      throw new Error("Purchase order not found");
    }

    if (po.status !== "draft") {
      throw new Error("Only items in draft purchase orders can be deleted");
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from("purchase_items")
      .delete()
      .eq("purchase_item_id", purchaseItemId);

    if (deleteError) {
      console.error("Error deleting purchase item:", deleteError);
      throw new Error(`Failed to delete item: ${deleteError.message}`);
    }

    // Recalculate PO totals
    await recalculatePOTotals(supabase, item.purchase_id);

    console.log("Purchase item deleted successfully");
    return { data: null, error: null };
  } catch (error: any) {
    console.error("Error in deletePurchaseOrderItem:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Recalculate PO totals after item update
 */
async function recalculatePOTotals(supabase: any, purchaseId: string) {
  try {
    // Get all items for this PO
    const { data: items, error: fetchError } = await supabase
      .from("purchase_items")
      .select("total_price")
      .eq("purchase_id", purchaseId);

    if (fetchError) {
      console.warn("Warning: Could not recalculate PO totals:", fetchError);
      return;
    }

    // Calculate new subtotal
    const subtotal = items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0;

    // Get current tax to maintain it
    const { data: po, error: poError } = await supabase
      .from("purchases")
      .select("tax")
      .eq("purchase_id", purchaseId)
      .single();

    if (poError) {
      console.warn("Warning: Could not fetch PO tax:", poError);
      return;
    }

    const tax = po?.tax || 0;
    const total_amount = subtotal + tax;

    // Update PO totals
    const { error: updateError } = await supabase
      .from("purchases")
      .update({
        subtotal,
        total_amount,
      })
      .eq("purchase_id", purchaseId);

    if (updateError) {
      console.warn("Warning: Could not update PO totals:", updateError);
      return;
    }

    console.log("PO totals recalculated:", { subtotal, total_amount });
  } catch (error: any) {
    console.warn("Warning: Error recalculating PO totals:", error.message);
  }
}