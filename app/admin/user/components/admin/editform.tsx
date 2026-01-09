"use client";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { convertBlobUrlToFile } from "@/app/components/image/actions/image";
import { deleteImage, uploadImage } from "@/app/components/image/actions/upload";
import ProfileButton from "@/app/components/image/components/profilebutton";
import { Admin } from "@/type/membertype";
import { toast } from "sonner";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { cn } from "@/lib/utils";
import { updateAdmin } from "../../actions";
import { getLoggedInUser } from "@/app/auth/actions";
import { createSupabaseBrowserClient } from "@/lib/storage/browser"; // Use browser client
import { useRouter } from "next/navigation";
import { SubmitBtnFull } from "@/app/components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UpdateSchema = z.object({
  admin_id: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.date().optional(),
  email: z.string().optional(),
  martial_status: z.string().optional(),
  profile_image: z.string().optional(),
  nationality: z.string().optional(),
});

export default function EditAdmin({ admin }: { admin: Admin }) {
  if(!admin) return null;
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const genders = ['Male', 'Female'];
  const martial_status = ["Single", "Married" , "Divorced", "Widowed"];

  const form = useForm<z.infer<typeof UpdateSchema>>({
    resolver: zodResolver(UpdateSchema),
    defaultValues: {
      admin_id: admin.admin_id,
      profile_image: admin.profile_image,
      email: admin.email, 
      first_name: admin.first_name,
      last_name: admin?.last_name,
      nationality: admin.nationality,
      date_of_birth: admin.date_of_birth
      ? new Date(admin.date_of_birth)
      : undefined,
      martial_status: admin.martial_status,
      gender: admin.gender,
    },
  });

  // Upload images
  async function uploadAllImage(oldImageUrl: string) {
    if (imageUrls.length === 0) return oldImageUrl;
    
    try {
      if (oldImageUrl) {
        await deleteImage({
          imageUrl: oldImageUrl,
          bucket: "images/profiles",
        });
      }

      const url = imageUrls[0];
      const imgFile = await convertBlobUrlToFile(url);
      const { imageUrl, error } = await uploadImage({
        file: imgFile,
        bucket: "images/profiles",
      });

      if (error) throw new Error("Failed to upload image");
      return imageUrl;
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  }

async function onSubmit(data: z.infer<typeof UpdateSchema>) {
  startTransition(async () => {
    try {
      
      // Handle image upload
      const oldImage = admin.profile_image;
      let newImageUrl = oldImage;
      if (imageUrls.length > 0) {
        newImageUrl = await uploadAllImage(oldImage);
      }

      const updateData: any = {
        first_name: data.first_name ?? admin.first_name,
        last_name: data.last_name ?? admin.last_name,
        profile_image: newImageUrl,
      };

      if (data.email && data.email !== admin.email) {
        updateData.email = data.email;
      }

      if (data.date_of_birth) {
        updateData.date_of_birth = data.date_of_birth;
      }
      const result = await updateAdmin(admin.admin_id, updateData);

      if (!result.success) {
        if (result.needsLogin) {
          toast.error("Session expired. Please log in again.");
          router.push('/auth');
          return;
        }
        throw new Error(result.error || "Failed to update admin");
      }

      // Refresh session
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.refreshSession();

      window.dispatchEvent(new Event('profileUpdated'));
      document.getElementById("trigger")?.click();
      toast.success("Admin updated successfully!");
      setImageUrls([]);
      router.refresh();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("Failed to update admin: " + error.message);
    }
  });
}

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile Image */}
        <ProfileButton 
          imageUrls={imageUrls} 
          setImageUrls={setImageUrls} 
          oldImage={admin.profile_image} 
        />

        {/* Admin ID and First Name */}
        <div className="flex gap-2">
          {/* Admin ID */}
          <FormField
            control={form.control}
            name="admin_id"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Admin ID:</FormLabel>
                <FormControl>
                  <Input {...field} 
                  placeholder="Enter admin ID" 
                  readOnly
                  className="bg-muted cursor-not-allowed"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Email:</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Enter email"
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2">
          {/* First Name */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>First Name:</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter first name"
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        {/* Last Name */}
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name:</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={field.onChange}
                  placeholder="Enter last name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                        {...field}
                        value={field.value || ""}
                        onValueChange={(val) => field.onChange(val)}>
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

        {/* Action Buttons */}
          <Button
            type="submit"
            disabled={isPending}
            className={SubmitBtnFull}
          >
            {isPending ? (
              "Updating"
            ): (
              "Update Staff"
            )}
          </Button>
        
      </form>
    </Form>
  );
}