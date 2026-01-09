"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/type/producttype";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { styledToast } from "@/app/components/toast";
import { addSalesB2C, AddSalesDataB2C } from "@/app/functions/admin/sale/sale";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitBtn, SubmitBtnFull, trash } from "@/app/components/ui";
import { ProductOrderCard } from "@/app/components/pos/productcard";
import { Input } from "@/components/ui/input";
import { convertFromDollarToRiels } from "@/app/functions/admin/price/currency";

type CartItem = {
    product: Product;
    quantity: number;
    totalPrice: number;
}

//Styling
const text = "text-sm text-gray-500";

const FormSchema = z.object({
    customertype: z.literal('General'),
    general_customer_type: z.enum(["walk_in", "online"]),
    payment_method: z.enum(['cash', 'card', 'bank-transfer']),
    discount_percentage: z.number().min(0).max(100),
    tax_percentage: z.number().min(0).max(100),
    discount: z.number().min(0),
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    total: z.number().min(0),
    cart_items: z.array(z.object({
        product_id: z.string(),
        quantity: z.number(),
        unit_price: z.number(),
        subtotal: z.number(),
        discount: z.number(),
        tax: z.number(),
        total: z.number(),
    }))
});

type FormSchemaType = z.infer<typeof FormSchema>;

export default function ReceiptPanel({
    cart,
    cartTotal,
    cartSubtotal,
    onUpdateQuantity,
    onClearCart,
}:{
    cart: CartItem[],
    cartTotal: number,
    cartSubtotal: number,
    onUpdateQuantity: (productId: string | number, newQuantity: number) => void,
    onClearCart: () => void,
}){
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            customertype: "General",
            general_customer_type: "walk_in",
            payment_method: "cash",
            discount_percentage: 0,
            tax_percentage: 0,
            discount: 0,
            tax: 0,
            cart_items: [],
        }
    });

    //Update form values when cart changes
useEffect(() => {
    const discountPercent = form.getValues('discount_percentage') || 0;
    const taxPercent = form.getValues('tax_percentage') || 0;
    
    const cartItems = cart.map(item => {
        const itemSubtotal = parseFloat(item.totalPrice.toFixed(2));
        const itemDiscount = (itemSubtotal * discountPercent) / 100;
        const itemTax = (itemSubtotal * taxPercent) / 100;
        const itemTotal = itemSubtotal - itemDiscount + itemTax;
        
        return {
            product_id: String(item.product.product_id),
            quantity: parseInt(item.quantity.toString()),
            unit_price: parseFloat(Number(item.product.total_price).toFixed(2)),
            subtotal: itemSubtotal,
            discount: parseFloat(itemDiscount.toFixed(2)),
            tax: parseFloat(itemTax.toFixed(2)),
            total: parseFloat(itemTotal.toFixed(2)),
        };
    });

    form.setValue('subtotal', parseFloat(cartSubtotal.toFixed(2)));
    form.setValue('cart_items', cartItems);

    // Recalculate total based on current discount and tax percentages
    const discountAmount = (cartSubtotal * discountPercent) / 100;
    const taxAmount = (cartSubtotal * taxPercent) / 100;
    const total = cartSubtotal - discountAmount + taxAmount;
    
    form.setValue('discount', parseFloat(discountAmount.toFixed(2)));
    form.setValue('tax', parseFloat(taxAmount.toFixed(2)));
    form.setValue('total', parseFloat(total.toFixed(2)));

}, [cart, cartSubtotal, cartTotal, form]);


    const discountAmount = form.watch('discount') || 0;
    const taxAmount = form.watch('tax') || 0;
    const discountPercent = form.watch('discount_percentage') || 0;
    const taxPercent = form.watch('tax_percentage') || 0;

    //Recalculate totals when discount or tax percentage changes
