"use client";

import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { 
    Form,
    FormField,
    FormControl,
    FormLabel,
    FormMessage,
    FormItem,
} from "@/components/ui/form";
import { 
    Select,
    SelectTrigger,
    SelectValue,
    SelectItem,
    SelectContent,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMember } from "../../actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { uploadImage } from "@/app/components/image/actions/upload";
import ProfileButton from "@/app/components/image/components/profilebutton";
import { styledToast } from "@/app/components/toast";
import { btnStyle } from "@/app/components/ui";
import { CalendarIcon, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const FormSchema = z.object({
    id: z.string().nonempty("ID is required"),
    first_name: z.string().nonempty("Firstname is required"),
    last_name: z.string().nonempty("Lastname is required"),
    profile_image: z.string(),
    email: z.string().email("Invalid email format"),
    password: z.string()
        .min(6, { message: "Password must be more than 6 characters" }),
    confirm: z.string()
        .min(6, { message: "Password must be more than 6 characters" }),
    role: z.enum(["staff", "admin"]),
    nationality: z.string().nonempty("Nationality must included"),
    date_of_birth: z.date(),
    martial_status: z.enum(["Single", "Married", "Divorced", "Widowed"]),
    gender: z.enum(['Male', 'Female']),
    primary_email_address: z.string(),
    personal_email_address: z.string(),
    primary_phone_number: z.string(),
})
//Check that confirm matches password
.refine((data) => data.confirm === data.password, {
    message: "Password does not match",
    path: ["confirm"],
})
.refine((data) => {
    const today = new Date();
    const age = today.getFullYear() - data.date_of_birth.getFullYear();
    const monthDiff = today.getMonth() - data.date_of_birth.getMonth();
    const dayDiff = today.getDate() - data.date_of_birth.getDate();
    return age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));
},{
    message: "Users must be at least 18 years old",
    path: ["date_of_birth"],
});

