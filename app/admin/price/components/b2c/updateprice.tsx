"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useTransition } from "react";
import { updatePriceB2C } from "@/app/functions/admin/price/price";
import { styledToast } from "@/app/components/toast";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PriceProductProps } from "./updateform";
import { Price } from "@/type/producttype";


const UpdateSchema = z.object({
    base_price: z.number().min(0, "Must be greater than 0"),
    profit_price: z.number().min(0, "Must be greater than 0"),
    tax: z.number().min(0, "Must be greater than 0"),
    shipping: z.number().min(0, "Must be greater than 0"),
    total: z.number().min(0, "Must be greater than 0"),
});

export default function UpdateSinglePriceB2C({priceData}: {priceData: Price}){

    //--Hooks--
    const [isPending, startTransition] = useTransition();

    //Styling
    const text = 'text-sm text-gray-500';
    const line = <div className="flex-1 border-b border-gray-300"></div>

    const form = useForm<z.infer<typeof UpdateSchema>>({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            base_price: priceData.base_price || 0,
            tax: priceData.tax || 0,
            profit_price: priceData.profit_price || 0,
            shipping: priceData.shipping || 0,
            total: priceData.total_price || 0,
        }
    });

    

    //Auto Calculating the Price
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            const priceFields = ['base_price', 'tax', 'profit_price', 'shipping', 'discount'];
            
            if (priceFields.includes(name as string)) {
                const base_price = value.base_price || 0;
                const tax_percent = value.tax || 0;
                const profit_price = value.profit_price || 0;
                const shipping = value.shipping || 0;
                
                const subtotal = base_price + profit_price + shipping;
                const taxAmount = (subtotal * tax_percent) / 100;
                const totalBeforeDiscount = subtotal + taxAmount;
                const total = totalBeforeDiscount;
                
                form.setValue('total', Math.max(0, total));
            }
        });
        
        return () => subscription.unsubscribe();
    }, [form]);

    function onSubmit(data: z.infer<typeof UpdateSchema>){
        startTransition(async() => {
            try{
                const result = await updatePriceB2C(priceData.price_id, data);

                if(!result){
                    styledToast.error("Failed to update price");
                    throw new Error('Error Updating');
                }
                styledToast.success("Update Successfully!");
                document.getElementById('update-price')?.click();
                window.location.reload();

            }catch(error){
                styledToast.error("Failed to Update Price");
            }
        })
    }

    return(
        <div>
            <Form {...form}>
                <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4">

                    {/* Base Price */}
                    <FormField
                    control={form.control}
                    name="base_price"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Base Price: </FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                step="0.01"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                        </FormItem>
                    )}/>

                    {/* Profit Price */}
                    <FormField
                    control={form.control}
                    name="profit_price"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Profit Price: </FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                step="0.01"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                        </FormItem>
                    )}/>

                    {/* Tax */}
                    <FormField
                    control={form.control}
                    name="tax"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Tax (%): </FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                step="0.01"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                        </FormItem>
                    )}/>

                    {/* Shipping */}
                    <FormField
                    control={form.control}
                    name="shipping"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Shipping: </FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                step="0.01"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                            </FormControl>
                        </FormItem>
                    )}/>

                    {/* Total Price */}
                    {line}
                    <FormField
                    control={form.control}
                    name="total"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Total Price: </FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                readOnly
                                {...field}
                                value={field.value.toFixed(2)}
                                className="bg-gray-100"
                                />
                            </FormControl>
                        </FormItem>
                    )}/>

                    <Button 
                        type="submit" 
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending ? "Updating..." : "Update Price"}
                    </Button>
                </form>
            </Form>
        </div>
    )
}