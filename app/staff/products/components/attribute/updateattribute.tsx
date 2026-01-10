"use client";

import { Attribute } from "@/type/producttype";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { UpdateAttributeValue } from "@/app/functions/admin/stock/product/attributes";
import { styledToast } from "@/app/components/toast";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SubmitBtnFull } from "@/app/components/ui";

const UpdateSchema = z.object({
    data: z.array(z.object({
        product_attribute_id: z.string(),
        attribute_id: z.string(),
        value: z.string().optional(),
    }))
})

export default function UpdateAttribute({attributes}:{attributes: Attribute[]}){
    const [isPending, startTransition] = useTransition();

    console.log("Component rendered with attributes:", attributes);

    const attributesArray = Array.isArray(attributes) ? attributes : [];
    
    console.log("attributesArray:", attributesArray);

    const form = useForm<z.infer<typeof UpdateSchema>>({
        resolver: zodResolver(UpdateSchema),
        defaultValues: {
            data: attributes.map(attr => ({
                product_attribute_id: attr.product_attribute_id || "",
                attribute_id: attr.attribute_id || "",
                value: attr.value ?? "",
            }))
        }
    });

    console.log("Form default values:", form.getValues());
    console.log("Form state:", form.formState);

    const handleFormSubmit = (e: React.FormEvent) => {
        console.log("=== FORM SUBMIT EVENT ===");
        console.log("Form submit event triggered");
        console.log("Current form values:", form.getValues());
        console.log("Form valid?", form.formState.isValid);
        console.log("Form errors:", form.formState.errors);
        e.preventDefault();
        form.handleSubmit(onSubmit)(e);
    };

    function onSubmit(formData: z.infer<typeof UpdateSchema>){
        console.log("=== ONSUBMIT CALLED ===");
        console.log("onSubmit called with data:", formData);
        console.log("Data array length:", formData.data.length);
        console.log("Data details:", JSON.stringify(formData.data, null, 2));
        
        startTransition(async() => {
            try{
                console.log('Submitting to database...');
                const result = await UpdateAttributeValue(formData.data);

                if(!result){
                    console.error("Failed to update product attribute data");
                    styledToast.error("Failed to update product attribute");
                    return;
                }

                console.log("Update successful:", result);
                styledToast.success("Update product attribute successfully!");
                
                // Close modal if it exists
                document.getElementById("update-attribute")?.click();
                
                // Reload to refresh data
                window.location.reload();
            }catch(error){
                console.error("Error updating:", error);
                styledToast.error("An error occurred while updating");
            }
        })
    }

    return(
        <Form {...form}>
            <form 
                onSubmit={handleFormSubmit}
                className="space-y-4">
                {attributesArray.map((attribute, index) => {
                    const name = `data.${index}.value` as const;

                    // Size attribute with checkbox behavior
                    if (attribute.attribute_name === "Size") {
                        return (
                            <div key={attribute.attribute_id}>
                                <p className="font-medium">{attribute.attribute_name}</p>

                                <FormField
                                    control={form.control}
                                    name={name}
                                    render={({ field }) => (
                                        <div className="flex gap-4">
                                            {["S", "M", "L", "XL"].map((size) => (
                                                <label key={size} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="hidden peer"
                                                        checked={field.value === size}
                                                        onChange={() => field.onChange(field.value === size ? "" : size)}
                                                    />
                                                    <div
                                                        className="py-1 px-2 border border-gray-300 rounded-md peer-checked:bg-amber-700
                                                        peer-checked:border-amber-700 peer-checked:text-white hover:bg-amber-900 transition-colors duration-200">
                                                        {size}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>
                        );
                    }

                    // Spicy Level attribute with checkbox behavior
                    if (attribute.attribute_name === "Spicy Level") {
                        return (
                            <div key={attribute.attribute_id}>
                                <p className="font-medium">{attribute.attribute_name}</p>

                                <FormField
                                    control={form.control}
                                    name={name}
                                    render={({ field }) => (
                                        <div className="flex gap-4">
                                            {["Low", "Medium", "Extreme"].map((level) => (
                                                <label key={level} className="cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden peer"
                                                        checked={field.value === level}
                                                        onChange={() => field.onChange(field.value === level ? "" : level)}
                                                    />
                                                    <div className="px-2 py-1 border rounded-md border-gray-300 peer-checked:bg-amber-700 peer-checked:border-amber-700
                                                    peer-checked:text-white hover:bg-amber-900 transition-colors duration-200">
                                                        {level}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                />
                            </div>
                        );
                    }
                    
                    // Default text input for other attributes - FIXED SYNTAX ERROR HERE
                    return (
                        <div key={attribute.attribute_id}>
                            <p className="font-medium">{attribute.attribute_name}</p>

                            <FormField
                                control={form.control}
                                name={name}
                                render={({ field }) => (
                                    <Input 
                                        placeholder={`Enter ${attribute.attribute_name}`} 
                                        {...field} 
                                    />
                                )}
                            />
                        </div>
                    );
                })}

                <Button
                    type="submit"
                    disabled={isPending}
                    className={SubmitBtnFull}>
                    {isPending ? "Updating..." : "Update Attribute"}
                </Button>
            </form>
        </Form>
    )
}