export default function MemberForm() {
    //Hooks
    const [currentStep, setCurrentStep] = useState(1);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const roles = ["admin", "staff"];
    const genders = ['Male', 'Female'];
    const martial_status = ["Single", "Married" , "Divorced", "Widowed"];

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            id: "",
            first_name: "",
            last_name: "",
            profile_image: "",
            email: "",
            password: "",
            confirm: "",
            role: "staff",
            gender: "Male",
            nationality: "",
            martial_status: "Single",
            primary_email_address: "",
            personal_email_address: "",
            primary_phone_number: "",
        },
    });

    // Styling
    const text = 'text-sm text-gray-500'


    const steps = [
        {
            number: 1,
            title: "Personal Info",
            fields: ["id", "first_name", "last_name", "email", "password", "confirm", "role", "nationality", "date_of_birth", "martial_status", "gender"],
        },
        {
            number: 2,
            title: "Contact Info",
            fields: ["primary_email_address", "personal_email_address", "primary_phone_number"],
        }
    ]
    //Validate step 1 fields
    async function validateStep(){
        const currentFields = steps[currentStep - 1].fields;
        const isValid = await form.trigger(currentFields as any);
        return isValid;
    }

    async function nextStep(){
        const isValid = await validateStep();

        if(isValid){
            setCurrentStep(currentStep + 1);
        }
    }

    function prevStep(){
        setCurrentStep(currentStep - 1);
    }

    // Upload all images
    async function uploadAllImages() {
        const uploadUrls: string[] = [];

        for (const url of imageUrls) {
            const imageFile = await convertBlobUrlToFile(url);
            const { imageUrl, error } = await uploadImage({
                file: imageFile,
                bucket: "images/profiles",
            });

            if (error) throw new Error(error.message);
            uploadUrls.push(imageUrl);
        }

        return uploadUrls;
    }

    // Handle submit
    async function onSubmit(data: z.infer<typeof FormSchema>) {
        startTransition(async () => {
            try {
                const uploadUrls = await uploadAllImages();
                if (uploadUrls.length > 0) {
                    data.profile_image = uploadUrls[0];
                }

                const result = await createMember(data);

                // Handle Supabase return (string or object)
                const parsed = typeof result === "string" ? JSON.parse(result) : result;
                const { error } = parsed;

                if (error?.message) {
                    toast.error("Failed to create member!");
                } else {
                    document.getElementById("create-trigger")?.click(); 
                    styledToast.success("Member Added Successfully!")
                    form.reset(); 
                    setCurrentStep(1);
                    setImageUrls([]);
                }
            } catch (error: any) {
                styledToast.error("Failed to add member!", error);
        }});
    }

    return (
        <Form {...form}>
<form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-4">

                {/* Basic Information */}
                {currentStep === 1 && (
                    <div className="space-y-2 h-[550px]">
                        {/* Profile Image */}
                        <ProfileButton imageUrls={imageUrls} setImageUrls={setImageUrls}/>
                        
                        {/* ID */}
                        <FormField
                        control={form.control}
                        name="id"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>ID</FormLabel>
                                <FormControl>
                                    <Input
                                    type="text"
                                    placeholder="123456"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        {/* First Name and Last Name */}
                        <div className="flex gap-4">
                            {/* First Name */}
                            <FormField
                            control={form.control}
                            name="first_name"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                        <Input
                                        type="text"
                                        placeholder="John"
                                        {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
                            {/* Last Name */}
                            <FormField
                            control={form.control}
                            name="last_name"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                        <Input
                                        type="text"
                                        placeholder="Doe"
                                        {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        {/* Date of Birth and Nationality */}
                        <div className="flex gap-2">
                            <FormField
                        control={form.control}
                        name="date_of_birth"
                        render={({ field }) => (
                        <FormItem className="flex-1">
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant="outline"
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => field.onChange(date || undefined)}
                                captionLayout="dropdown"
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                        />

                        {/* Nationality */}
                        <FormField
                        control={form.control}
                        name="nationality"
                        render={({field})=> (
                            <FormItem>
                                <FormLabel>Nationality: </FormLabel>
                                <FormControl>
                                    <Input
                                    type="text"
                                    {...field}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}/>
                                </FormControl>
                            </FormItem>
                        )}/>
                        </div>


                        {/* Marital Status and Gender */}
                        <div className="flex gap-4">
                            {/* Marital Status */}
                            <FormField
                            control={form.control}
                            name="martial_status"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Marital Status</FormLabel>
                                    <FormControl>
                                        <Select
                                        value={field.value}
                                        onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {martial_status.map((status) => (
                                                    <SelectItem key={status} value={status}>
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
                            {/* Gender */}
                            <FormField
                            control={form.control}
                            name="gender"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Gender</FormLabel>
                                    <FormControl>
                                        <Select
                                        value={field.value}
                                        onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select gender"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {genders.map((gender) => (
                                                    <SelectItem key={gender} value={gender}>
                                                        {gender}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        {/* Email and Role */}
                        <div className="flex gap-4">
                            {/* Email */}
                            <FormField
                            control={form.control}
                            name="email"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                        type="email"
                                        placeholder="example@email.com"
                                        {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
                            {/* Role */}
                            <FormField
                            control={form.control}
                            name="role"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                        <Select
                                        value={field.value}
                                        onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        {/* Password and Confirm */}
                        <div className="flex gap-4">
                            {/* Password */}
                            <FormField
                            control={form.control}
                            name="password"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                        type="password"
                                        placeholder="••••••••"
                                        {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            
                            {/* Confirm */}
                            <FormField
                            control={form.control}
                            name="confirm"
                            render={({field}) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                        type="password"
                                        placeholder="••••••••"
                                        {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                    </div>
                )}

                {/* Contact Info */}
                {currentStep === 2 && (
                    <div className="space-y-4 h-[550px]">
                        {/* Primary Email Address */}
                        <FormField
                        control={form.control}
                        name="primary_email_address"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Primary Email Address</FormLabel>
                                <FormControl>
                                    <Input
                                    type="email"
                                    placeholder="primary@email.com"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        {/* Personal Email Address */}
                        <FormField
                        control={form.control}
                        name="personal_email_address"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Personal Email Address</FormLabel>
                                <FormControl>
                                    <Input
                                    type="email"
                                    placeholder="personal@email.com"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        {/* Primary Phone Number */}
                        <FormField
                        control={form.control}
                        name="primary_phone_number"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Primary Phone Number</FormLabel>
                                <FormControl>
                                    <Input
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t">
                    <Button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="gap-2 bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    {currentStep < 2 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isPending}
                        className={btnStyle}
                      >
                        {isPending ? (
                          <>
                            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            Create Member
                          </>
                        )}
                      </Button>
                    )}
                </div>
                </div>
</form>
        </Form>
    );
}