useEffect(() => {
    const subscription = form.watch((value, { name }) => {
        if (name === 'discount_percentage' || name === 'tax_percentage') {
            const subtotalAmount = value.subtotal || 0;
            const discountPct = value.discount_percentage || 0;
            const taxPct = value.tax_percentage || 0;
            
            const discountAmt = (subtotalAmount * discountPct) / 100;
            const taxAmt = (subtotalAmount * taxPct) / 100;
            const newTotal = subtotalAmount - discountAmt + taxAmt;
            
            form.setValue('discount', parseFloat(discountAmt.toFixed(2)));
            form.setValue('tax', parseFloat(taxAmt.toFixed(2)));
            form.setValue('total', parseFloat(newTotal.toFixed(2)));
            
            // Update cart items with new discount and tax
            const updatedCartItems = cart.map(item => {
                const itemSubtotal = parseFloat(item.totalPrice.toFixed(2));
                const itemDiscount = (itemSubtotal * discountPct) / 100;
                const itemTax = (itemSubtotal * taxPct) / 100;
                const itemTotal = itemSubtotal - itemDiscount + itemTax;
                
                return {
                    product_id: String(item.product.product_id),
                    quantity: parseInt(item.quantity.toString()),
                    unit_price: parseFloat(Number(item.product.total_price).toFixed(2)),
                    subtotal: itemSubtotal,
                    discount: parseFloat(itemDiscount.toFixed(2)),
                    tax: parseFloat(itemTax.toFixed(2)),
                    total: parseFloat(itemTotal.toFixed(2)),
                };
            });
            
            form.setValue('cart_items', updatedCartItems);
        }
    });
    return () => subscription.unsubscribe();
}, [form, cart]);


    const onSubmit = (data: FormSchemaType) => {
        console.log("=== FORM SUBMIT TRIGGERED ===");
        console.log("Form data:", data);
        console.log("Cart length:", cart.length);

        if(cart.length === 0){
            styledToast.error("Cart is empty!");
            return;
        }

        startTransition(async() => {
            try{

                // Transform form data to match AddSalesDataB2C type
            const salesData: AddSalesDataB2C = {
                general_customer_type: data.general_customer_type,
                payment_method: data.payment_method,
                customertype: "General",
                process_status: data.general_customer_type === "walk_in" ? "completed" : "pending",
                discount: data.discount,
                tax: data.tax,
                subtotal: data.subtotal,
                total: data.total,
                cart_items: data.cart_items,
            };

                console.log("Sending data to addSales: ", data);
                const result = await addSalesB2C(salesData);
                console.log("Result from addSales: ", result);

                if(result && 'error' in result && result.error){
                    console.error("Failed to insert: ", result.error);
                    styledToast.error("Failed to create receipt!");
                    return;
                }

                if(result && 'success' in result && result.success){
                    styledToast.success("Receipt created successfully!");
                    onClearCart();
                    form.reset();
                }else{
                    styledToast.error("Failed to create receipt!");
                }
            }catch(error){
                console.error("Failed to insert receipt data", error);
                styledToast.error("An error occured");
            }
        })
    }

    const onError = (errors: any) => {
        console.log("====FORM VALIDATION ERRORS====");
        console.log("Errors: ", errors);
        styledToast.error("Please check all required fields");
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <h1 className="font-semibold">Receipt Information</h1>
            <Form {...form}>
                <form 
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-2">

                   <div className="flex gap-2">
                    {/* General Customer Type */}
                    <FormField
                    control={form.control}
                    name="general_customer_type"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Customer Type</FormLabel>
                            <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a value"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="walk_in">Walk In</SelectItem>
                                        <SelectItem value="online">Online</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                        </FormItem>
                    )}/>
                     {/* Payment Method */}
                    <FormField
                    control={form.control}
                    name="payment_method"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Payment Method: </FormLabel>
                            <FormControl>
                                <Select
                                value={field.value}
                                onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="card">Card</SelectItem>
                                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                        </FormItem>
                    )}/>
                   </div>

                   <div className="flex gap-2">
                    {/* Discount Percentage */}
                    <FormField
                    control={form.control}
                    name="discount_percentage"
                    render={({field})=>(
                        <FormItem>
                            <FormLabel className={text}>Discount % (optional)</FormLabel>
                            <Input
                            type="number"
                            placeholder="e.g. 15 for 15%"
                            step="0.01"
                            min="0"
                            max="100"
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => {
                                const val = e.target.value;
                                if(val === ""){
                                    field.onChange(0);
                                    return;
                                }

                                const floatVal = parseFloat(val);
                                if(!isNaN(floatVal) && floatVal >= 0 && floatVal <= 100){
                                    field.onChange(floatVal);
                                }
                            }}/>
                        </FormItem>
                    )}/>

                    {/* Tax Percentage */}
                    <FormField
                    control={form.control}
                    name="tax_percentage"
                    render={({field})=>(
                        <FormItem>
                            <FormLabel className={text}>Tax % (optional)</FormLabel>
                            <Input
                            type="number"
                            placeholder="e.g. 10 for 10%"
                            step="0.01"
                            min="0"
                            max="100"
                            value={field.value === 0 ? "" : field.value}
                            onChange={(e) => {
                                const val = e.target.value;
                                if(val === ""){
                                    field.onChange(0);
                                    return;
                                }

                                const floatVal = parseFloat(val);
                                if(!isNaN(floatVal) && floatVal >= 0 && floatVal <= 100){
                                    field.onChange(floatVal);
                                }
                            }}/>
                        </FormItem>
                    )}/>
                   </div>
                   
                    {/* Product List */}
                    <div className="border-t pt-3 mt-3 h-[330px]">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-gray-700">Order Details</h3>
                            {cart.length > 0 && (
                                <button
                                type="button"
                                onClick={onClearCart}
                                className="text-red-600 hover:text-red-800">
                                    {trash}
                                </button>
                            )}
                        </div>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto">
                            {cart.length > 0 ? (
                                cart.map((item) => (
                                    <ProductOrderCard
                                    key={item.product.product_id}
                                    product={item.product}
                                    quantity={item.quantity}
                                    totalPrice={item.totalPrice}
                                    onUpdateQuantity={onUpdateQuantity}/>
                                ))
                            ):(
                                <div className="text-center text-gray-400 py-8">
                                    No items in cart
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-3 mt-3 space-y-3">
                        {/* Subtotal in dollar */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal($): </span>
                            <span>${cartSubtotal.toFixed(2)}</span>
                        </div>

                        {/* Subtotal in riels */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal(រ): </span>
                            <span>${convertFromDollarToRiels(Number(cartSubtotal.toFixed(2)))}</span>
                        </div>

                        {/* Discount */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                Discount {discountPercent > 0 && `(${discountPercent}%)`}:
                            </span>
                            <span className="font-medium text-red-600">
                                {discountAmount > 0 ? `-$${discountAmount.toFixed(2)}` : '$0.00'}
                            </span>
                        </div>

                        {/* Tax */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                Tax {taxPercent > 0 && `(${taxPercent}%)`}:
                            </span>
                            <span className="font-medium text-green-600">
                                {taxAmount > 0 ? `+$${taxAmount.toFixed(2)}` : '$0.00'}
                            </span>
                        </div>
                        
                        {/* Total in dollar */}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total: </span>
                            <span>${form.watch('total')?.toFixed(2) || '0.00'}</span>
                        </div>

                       {/* Total in riels */}
                        <div className="flex justify-between text-sm">
                            <span>Total: </span>
                            <span>${convertFromDollarToRiels(Number(form.watch('total')?.toFixed(2))) || '0.00'}</span>
                        </div>
                    </div>

                    <button
                    type="submit"
                    disabled={isPending || cart.length === 0}
                    className={SubmitBtnFull}>
                        {isPending ? "Saving..." : "Save Receipt"}
                    </button>
                </form>
            </Form>
        </div>
    )
}