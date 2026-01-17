"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, Tag, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { addNewAttribute } from "@/app/functions/admin/stock/product/attributes";
import { styledToast } from "@/app/components/toast";
import { useQuery } from "@tanstack/react-query";
import { fetchAttribute } from "@/app/functions/admin/api/controller";
import { useRouter } from "next/navigation";


const FormSchema = z.object({
  modules: z
    .array(
      z.object({
        module: z.string().min(1, "Module is required"),
        isCustomModule: z.boolean(),
        attribute_names: z
          .array(z.string().min(1, "Attribute name cannot be empty"))
          .min(1, "At least one attribute name is required"),
      })
    )
    .min(1, "At least one module is required"),
});

export default function AddAttributePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { data: attributeData, isLoading, error } = useQuery({
    queryKey: ["attributeData"],
    queryFn: fetchAttribute,
  });

  // Get unique modules from existing attributes and group them
  const existingModules = attributeData
    ? Array.from(new Set(attributeData.map((attr: any) => attr.module.toLowerCase())))
        .sort()
    : [];

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      modules: [
        {
          module: "",
          isCustomModule: false,
          attribute_names: [""],
        },
      ],
    },
  });

  const modules = form.watch("modules");

  const handleAddModule = () => {
    const currentModules = form.getValues("modules");
    form.setValue("modules", [
      ...currentModules,
      {
        module: "",
        isCustomModule: false,
        attribute_names: [""],
      },
    ]);
  };

  const handleRemoveModule = (moduleIndex: number) => {
    const currentModules = form.getValues("modules");
    if (currentModules.length === 1) {
      toast.error("You must have at least one module");
      return;
    }
    form.setValue(
      "modules",
      currentModules.filter((_, i) => i !== moduleIndex)
    );
  };

  const handleAddAttributeName = (moduleIndex: number) => {
    const currentNames = form.getValues(`modules.${moduleIndex}.attribute_names`);
    form.setValue(`modules.${moduleIndex}.attribute_names`, [...currentNames, ""]);
  };

  const handleRemoveAttributeName = (moduleIndex: number, nameIndex: number) => {
    const currentNames = form.getValues(`modules.${moduleIndex}.attribute_names`);
    if (currentNames.length === 1) {
      toast.error("Each module must have at least one attribute name");
      return;
    }
    form.setValue(
      `modules.${moduleIndex}.attribute_names`,
      currentNames.filter((_, i) => i !== nameIndex)
    );
  };

  const handleModuleChange = (moduleIndex: number, value: string) => {
    if (value === "custom") {
      form.setValue(`modules.${moduleIndex}.isCustomModule`, true);
      form.setValue(`modules.${moduleIndex}.module`, "");
    } else {
      form.setValue(`modules.${moduleIndex}.isCustomModule`, false);
      form.setValue(`modules.${moduleIndex}.module`, value);
    }
  };

  const handleSubmit = () => {
    const values = form.getValues();
    const validation = FormSchema.safeParse(values);

    if (!validation.success) {
      validation.error.issues.forEach((error:any) => {
        toast.error(error.message);
      });
      return;
    }

    startTransition(async () => {
      try {
        // Transform data to match server function format
        const formattedData = validation.data.modules.map((module) => ({
          module: module.module.toLowerCase(),
          attribute_name: module.attribute_names.filter((name) => name.trim() !== ""),
        }));

        await addNewAttribute(formattedData);

        const totalAttributes = formattedData.reduce(
          (sum, mod) => sum + mod.attribute_name.length,
          0
        );
        styledToast.success(
          `Successfully added ${totalAttributes} attribute(s) across ${formattedData.length} module(s)`
        );
        form.reset();
      } catch (error) {
        console.error(`An error occurred: ${error}`);
        toast.error("Failed to add attributes");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="text-center">Loading attributes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>Failed to load attributes. Please refresh the page.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <button
                        className="flex items-center gap-2"
                        onClick={() => router.back()}>
                        ← Back
                    </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add New Attributes</h1>
        <p className="text-gray-600">
          Create product attributes for inventory categorization and variants
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {modules.map((module, moduleIndex) => (
            <Card key={moduleIndex} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Module {moduleIndex + 1}
                    </CardTitle>
                    <CardDescription>
                      {module.module
                        ? `${module.module} (${module.attribute_names.filter((n) => n.trim()).length} attributes)`
                        : "Select a module and add attribute names"}
                    </CardDescription>
                  </div>
                  {modules.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveModule(moduleIndex)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Module
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Module Selection */}
                <div className="space-y-2">
                  <FormLabel>Module/Category *</FormLabel>
                  
                  {existingModules.length > 0 ? (
                    <>
                      <Select
                        value={module.isCustomModule ? "custom" : module.module}
                        onValueChange={(value) => handleModuleChange(moduleIndex, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select existing module or create new" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingModules.map((mod: any) => (
                            <SelectItem key={mod} value={mod} className="capitalize">
                              {mod}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">+ Create New Module</SelectItem>
                        </SelectContent>
                      </Select>

                      {module.isCustomModule && (
                        <FormField
                          control={form.control}
                          name={`modules.${moduleIndex}.module`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  placeholder="Enter new module name (e.g., brand, flavor, capacity)"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name={`modules.${moduleIndex}.module`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Enter module name (e.g., size, color, weight)"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Attribute Names */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Attribute Names *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddAttributeName(moduleIndex)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Name
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {module.attribute_names.map((_, nameIndex) => (
                      <FormField
                        key={nameIndex}
                        control={form.control}
                        name={`modules.${moduleIndex}.attribute_names.${nameIndex}`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Input
                                  placeholder={`e.g., ${
                                    module.module === "size"
                                      ? "small, medium, large"
                                      : module.module === "color"
                                      ? "red, blue, green"
                                      : module.module === "weight"
                                      ? "100g, 250g, 500g"
                                      : "Enter value"
                                  }`}
                                  {...field}
                                />
                              </FormControl>
                              {module.attribute_names.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveAttributeName(moduleIndex, nameIndex)
                                  }
                                  className="shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview Box */}
                {module.module && module.attribute_names.some((n) => n.trim()) && (
                  <div className="mt-4 p-3 border rounded-lg bg-slate-50">
                    <span className="text-sm text-gray-600 mb-2 block">Preview:</span>
                    <div className="flex flex-wrap gap-2">
                      {module.attribute_names
                        .filter((name) => name.trim())
                        .map((name, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="px-2 py-1 bg-slate-200 rounded text-xs font-medium capitalize">
                              {module.module}
                            </div>
                            <span className="font-medium">{name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddModule}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Module
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              {isPending ? "Adding..." : "Add Attributes"}
            </Button>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertDescription>
              <strong>Tip:</strong> {existingModules.length > 0 
                ? `Select from existing modules (${existingModules.join(", ")}) or create a new one. `
                : "Start by creating your first module. "}
              Add multiple attribute names under each module. For example, under "size" you can add: 
              small, medium, large, xl.
            </AlertDescription>
          </Alert>
        </div>
      </Form>
    </div>
  );
}