"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";
import type { ServerResponse } from "@/type/producttype";

interface ReceivedItem {
  purchase_item_id: string;
  received_quantity: number;
  batch_id?: string;
  batch_number?: string;
  expiry_date?: string;
  warehouse_location?: string;
}

interface ReceivePurchaseOrderInput {
  poId: string;
  items: ReceivedItem[];
  actualDeliveryDate: string;
}

/**
 * Receive purchase order items
 * - Updates received quantities
 * - Updates product stock
 * - Updates PO status if all items received
 * - Records batch info and expiry date
 */
export async function receivePurchaseOrder(
  input: ReceivePurchaseOrderInput
): Promise<ServerResponse<{ success: boolean; allReceived: boolean }>> {
  const { poId, items, actualDeliveryDate } = input;

  try {
    console.log("📦 Starting receive process for PO:", poId);

    if (!poId || !items || items.length === 0) {
      throw new Error("Missing required fields");
    }

    // Validate date
    if (new Date(actualDeliveryDate).toString() === "Invalid Date") {
      throw new Error("Invalid delivery date");
    }

    const supabase = await createSupabaseAdmin();

    // 1. Update each purchase item
    for (const item of items) {
      if (item.received_quantity < 0) {
        throw new Error(`Received quantity cannot be negative for item ${item.purchase_item_id}`);
      }

      const updatePayload: any = {
        received_quantity: item.received_quantity,
      };

      // Optional fields
      if (item.batch_id) updatePayload.batch_id = item.batch_id;
      if (item.batch_number) updatePayload.batch_number = item.batch_number;
      if (item.expiry_date) updatePayload.expiry_date = item.expiry_date;
      if (item.warehouse_location) updatePayload.warehouse_location = item.warehouse_location;

      const { error: updateError } = await supabase
        .from("purchase_items")
        .update(updatePayload)
        .eq("purchase_item_id", item.purchase_item_id);

      if (updateError) {
        console.error("Error updating purchase item:", updateError);
        throw new Error(`Failed to update item ${item.purchase_item_id}: ${updateError.message}`);
      }

      console.log(`✅ Updated item: ${item.purchase_item_id}, quantity: ${item.received_quantity}`);

      // 2. Update product stock
      await updateProductStock(supabase, item.purchase_item_id, item.received_quantity);
    }

    // 3. Check if all items fully received
    const { data: allItems, error: checkError } = await supabase
      .from("purchase_items")
      .select("quantity, received_quantity")
      .eq("purchase_id", poId);

    if (checkError) {
      console.error("Error checking purchase items:", checkError);
      throw new Error(`Failed to check items: ${checkError.message}`);
    }

    if (!allItems || allItems.length === 0) {
      throw new Error("No purchase items found");
    }

    const allReceived = allItems.every(
      (item: any) => item.received_quantity >= item.quantity
    );

    // 4. Update PO status based on receive status
    const newStatus = allReceived ? "received" : "confirmed";
    
    const { error: statusError } = await supabase
      .from("purchases")
      .update({
        status: newStatus,
        actual_delivery_date: actualDeliveryDate,
      })
      .eq("purchase_id", poId);

    if (statusError) {
      console.error("Error updating purchase status:", statusError);
      throw new Error(`Failed to update status: ${statusError.message}`);
    }

    console.log(`✅ PO ${poId} updated to status: ${newStatus}`);

    return {
      data: {
        success: true,
        allReceived,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Error in receivePurchaseOrder:", error);
    return {
      data: null,
      error: error.message || "Unknown error occurred",
    };
  }
}


/**
 * Update product stock when items are received
 */
async function updateProductStock(
  supabase: any,
  purchaseItemId: string,
  receivedQuantity: number
) {
  try {
    // Get product_id from purchase_item
    const { data: purchaseItem, error: fetchError } = await supabase
      .from("purchase_items")
      .select("product_id")
      .eq("purchase_item_id", purchaseItemId)
      .single();

    if (fetchError) {
      console.warn("Warning: Could not fetch purchase item:", fetchError);
      return;
    }

    if (!purchaseItem?.product_id) {
      console.warn("Warning: No product_id found for item:", purchaseItemId);
      return;
    }

    // Get current product stock
    const { data: product, error: getProductError } = await supabase
      .from("products")
      .select("stock")
      .eq("product_id", purchaseItem.product_id)
      .single();

    if (getProductError) {
      console.warn("Warning: Could not fetch product:", getProductError);
      return;
    }

    // Update product stock
    const currentStock = product?.stock || 0;
    const newStock = currentStock + receivedQuantity;

    const { error: updateStockError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("product_id", purchaseItem.product_id);

    if (updateStockError) {
      console.warn("Warning: Could not update product stock:", updateStockError);
      // Don't throw error, continue processing
      return;
    }

    console.log(`📊 Updated stock for product ${purchaseItem.product_id}: ${currentStock} -> ${newStock}`);
  } catch (error: any) {
    console.warn("Warning: Error updating product stock:", error.message);
    // Don't throw error, continue processing other items
  }
}

/**
 * Update a single purchase item receive information
 * Used for individual item receive (unlike batchReceivePurchaseItems for batch)
 */
export async function updatePurchaseItemReceive(
  purchaseItemId: string,
  receiveData: {
    received_quantity: number;
    batch_number?: string | null;
    expiry_date?: string | null;
    warehouse_location?: string | null;
    batch_id?: string | null;
  }
): Promise<ServerResponse<any>> {
  try {
    console.log("Updating purchase item receive:", purchaseItemId, receiveData);

    if (!purchaseItemId) {
      throw new Error("Purchase item ID is required");
    }

    if (receiveData.received_quantity < 0) {
      throw new Error("Received quantity cannot be negative");
    }

    const supabase = await createSupabaseAdmin();

    const updatePayload: any = {
      received_quantity: receiveData.received_quantity,
    };

    // Only include fields that are explicitly provided
    if (receiveData.batch_number !== undefined) {
      updatePayload.batch_number = receiveData.batch_number;
    }
    if (receiveData.expiry_date !== undefined) {
      updatePayload.expiry_date = receiveData.expiry_date;
    }
    if (receiveData.warehouse_location !== undefined) {
      updatePayload.warehouse_location = receiveData.warehouse_location;
    }
    if (receiveData.batch_id !== undefined) {
      updatePayload.batch_id = receiveData.batch_id;
    }

    const { data, error } = await supabase
      .from("purchase_items")
      .update(updatePayload)
      .eq("purchase_item_id", purchaseItemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating purchase item receive:", error);
      throw new Error(`Failed to update item: ${error.message}`);
    }

    // Update product stock
    await updateProductStock(supabase, purchaseItemId, receiveData.received_quantity);

    console.log("✅ Purchase item receive updated");
    return { data, error: null };
  } catch (error: any) {
    console.error("Error in updatePurchaseItemReceive:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Get receive details for a specific purchase item
 */
export async function getPurchaseItemReceiveDetails(
  purchaseItemId: string
): Promise<ServerResponse<ReceivedItem>> {
  try {
    const supabase = await createSupabaseAdmin();

    const { data, error } = await supabase
      .from("purchase_items")
      .select(`
        purchase_item_id,
        received_quantity,
        batch_id,
        batch_number,
        expiry_date,
        warehouse_location
      `)
      .eq("purchase_item_id", purchaseItemId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch item: ${error.message}`);
    }

    return { data: data as ReceivedItem, error: null };
  } catch (error: any) {
    console.error("Error in getPurchaseItemReceiveDetails:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Batch receive multiple items (用于批量接收)
 */
export async function batchReceivePurchaseItems(
  poId: string,
  items: ReceivedItem[],
  actualDeliveryDate: string
): Promise<ServerResponse<{ success: boolean; processedCount: number }>> {
  try {
    const supabase = await createSupabaseAdmin();
    let processedCount = 0;

    console.log(`🔄 Starting batch receive for ${items.length} items`);

    for (const item of items) {
      const updatePayload: any = {
        received_quantity: item.received_quantity,
      };

      if (item.batch_id) updatePayload.batch_id = item.batch_id;
      if (item.batch_number) updatePayload.batch_number = item.batch_number;
      if (item.expiry_date) updatePayload.expiry_date = item.expiry_date;
      if (item.warehouse_location) updatePayload.warehouse_location = item.warehouse_location;

      const { error } = await supabase
        .from("purchase_items")
        .update(updatePayload)
        .eq("purchase_item_id", item.purchase_item_id);

      if (!error) {
        processedCount++;
        await updateProductStock(supabase, item.purchase_item_id, item.received_quantity);
      } else {
        console.warn(`Failed to update item ${item.purchase_item_id}:`, error);
      }
    }

    // Update PO
    const { error: statusError } = await supabase
      .from("purchases")
      .update({
        actual_delivery_date: actualDeliveryDate,
      })
      .eq("purchase_id", poId);

    if (statusError) {
      console.warn("Failed to update PO:", statusError);
    }

    console.log(`✅ Batch receive completed: ${processedCount}/${items.length} items`);

    return {
      data: {
        success: true,
        processedCount,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error in batchReceivePurchaseItems:", error);
    return {
      data: null,
      error: error.message,
    };
  }
}

/**
 * Fetch all receive orders with their items
 */
export async function fetchReceiveOrders() {
  try {
    console.log("📋 Fetching all receive orders");

    const supabase = await createSupabaseAdmin();

    const { data, error } = await supabase
      .from("purchases")
      .select(`
        purchase_id,
        po_number,
        status,
        actual_delivery_date,
        expected_delivery_date,
        created_at,
        purchase_items (
          purchase_item_id,
          product_id,
          quantity,
          received_quantity,
          batch_id,
          batch_number,
          expiry_date,
          warehouse_location
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching receive orders:", error);
      throw new Error(`Failed to fetch receive orders: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} receive orders`);

    return { data, error: null };
  } catch (error: any) {
    console.error("Error in fetchReceiveOrders:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch receive orders by status
 */
export async function fetchReceiveOrdersByStatus(
  status: string
): Promise<ServerResponse<any>> {
  try {
    console.log(`📋 Fetching receive orders with status: ${status}`);

    const supabase = await createSupabaseAdmin();

    const { data, error } = await supabase
      .from("purchases")
      .select(`
        purchase_id,
        purchase_number,
        status,
        actual_delivery_date,
        expected_delivery_date,
        created_at,
        purchase_items (
          purchase_item_id,
          product_id,
          quantity,
          received_quantity,
          batch_id,
          batch_number,
          expiry_date,
          warehouse_location
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching receive orders by status:", error);
      throw new Error(`Failed to fetch receive orders: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} receive orders with status ${status}`);

    return { data, error: null };
  } catch (error: any) {
    console.error("Error in fetchReceiveOrdersByStatus:", error);
    return { data: null, error: error.message };
  }
}

/**
 * Fetch receive orders with pagination
 */
export async function fetchReceiveOrdersWithPagination(
  page: number = 1,
  limit: number = 10
): Promise<ServerResponse<{ orders: any[]; total: number; page: number; totalPages: number }>> {
  try {
    console.log(`📋 Fetching receive orders - Page: ${page}, Limit: ${limit}`);

    const supabase = await createSupabaseAdmin();
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from("purchases")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Failed to get total count: ${countError.message}`);
    }

    // Get paginated data
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        purchase_id,
        purchase_number,
        status,
        actual_delivery_date,
        expected_delivery_date,
        created_at,
        purchase_items (
          purchase_item_id,
          product_id,
          quantity,
          received_quantity,
          batch_id,
          batch_number,
          expiry_date,
          warehouse_location
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch receive orders: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Fetched ${data?.length || 0} orders - Total: ${total}`);

    return {
      data: {
        orders: data || [],
        total,
        page,
        totalPages,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error in fetchReceiveOrdersWithPagination:", error);
    return {
      data: null,
      error: error.message,
    };
  }
}