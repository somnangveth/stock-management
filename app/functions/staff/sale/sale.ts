"use server";

import {createSupabaseServerClient} from "@/lib/supbase/action";

export type AddSalesDataB2B = {
    dealer_id: string;
    customertype: "Dealer";
    payment_method: "cash" | "card" | "bank-transfer";
    payment_status: "pending" | "paid" | "partial" | "refunded";
    note: string;
    discount: number;
    tax: number;
    subtotal: number;
    total: number;
    delivery_date: Date;
    payment_duedate: Date;
    cart_items: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        package_qty: number;
        package_type: "case" | "box";
    }>;
};

export type AddSalesDataB2C = {
    general_customer_type: "walk_in" | "online";
    payment_method: "cash" | "card" | "bank-transfer";
    discount: number;
    customertype: "General";
    tax: number;
    process_status: string;
    subtotal: number;
    total: number;
    cart_items: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        discount: number;
        tax: number;
        total: number;
    }>;
};


// Add Sales for B2B with Package-based Operations
export async function addSalesB2B(data: AddSalesDataB2B){
    const supabase = await createSupabaseServerClient();

    try{
        // Validate required fields
        if(!data.cart_items || !Array.isArray(data.cart_items) || data.cart_items.length === 0){
            throw new Error("Cart items are required and must not be empty");
        }

        console.log("Input data: ", JSON.stringify(data, null, 2));

        // Step 1: Insert into sale table
        const saleDataToInsert = {
            dealer_id: data.dealer_id,
            subtotal: Math.round(data.subtotal * 100) / 100,
            tax_amount: Math.round(data.tax * 100) / 100,
            discount_amount: Math.round(data.discount * 100) / 100,
            total_amount: Math.round(data.total * 100) / 100,
            payment_method: data.payment_method,
            payment_status: data.payment_status,
            note: data.note,
            customertype: data.customertype,
            delivery_date: data.delivery_date,
            payment_duedate: data.payment_duedate,
        }

        const {data: saleData, error: saleError} = await supabase
            .from("sale")
            .insert(saleDataToInsert)
            .select()
            .single();

        if(saleError){
            console.error("Failed to insert sale data: ", saleError);
            throw new Error(`Error inserting sale: ${saleError.message}`);
        }

        // Step 2: Get the generated sale_id
        const saleId = saleData.sale_id;

        // Step 3: Prepare sale items with the sale_id
        const saleItemsToInsert = data.cart_items.map(item => ({
            sale_id: saleId,
            product_id: item.product_id,
            quantity: parseFloat(item.quantity.toString()), // Total units
            unit_price: parseFloat(item.unit_price.toFixed(2)),
            subtotal: parseFloat(item.subtotal.toFixed(2)),
            total: parseFloat(item.subtotal.toFixed(2)),
            package_qty: parseInt(item.package_qty.toString()),
            package_type: item.package_type,
        }));

        console.log("Sale items to insert: ", JSON.stringify(saleItemsToInsert, null, 2));

        // Step 4: Insert into sale_items table
        const {data: saleItemData, error: saleItemError} = await supabase
            .from("sale_items")
            .insert(saleItemsToInsert)
            .select();

        if(saleItemError){
            console.error("Failed to insert into sale items: ", saleItemError);
            // Rollback: delete the sale record
            await supabase.from("sale").delete().eq("sale_id", saleId);
            throw new Error(`Error inserting sale item: ${saleItemError.message}`);
        }

        // Step 5: Update stock quantities and package quantities for each product
        const stockUpdateErrors = [];
        const batchUpdates = [];

        for(const item of data.cart_items){
            // Get current stock and package info
            const {data: currentStock, error: fetchError} = await supabase
                .from("stock_alert")
                .select("current_quantity, package_qty")
                .eq("product_id", item.product_id)
                .single();

            if(fetchError){
                console.error(`Failed to fetch stock for product ${item.product_id}:`, fetchError);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: fetchError.message,
                });
                continue;
            }

            // Get product info for units_per_package
            const {data: productData, error: productError} = await supabase
                .from("products")
                .select("units_per_package")
                .eq("product_id", item.product_id)
                .single();

            if(productError){
                console.error(`Failed to fetch product info for ${item.product_id}:`, productError);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: `Product fetch error: ${productError.message}`,
                });
                continue;
            }

            const unitsPerPackage = productData?.units_per_package || 1;

            // Calculate bulk deduction
            // package_qty * units_per_package = total units to deduct
            const totalUnitsToDeduct = item.package_qty * unitsPerPackage;
            
            // Calculate new quantities
            const newQuantity = (currentStock?.current_quantity || 0) - totalUnitsToDeduct;
            const newPackageQty = (currentStock?.package_qty || 0) - item.package_qty;

            console.log(`Product ${item.product_id}: Deducting ${item.package_qty} ${item.package_type}(s) = ${totalUnitsToDeduct} units`);
            console.log(`Stock before: ${currentStock?.current_quantity} units, ${currentStock?.package_qty} packages`);
            console.log(`Stock after: ${newQuantity} units, ${newPackageQty} packages`);

            // Validate stock availability
            if(newQuantity < 0){
                console.error(`Insufficient stock for product ${item.product_id}. Needed: ${totalUnitsToDeduct}, Available: ${currentStock?.current_quantity}`);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: `Insufficient stock. Needed ${totalUnitsToDeduct} units but only ${currentStock?.current_quantity} available`,
                });
                continue;
            }

            if(newPackageQty < 0){
                console.error(`Insufficient packages for product ${item.product_id}. Needed: ${item.package_qty}, Available: ${currentStock?.package_qty}`);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: `Insufficient packages. Needed ${item.package_qty} but only ${currentStock?.package_qty} available`,
                });
                continue;
            }

            // Update stock_alert table
            const {error: updateError} = await supabase
                .from("stock_alert")
                .update({
                    current_quantity: newQuantity,
                    package_qty: newPackageQty,
                })
                .eq("product_id", item.product_id);

            if(updateError){
                console.error(`Failed to update stock for product ${item.product_id}:`, updateError);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: updateError.message,
                });
                continue;
            }

            // Step 6: Update Product Batches - FIFO based on expiry_date
            const {data: batches, error: batchError} = await supabase
                .from("product_batches")
                .select("batch_id, quantity_remaining, status, expiry_date")
                .eq("product_id", item.product_id)
                .eq("status", "active")
                .gt("quantity_remaining", 0)
                .order("expiry_date", { ascending: true }); // Earliest expiry first (FIFO)

            if(batchError){
                console.error(`Failed to fetch batches for product ${item.product_id}:`, batchError.message);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: `Batch fetch error: ${batchError.message}`,
                });
                continue;
            }

            if(batches && batches.length > 0){
                let remainingQuantity = totalUnitsToDeduct;

                console.log(`Processing ${totalUnitsToDeduct} units for product ${item.product_id}`);
                console.log(`Found ${batches.length} active batches`);

                // Deduct from batches in order of earliest expiry date
                for(const batch of batches){
                    if(remainingQuantity <= 0) break;

                    const deductAmount = Math.min(remainingQuantity, batch.quantity_remaining);
                    const newBatchQuantity = batch.quantity_remaining - deductAmount;

                    console.log(`Batch ${batch.batch_id}: Deducting ${deductAmount} (had ${batch.quantity_remaining}, now ${newBatchQuantity})`);

                    // Update Batch
                    const {error: batchUpdateError} = await supabase
                        .from("product_batches")
                        .update({quantity_remaining: newBatchQuantity})
                        .eq("batch_id", batch.batch_id);

                    if(batchUpdateError){
                        console.error(`Failed to update batch ${batch.batch_id} for product ${item.product_id}:`, batchUpdateError);
                        stockUpdateErrors.push({
                            product_id: item.product_id,
                            batch_id: batch.batch_id,
                            error: `Batch update error: ${batchUpdateError.message}`,
                        });
                        continue;
                    } else {
                        batchUpdates.push({
                            product_id: item.product_id,
                            batch_id: batch.batch_id,
                            expiry_date: batch.expiry_date,
                            previous_quantity: batch.quantity_remaining,
                            new_quantity: newBatchQuantity,
                            deducted: deductAmount,
                            package_type: item.package_type,
                            packages_deducted: item.package_qty,
                        });
                    }

                    remainingQuantity -= deductAmount;
                    console.log(`Remaining quantity to deduct: ${remainingQuantity}`);
                }

                // Warn if not enough batch quantity available
                if(remainingQuantity > 0){
                    console.warn(`Insufficient batch quantity for product ${item.product_id}. Short by ${remainingQuantity} units.`);
                    stockUpdateErrors.push({
                        product_id: item.product_id,
                        error: `Insufficient batch quantity. Short by ${remainingQuantity} units.`,
                    });
                }
            } else {
                console.warn(`No active batches found for product ${item.product_id}`);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: 'No active batches available',
                });
            }
        }

        if (stockUpdateErrors.length > 0){
            console.warn("Some stock updates failed: ", stockUpdateErrors);
        }

        console.log("Sale completed successfully!");
        console.log(`Total batches updated: ${batchUpdates.length}`);

        return{
            success: true,
            sale: saleData,
            saleItems: saleItemData,
            batchUpdates: batchUpdates.length > 0 ? batchUpdates : undefined,
            stockUpdateErrors: stockUpdateErrors.length > 0 ? stockUpdateErrors : undefined,
        }
    }catch(error){
        console.error("Failed to process B2B sale: ", error);
        return{
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

//Add Sales for B2C
export async function addSalesB2C(data: AddSalesDataB2C){
    const supabase = await createSupabaseServerClient();

    try{
        //Validate required fields
        if(!data.cart_items || !Array.isArray(data.cart_items) || data.cart_items.length === 0){
            throw new Error("Cart items are required and must not be empty");
        }

        console.log("Input data: ", JSON.stringify(data,null,2));

        let saleDataToInsert;
        //Step1: Insert into sale table FIRST to get sale_id
        if(data.general_customer_type === "online"){
            saleDataToInsert = {
            subtotal: Math.round(data.subtotal * 100) / 100,
            tax_amount: Math.round(data.tax * 100) / 100,
            discount_amount: Math.round(data.discount * 100) /100,
            total_amount: Math.round(data.total * 100)/100,
            payment_method: data.payment_method,
        }
        }else if(data.general_customer_type === "walk_in"){
            saleDataToInsert = {
            subtotal: Math.round(data.subtotal * 100) / 100,
            tax_amount: Math.round(data.tax * 100) / 100,
            discount_amount: Math.round(data.discount * 100) /100,
            total_amount: Math.round(data.total * 100)/100,
            payment_method: data.payment_method,
            process_status: "completed",
        }
        }else{
            throw new Error("Invalid General Customer Type")
        }

        const {data: saleData, error: saleError} = await supabase
            .from("sale")
            .insert(saleDataToInsert)
            .select()
            .single();

        if(saleError){
            console.error("Failed to insert sale data: ", saleError);
            throw new Error(`Error inserting sale: ${saleError.message}`);
        }

        //Step 2: Get the generated sale_id
        const saleId = saleData.sale_id;

        //Step3: Prepare sale items with the sale_id
        const saleItemsToInsert = data.cart_items.map(item => ({
            sale_id: saleId,
            product_id: item.product_id,
            quantity: parseFloat(item.quantity.toString()),
            unit_price: parseFloat(item.unit_price.toFixed(2)),
            subtotal: parseFloat(item.subtotal.toFixed(2)),
            total: parseFloat(item.subtotal.toFixed(2)),
        }));

        console.log("Sale items to insert: ", JSON.stringify(saleItemsToInsert, null, 2));

        //Step4: Insert into sale_items table
        const {data: saleItemData, error: saleItemError} = await supabase
            .from("sale_items")
            .insert(saleItemsToInsert)
            .select();

        if(saleItemError){
            console.error("Failed to insert into sale items: ", saleItemError);
            await supabase.from("sale").delete().eq("sale_id", saleId);
            throw new Error(`Error inserting sale item: ${saleItemError.message}`);
        }

        //Step 5: Update stock quantities for each product
        const stockUpdateErrors = [];
        const batchUpdates = []; // Store batch update results

        for(const item of data.cart_items){
            //Get current stock
            const {data: currentStock, error: fetchError} = await supabase
                .from("stock_alert")
                .select("current_quantity")
                .eq("product_id", item.product_id)
                .single();

            if(fetchError){
                console.error(`Failed to fetch stock for product ${item.product_id}:`, fetchError);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: fetchError.message,
                });
                continue;
            }

            //Calculate new quantity
            const newQuantity = (currentStock?.current_quantity || 0) - item.quantity;

            //Update stock
            const {error: updateError} = await supabase
                .from("stock_alert")
                .update({current_quantity: newQuantity})
                .eq("product_id", item.product_id);

            if(updateError){
                console.error(`Failed to update stock for product ${item.product_id}:`, updateError);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: updateError.message,
                });
            }

            //Update Product Batches - FIFO based on expiry_date
            const {data: batches, error: batchError} = await supabase
                .from("product_batches")
                .select("batch_id, quantity_remaining, status, expiry_date")
                .eq("product_id", item.product_id)
                .eq("status", "active")
                .gt("quantity_remaining", 0)
                .order("expiry_date", { ascending: true }); // Earliest expiry first (FIFO)

            if(batchError){
                console.error(`Failed to fetch batches for product ${item.product_id}:`, batchError.message);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: `Batch fetch error: ${batchError.message}`,
                });
                continue;
            }

            if(batches && batches.length > 0){
                let remainingQuantity = item.quantity;

                console.log(`Processing ${item.quantity} units for product ${item.product_id}`);
                console.log(`Found ${batches.length} active batches`);

                // Deduct from batches in order of earliest expiry date
                for(const batch of batches){
                    if(remainingQuantity <= 0) break;

                    const deductAmount = Math.min(remainingQuantity, batch.quantity_remaining);
                    const newBatchQuantity = batch.quantity_remaining - deductAmount;

                    console.log(`Batch ${batch.batch_id}: Deducting ${deductAmount} (had ${batch.quantity_remaining}, now ${newBatchQuantity})`);

                    //Update Batch
                    const {error: batchUpdateError} = await supabase
                        .from("product_batches")
                        .update({quantity_remaining: newBatchQuantity})
                        .eq("batch_id", batch.batch_id);

                    if(batchUpdateError){
                        console.error(`Failed to update batch ${batch.batch_id} for product ${item.product_id}:`, batchUpdateError);
                        stockUpdateErrors.push({
                            product_id: item.product_id,
                            batch_id: batch.batch_id,
                            error: `Batch update error: ${batchUpdateError.message}`,
                        });
                        // Continue to next batch even if this one fails
                        continue;
                    } else {
                        batchUpdates.push({
                            product_id: item.product_id,
                            batch_id: batch.batch_id,
                            expiry_date: batch.expiry_date,
                            previous_quantity: batch.quantity_remaining,
                            new_quantity: newBatchQuantity,
                            deducted: deductAmount,
                        });
                    }

                    remainingQuantity -= deductAmount;
                    console.log(`Remaining quantity to deduct: ${remainingQuantity}`);
                }

                // Warn if not enough batch quantity available
                if(remainingQuantity > 0){
                    console.warn(`Insufficient batch quantity for product ${item.product_id}. Short by ${remainingQuantity} units.`);
                    stockUpdateErrors.push({
                        product_id: item.product_id,
                        error: `Insufficient batch quantity. Short by ${remainingQuantity} units.`,
                    });
                }
            } else {
                console.warn(`No active batches found for product ${item.product_id}`);
                stockUpdateErrors.push({
                    product_id: item.product_id,
                    error: 'No active batches available',
                });
            }
        }

        if (stockUpdateErrors.length > 0){
            console.warn("Some stock updates failed: ", stockUpdateErrors);
        }

        return{
            success: true,
            sale: saleData,
            saleItems: saleItemData,
            batchUpdates: batchUpdates.length > 0 ? batchUpdates : undefined,
            stockUpdateErrors: stockUpdateErrors.length > 0 ? stockUpdateErrors : undefined,
        }
    }catch(error){
        console.error("Failed to process sale: ", error);
        return{
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        }
    }
}

//Fetch All Sales
export async function fetchSales(){
    const supabase = await createSupabaseServerClient();

    try{
        const {data: salesData, error: salesError} = await supabase
        .from("sale")
        .select("*");

        if(salesError){
            console.error("Failed to fetch sale", salesError);
        }

        return salesData;
    }catch(error){
        throw error;
    }
}

//Fetch All Sale Item
export async function fetchSaleItems(){
    const supabase = await createSupabaseServerClient();

    try{
        const {data: saleItemData, error: saleItemError} = await supabase
        .from('sale_items')
        .select("*");

        if(saleItemError){
            console.error("Failed to fetch Sale Items", saleItemError);
        }

        return saleItemData;
    }catch(error){
        throw error;
    }
}

// Update Process Status
export async function updateProcessStatus(
  sale_id: string,
  process_status: string,
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("sale")
    .update(
    {process_status} )
    .eq("sale_id", sale_id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update status:", error.message);
    throw new Error(error.message);
  }

  return data;
}
