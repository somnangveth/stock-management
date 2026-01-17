"use client";

import { Product, StockAlert } from "@/type/producttype";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { styledToast } from "@/app/components/toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitBtnFull } from "@/app/components/ui";
import { updateMinMaxStock } from "@/app/functions/staff/stock/stockalert/stockalert";

const UpdateSchema = z.object({
    min_stock_level: z.number().optional(),
    max_stock_level: z.number().optional(),
});
export default function UpdateStockLevel({product, stockAlert}:{product: Product, stockAlert: StockAlert}){
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof UpdateSchema>>({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            min_stock_level: stockAlert.threshold_quantity,
            max_stock_level: stockAlert.max_stock_level,
        }
    });

    function onSubmit(data: z.infer<typeof UpdateSchema>){
        startTransition(async()=> {
            try{
                const result = await updateMinMaxStock(stockAlert.stock_alert_id, product.product_id, data);
                if(!result){
                    console.error("Failed to update stock level");
                    styledToast.error("Failed to update stock level!");
                }

                styledToast.success("Updating stock level successfully!");
                document.getElementById("update-stockLevel")?.click();
                window.location.reload();
                form.reset();
            }catch(error){
                styledToast.error("An error occurred");
                throw error;
            }
        })
    }

    return(
        <Form {...form}>
            <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3">

                {/* Min Stock Level */}
                <FormField
                control={form.control}
                name="min_stock_level"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Minimum Stock Level</FormLabel>
                        <FormControl>
                            <Input
                            type="number"
                            placeholder="eg. 10"
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => {
                                const val = e.target.value;
                                if(val === ""){
                                    field.onChange("");
                                    return null;
                                }

                                const IntVal = parseInt(val);
                                if(!isNaN(IntVal) && IntVal > 0){
                                    field.onChange(IntVal);
                                }else{
                                    field.onChange("");
                                }
                            }}/>
                        </FormControl>
                    </FormItem>
                )}/>

                {/* Max Stock Level */}
                <FormField
                control={form.control}
                name="max_stock_level"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Maximum Stock Level</FormLabel>
                        <FormControl>
                            <Input
                            type="number"
                            placeholder="eg. 10"
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => {
                                const val = e.target.value;
                                if(val === ""){
                                    field.onChange("");
                                    return null;
                                }

                                const IntVal = parseInt(val);
                                if(!isNaN(IntVal) && IntVal > 0){
                                    field.onChange(IntVal);
                                }else{
                                    field.onChange("");
                                }
                            }}/>
                        </FormControl>
                    </FormItem>
                )}/>

                <Button
                type="submit"
                className={SubmitBtnFull}>
                    {isPending ? "Updating..." : "Update Stock Level"}
                </Button>
            </form>
        </Form>
    )
}