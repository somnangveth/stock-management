// 'use client';
// import ProductTable from "@/app/components/tables/producttable";
// import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
// import { cn } from "@/lib/utils"
// import { useQueries } from "@tanstack/react-query";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { AiOutlineLoading3Quarters } from "react-icons/ai";
// import AddCategoryForm from "../category/addcatform";
// import { fetchProducts } from "@/app/functions/admin/api/controller";
// import { btnStyle, view } from "@/app/components/ui";
// import { useRouter } from "next/navigation";
// import { EnhancedProduct } from "@/app/admin/products/components/product/productlists";

// export default function DisplayAll(
// { 
//   refreshKey = 0,
//   onDataLoaded,
//   onFilteredChange
// }: { 
//   refreshKey?: number;
//   onDataLoaded?: (
//     data: EnhancedProduct[], 
//     onSearch: (results: EnhancedProduct[]) => void,
//     searchKeys: (keyof EnhancedProduct)[]
//   ) => void;
//   onFilteredChange?: (items: EnhancedProduct[]) => void;
// }){

//   // --Hooks--
//   const [selectedCategory, setSelectedCategory] = useState<string>('all');
//   const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
//   const [displayProducts, setDisplayProducts] = useState<EnhancedProduct[]>([]);
//   const router = useRouter();

//   const handleSearchResults = useCallback((results: EnhancedProduct[]) => {
//     setDisplayProducts(results);
//   },[]);


//   // Queries All Datas
//   const result = useQueries({
//     queries: [
//       {
//         queryKey: ["category-subcategory-query"],
//         queryFn: fetchCategoryAndSubcategory,
//       },
//       {
//         queryKey: ["productsQuery"],
//         queryFn: fetchProducts,
//       }
//     ]
//   });

//   const categorySubcategoryData = result[0].data;
//   const productData = result[1].data;
//   const isLoading = result[0].isLoading || result[1].isLoading;
//   const hasError = result[0].error || result[1].error;

//   //Extracts categories and subcategories
//   const categories = useMemo(() => {
//     if(!categorySubcategoryData?.categories) return[];
//     return categorySubcategoryData.categories;
//   }, [categorySubcategoryData]);

//   const subcategories = useMemo(() => {
//     if(!categorySubcategoryData?.subcategories) return [];
//     return categorySubcategoryData.subcategories;
//   }, [categorySubcategoryData]);


//   const categoryMap = useMemo(() => {
//     return new Map(
//       categories.map((cat: {category_id: string; category_name: string;}) => 
//       [cat.category_id, cat.category_name])
//     )
//   }, [categories]);

//   const subcategoryMap = useMemo(() => {
//     return new Map(
//       subcategories.map((sub: {subcategory_id: string; subcategory_name: string;}) => 
//       [sub.subcategory_id, sub.subcategory_name])
//     )
//   }, [subcategories]);

//   //Filter subcategories based on selected category
//   const filteredSubcategories = useMemo(() => {
//     if(selectedCategory === 'all') return subcategories;
//     return subcategories.filter(
//       (sub: {category_id: number}) => sub.category_id === Number(selectedCategory)
//     );
//   }, [selectedCategory, subcategories]);

//   //Enhance and filter products
//   const filteredProducts = useMemo(() => {
//     //Check if productData is an array or has a product property
//     const products = Array.isArray(productData) ? productData : productData?.product;

//     if(!products || !Array.isArray(products)) return[];

//     let enhancedProducts = products.map((product: any) => ({
//       ...product,
//       category_name: categoryMap.get(product.category_id) || "Unknown",
//       subcategory_name: subcategoryMap.get(product.subcategory_id) || "Unknown",
//     }));

//     if(selectedCategory !== 'all'){
//       enhancedProducts = enhancedProducts.filter(
//         (p: {category_id: number}) => p.category_id === Number(selectedCategory)
//       )
//     }


//     if(selectedSubcategory !== 'all'){
//       enhancedProducts = enhancedProducts.filter(
//         (p: {subcategory_id: number}) => p.subcategory_id === Number(selectedSubcategory)
//       )
//     }

//     return enhancedProducts;
//   }, [productData, selectedCategory, selectedSubcategory, categoryMap, subcategoryMap]);

//   //Update display products when filtered products change
//   useEffect(() => {
//     setDisplayProducts(filteredProducts);
//     if(onFilteredChange){
//       onFilteredChange(filteredProducts);
//     }
//   }, [filteredProducts]);

//   //Notify parent component when data is loaded
//   useEffect(() => {
//     if(onDataLoaded && filteredProducts.length > 0){
//       const searchKeys: (keyof EnhancedProduct)[] = [
//         'product_name',
//         'sku_code',
//         'category_name',
//         'subcategory_name'
//       ];
//       onDataLoaded(filteredProducts, handleSearchResults, searchKeys);
//     }
//   }, [filteredProducts, onDataLoaded, handleSearchResults]);


//   //Reset subcategory when category changes
//   const handleCategoryChange = (categoryId: string) => {
//     setSelectedCategory(categoryId);
//     setSelectedSubcategory('all');
//   };

//   //Loading State
//   if(isLoading) {
//     return <div className="p-4 text-center">Products are loading...</div>
//   }

//   //Error State
//   if(hasError){
//     return <div className="p-4 text-center text-red-600">Failed to fetch product datas!</div>
//   }

//   if(!productData || !categorySubcategoryData){
//     return <div className="p-4 text-center">Loading <AiOutlineLoading3Quarters className={cn("animate-spin")}/></div>
//   }

//   return(
//     <div className="space-y-4">

//      <div className="flex flex-wrap gap-4 items-end justify-between">
//         <div className="flex gap-4">
//           {/* Filter Controls */}
//           <div>
//             <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
//               Category
//             </label>

//             <Select
//             value={selectedCategory}
//             onValueChange={handleCategoryChange}>
//               <SelectTrigger>
//                 <SelectValue placeholder="All Categories"/>
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">
//                   All Categories
//                 </SelectItem>
//                 {categories.map((cat: {category_id: number; category_name: string}) => (
//                   <SelectItem key={cat.category_id} value={String(cat.category_id)}>
//                     {cat.category_name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>


//           {/* Subcategory Filter */}
//           <div>
//             <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
//               Subcategory
//             </label>

//             <Select
//             value={selectedSubcategory}
//             onValueChange={setSelectedSubcategory}
//             disabled={selectedCategory === 'all' && subcategories.length > 0}>
//               <SelectTrigger>
//                 <SelectValue/>
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">
//                   All Subcategories
//                 </SelectItem>
//                 {filteredSubcategories.map((sub: {subcategory_id: number; subcategory_name: string}) => (
//                   <SelectItem key={sub.subcategory_id} value={String(sub.subcategory_id)}>
//                     {sub.subcategory_name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div className="flex flex-wrap gap-2">
//           <button
//           className={btnStyle}
//           onClick={() => router.push('/admin/categories/components/categoryinfo')}
//           >
//             {view}Categories
//           </button>
//           <AddCategoryForm/>
//           <AddSubcategoryForm/>
//         </div>
//       </div>

//       <ProductTable
//       itemsPerPage={7}
//       product={displayProducts}
//       columns={['sku-code', 'product_name', 'category_id', 'subcategory_id']}/>
//     </div>
//   )
// }