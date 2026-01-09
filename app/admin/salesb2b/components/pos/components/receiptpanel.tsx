"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product } from "@/type/producttype";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { styledToast } from "@/app/components/toast";
import { addSalesB2B, AddSalesDataB2B } from "@/app/functions/admin/sale/sale";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitBtnFull, trash } from "@/app/components/ui";
import { ProductOrderCard } from "@/app/components/pos/productcard";
import { Input } from "@/components/ui/input";
import { convertFromDollarToRiels } from "@/app/functions/admin/price/currency";
import { Dealer } from "@/type/membertype";
import AddDealerForm from "../../adddealerform";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils"

type CartItem = {
    product: Product;
    quantity: number;
    totalPrice: number;
    package_qty: number;
    package_type: 'box' | 'case';
}

const text = "text-sm text-gray-500";

const FormSchema = z.object({
    dealer_id: z.string(),
    payment_method: z.enum(['cash', 'card', 'bank-transfer']),
    payment_status: z.enum(['pending', 'partial', 'refunded', 'paid']),
    discount_percentage: z.number().min(0).max(100),
    tax_percentage: z.number().min(0).max(100),
    discount: z.number().min(0),
    subtotal: z.number().min(0),
    tax: z.number().min(0),
    total: z.number().min(0),
    delivery_date: z.date(),
    payment_duedate: z.date(),
    customertype: z.literal('Dealer'),
    notes: z.string().optional(),
    cart_items: z.array(z.object({
        product_id: z.string(),
        quantity: z.number(),
        unit_price: z.number(),
        subtotal: z.number(),
        package_qty: z.number(),
        package_type: z.enum(['box', 'case']),
    }))
});

type FormSchemaType = z.infer<typeof FormSchema>;

export default function ReceiptPanelB2B({
    dealers = [],
    cart,
    cartTotal,
    cartSubtotal,
    onUpdateQuantity,
    onClearCart,
}:{
    dealers?: Dealer[],
    cart: CartItem[],
    cartTotal: number,
    cartSubtotal: number,
    onUpdateQuantity: (productId: string | number, newQuantity: number, packageQty: number, packageType: 'box' | 'case') => void,
    onClearCart: () => void,
}){
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            payment_status: "pending",
            payment_method: "cash",
            discount_percentage: 0,
            tax_percentage: 0,
            customertype: "Dealer",
            notes: "",
            discount: 0,
            tax: 0,
            cart_items: [],
        }
    });

    useEffect(() => {
        const cartItems = cart.map(item => ({
            product_id: String(item.product.product_id),
            quantity: parseInt(item.quantity.toString()),
            unit_price: parseFloat(Number(item.product.total_price).toFixed(2)),
            subtotal: parseFloat(item.totalPrice.toFixed(2)),
            package_qty: item.package_qty,
            package_type: item.package_type,
        }));

        form.setValue('subtotal', parseFloat(cartSubtotal.toFixed(2)));
        form.setValue('cart_items', cartItems);

        const discountPercent = form.getValues('discount_percentage') || 0;
        const taxPercent = form.getValues('tax_percentage') || 0;
        
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
            }
        });
        return () => subscription.unsubscribe();
    }, [form]);

    const onSubmit = (data: FormSchemaType) => {
        if(cart.length === 0){
            styledToast.error("Cart is empty!");
            return;
        }

        startTransition(async() => {
            try{

                // Transform form data to match AddSalesDataB2B type
            const salesData: AddSalesDataB2B = {
                dealer_id: data.dealer_id,
                customertype: 'Dealer',
                payment_method: data.payment_method,
                payment_status: data.payment_status,
                note: data.notes || '', // Ensure note is always a string
                discount: data.discount,
                tax: data.tax,
                subtotal: data.subtotal,
                total: data.total,
                delivery_date: data.delivery_date,
                payment_duedate: data.payment_duedate,
                cart_items: data.cart_items,
            };
                const result = await addSalesB2B(salesData);

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
        <div className="h-full flex flex-col bg-white overflow-hidden overflow-y-auto">
            <h1 className="font-semibold">Receipt Information (B2B)</h1>
            <Form {...form}>
                <form 
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-2">

                   <div className="flex items-center gap-2">
                    <FormField
                    control={form.control}
                    name="dealer_id"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Dealer</FormLabel>
                            <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select dealer"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dealers.map((d: Dealer) => (
                                            <SelectItem key={d.dealer_id} value={String(d.dealer_id)}>
                                                {d.business_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormControl>
                        </FormItem>
                    )}/>
                    <AddDealerForm/>
                   </div>

                   <div className="flex gap-2">
                    <FormField
                    control={form.control}
                    name="payment_method"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Payment Method</FormLabel>
                            <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
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

                    <FormField
                    control={form.control}
                    name="payment_status"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Payment Status</FormLabel>
                            <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="refunded">Refunded</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                        </FormItem>
                    )}/>
                   </div>

                   <div className="flex gap-2">
                    <FormField
                    control={form.control}
                    name="delivery_date"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Delivery Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        captionLayout="dropdown"
                                        fromYear={2000}
                                        toYear={2030}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                        </FormItem>
                    )}/>

                    <FormField
                    control={form.control}
                    name="payment_duedate"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Payment Due Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        captionLayout="dropdown"
                                        fromYear={2000}
                                        toYear={2030}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                        </FormItem>
                    )}/>
                   </div>

                   <FormField
                    control={form.control}
                    name="notes"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel className={text}>Notes</FormLabel>
                            <FormControl>
                                <Input type="text" {...field} onChange={field.onChange}/>
                            </FormControl>
                        </FormItem>
                    )}/>

                   <div className="flex gap-2">
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
                   
                    <div className="border-t pt-3 mt-3 h-[330px]">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-gray-700">Order Details (Packages)</h3>
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
                                    <div key={item.product.product_id} className="border rounded p-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{item.product.product_name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.package_qty || 0} {item.package_type}(s) × {item.product.units_per_package || 1} units = {item.quantity || 0} units
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    ${(item.product.total_price || 0).toFixed(2)} per package
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">${(item.totalPrice || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ):(
                                <div className="text-center text-gray-400 py-8">
                                    No items in cart
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t pt-3 mt-3 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal($):</span>
                            <span>${cartSubtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal(រ):</span>
                            <span>{convertFromDollarToRiels(Number(cartSubtotal.toFixed(2)))}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                Discount {discountPercent > 0 && `(${discountPercent}%)`}:
                            </span>
                            <span className="font-medium text-red-600">
                                {discountAmount > 0 ? `-$${discountAmount.toFixed(2)}` : '$0.00'}
                            </span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                                Tax {taxPercent > 0 && `(${taxPercent}%)`}:
                            </span>
                            <span className="font-medium text-green-600">
                                {taxAmount > 0 ? `+$${taxAmount.toFixed(2)}` : '$0.00'}
                            </span>
                        </div>
                        
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total:</span>
                            <span>${form.watch('total')?.toFixed(2) || '0.00'}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span>Total(រ):</span>
                            <span>{convertFromDollarToRiels(Number(form.watch('total')?.toFixed(2))) || '0.00'}</span>
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