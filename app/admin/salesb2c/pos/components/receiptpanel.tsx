"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Product, Attribute, StockAlert } from "@/type/producttype";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { styledToast } from "@/app/components/toast";
import { addSalesB2C, AddSalesDataB2C } from "@/app/functions/admin/sale/sale";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitBtnFull, trash } from "@/app/components/ui";
import { ProductOrderCard } from "@/app/components/pos/productcard";
import { convertFromDollarToRiels } from "@/app/functions/admin/price/currency";
import ProductVariantPanel from "./productvariantpanel";
import { Package } from "lucide-react";

type CartItem = {
    product: Product;
    quantity: number;
    totalPrice: number;
}

type ImportPrice = {
  import_price_id?: string;
  product_id: string;
  attribute_id: string | null;
  price_value: number;
  quantity?: number;
  price_id?: string;
  price_variance?: number;
  attribute_value?: number;
};

//Styling
const text = "text-sm text-gray-500";

const FormSchema = z.object({
    customertype: z.literal('General'),
    general_customer_type: z.enum(["walk_in", "online"]),
    payment_method: z.enum(['cash', 'card', 'bank-transfer']),
    subtotal: z.number().min(0),
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
    stockAlertMap,
    attributeData,
    importPriceData,
}:{
    cart: CartItem[],
    cartTotal: number,
    cartSubtotal: number,
    onUpdateQuantity: (productId: string | number, newQuantity: number) => void,
    onClearCart: () => void,
    stockAlertMap: Map<string, StockAlert>,
    attributeData: Attribute[],
    importPriceData: ImportPrice[],
}){
    const [isPending, startTransition] = useTransition();
    const [showVariantPanel, setShowVariantPanel] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const router = useRouter();

    const form = useForm<FormSchemaType>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            customertype: "General",
            general_customer_type: "walk_in",
            payment_method: "cash",
            subtotal: 0,
            total: 0,
            cart_items: [],
        }
    });

    // Update form values when cart changes
    useEffect(() => {
        const cartItems = cart.map(item => {
            const itemSubtotal = parseFloat(item.totalPrice.toFixed(2));
            
            return {
                product_id: String(item.product.product_id),
                quantity: parseInt(item.quantity.toString()),
                unit_price: parseFloat(Number(item.product.total_price).toFixed(2)),
                subtotal: itemSubtotal,
                discount: 0,
                tax: 0,
                total: itemSubtotal,
            };
        });

        const subtotal = parseFloat(cartSubtotal.toFixed(2));
        
        form.setValue('subtotal', subtotal);
        form.setValue('total', subtotal);
        form.setValue('cart_items', cartItems);

    }, [cart, cartSubtotal, form]);

    // Handle variant button click
    const handleOpenVariantPanel = (product: Product) => {
        setSelectedProduct(product);
        setShowVariantPanel(true);
    };

    // Handle variant panel save
    const handleVariantSave = (selections: any[], totalUnits: number, totalPrice: number) => {
        if (!selectedProduct) return;

        // Update the cart with the total units and price from variants
        onUpdateQuantity(selectedProduct.product_id, totalUnits);
        
        setShowVariantPanel(false);
        setSelectedProduct(null);
        styledToast.success(`Added ${totalUnits} units to cart`);
    };

    const onSubmit = (data: FormSchemaType) => {
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
                    process_status: "pending",
                    subtotal: data.subtotal,
                    total: data.total,
                    cart_items: data.cart_items,
                };

                const result = await addSalesB2C(salesData);

                if(result && 'error' in result && result.error){
                    styledToast.error("Failed to save receipt!");
                    return;
                }

                if(result && 'success' in result && result.success){
                    // Access sale_id from the sale object
                    const saleId = result.sale?.sale_id || 'temp-id';
                    // Navigate to payment page with sale data
                    router.push(
                        `/admin/salesb2c/pos/payment?saleId=${saleId}&amount=${data.total.toFixed(2)}`
                    );

                }else{
                    styledToast.error("Failed to save receipt!");
                }
            }catch(error){
                console.error("Failed to save receipt data", error);
                styledToast.error("An error occurred");
            }
        })
    }

    const onError = (errors: any) => {
        console.log("====FORM VALIDATION ERRORS====");
        console.log("Errors: ", errors);
        styledToast.error("Please check all required fields");
    }

    // Get attributes and import prices for selected product
    const productAttributes = selectedProduct 
        ? attributeData.filter(attr => {
            // Only include attributes that have corresponding prices
            return importPriceData.some(price => 
                price.product_id === selectedProduct.product_id && 
                price.attribute_id === attr.attribute_id
            );
          })
        : [];

    const productImportPrices = selectedProduct
        ? importPriceData.filter(price => price.product_id === selectedProduct.product_id)
        : [];

    const selectedProductStock = selectedProduct 
        ? stockAlertMap.get(selectedProduct.product_id)?.current_quantity || 0
        : 0;

    // If variant panel is open, show it instead
    if (showVariantPanel && selectedProduct) {
        return (
            <ProductVariantPanel
                product={selectedProduct}
                attributes={productAttributes}
                importPrices={productImportPrices}
                stockQuantity={selectedProductStock}
                onClose={() => {
                    setShowVariantPanel(false);
                    setSelectedProduct(null);
                }}
                onSave={handleVariantSave}
            />
        );
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <h1 className="font-semibold mb-3">Receipt Information</h1>
            <Form {...form}>
                <form 
                onSubmit={form.handleSubmit(onSubmit, onError)}
                className="space-y-2 flex flex-col h-full">

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
                   
                    {/* Product List */}
                    <div className="border-t pt-3 flex-1 min-h-0">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-semibold text-gray-700">Order Details</h3>
                            {cart.length > 0 && (
                                <button
                                type="button"
                                onClick={onClearCart}
                                className="text-red-600 hover:text-red-800 transition">
                                    {trash}
                                </button>
                            )}
                        </div>
                        <div className="space-y-2 max-h-[330px] overflow-y-auto pr-1">
                            {cart.length > 0 ? (
                                cart.map((item) => (
                                    <div key={item.product.product_id} className="relative group">
                                        <ProductOrderCard
                                            product={item.product}
                                            quantity={item.quantity}
                                            totalPrice={item.totalPrice}
                                            onUpdateQuantity={onUpdateQuantity}
                                        />
                                        {/* Variant Button - Positioned in top-right */}
                                        <button
                                            type="button"
                                            onClick={() => handleOpenVariantPanel(item.product)}
                                            className="absolute top-2 right-2 p-1.5 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                            title="Order in packs"
                                        >
                                            <Package className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ):(
                                <div className="text-center text-gray-400 py-8">
                                    No items in cart
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-3 space-y-2 flex-shrink-0">
                        {/* Subtotal in dollar */}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal($): </span>
                            <span className="font-semibold">${cartSubtotal.toFixed(2)}</span>
                        </div>

                        {/* Subtotal in riels */}
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal(៛): </span>
                            <span className="font-semibold">៛{convertFromDollarToRiels(Number(cartSubtotal.toFixed(2)))}</span>
                        </div>
                        
                        {/* Total in dollar */}
                        <div className="flex justify-between text-lg font-bold border-t pt-2">
                            <span>Total($): </span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>

                        {/* Total in riels */}
                        <div className="flex justify-between text-base font-bold text-gray-700">
                            <span>Total(៛): </span>
                            <span>៛{convertFromDollarToRiels(Number(cartTotal.toFixed(2)))}</span>
                        </div>
                    </div>

                    <button
                    type="submit"
                    disabled={isPending || cart.length === 0}
                    className={SubmitBtnFull}>
                        {isPending ? "Processing..." : "Proceed to Payment"}
                    </button>
                </form>
            </Form>
        </div>
    )
}