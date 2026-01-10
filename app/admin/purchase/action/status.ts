// app/admin/purchase/components/action/status.ts
"use server";

import { createSupabaseAdmin } from "@/lib/supbase/action";
import type { ServerResponse, PurchaseStatus } from "@/type/producttype";

/**
 * Update purchase order status
 */
export async function updatePurchaseOrderStatus(
  poId: string,
  newStatus: PurchaseStatus
): Promise<ServerResponse<any>> {
  try {
    console.log("Updating PO status:", poId, "to:", newStatus);

    if (!poId || !newStatus) {
      throw new Error("Purchase ID and status are required");
    }

    const supabase = await createSupabaseAdmin();

    // Get current PO
    const { data: po, error: fetchError } = await supabase
      .from("purchases")
      .select("status")
      .eq("purchase_id", poId)
      .single();

    if (fetchError || !po) {
      throw new Error("Purchase order not found");
    }

    // Validate status transition
    const validTransitions: Record<PurchaseStatus, PurchaseStatus[]> = {
      draft: ["submitted", "cancelled"],
      submitted: ["confirmed", "cancelled"],
      confirmed: ["received", "cancelled"],
      received: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const currentStatus = po.status as PurchaseStatus;
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }

    // Update status
    const { error: updateError } = await supabase
      .from("purchases")
      .update({ status: newStatus })
      .eq("purchase_id", poId);

    if (updateError) {
      throw new Error(`Failed to update status: ${updateError.message}`);
    }

    console.log("✅ PO status updated successfully");
    return { data: { success: true, newStatus }, error: null };
  } catch (error: any) {
    console.error("Error updating PO status:", error);
    return { data: null, error: error.message };
  }
}
