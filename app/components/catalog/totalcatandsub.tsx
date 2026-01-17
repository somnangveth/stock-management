// "use client";

// import { fetchCategoryAndSubcategory } from "@/app/functions/admin/api/controller";
// import { Categories, Subcategories } from "@/type/producttype";
// import { useQuery } from "@tanstack/react-query";
// import { AiOutlineLoading3Quarters } from "react-icons/ai";

// export default function TotalSubcategoryCatalog(){

//     const {data, isLoading, error} = useQuery<{categories: Categories[], subcategories:Subcategories[]}>({
//         queryKey: ['category-subcategory'],
//         queryFn: fetchCategoryAndSubcategory,
//     });
//     const category = data?.categories;
//     const subcategory = data?.subcategories;

//     const totalCategory = category?.length;
//     const totalSubcategory = subcategory?.length;

//     if(isLoading){
//         return <p>Loading <AiOutlineLoading3Quarters className="animate-spin"/></p>
//     }

//     if(error || !data){
//         return <p>Failed to load datas!</p>
//     }
//     return (
//         <div className="flex w-full gap-2 h-30 mt-5">
//             {/* Category */}
//             <div className="w-1/2 border border-gray-300 rounded-lg  text-gray-600 p-3 bg-[#FAF3E1]">
//                 <span className="font-bold text-lg">Category Total</span>
//                 <h1 className="flex items-end justify-end text-amber-700 text-5xl">{totalCategory}</h1>
//             </div>
//             <div className="w-1/2 border border-gray-300 rounded-lg text-gray-600 p-3 bg-[#FAF3E1]">
//                 <span className="font-bold text-lg">Subategory Total</span>
//                 <h1 className="flex justify-end text-amber-700 text-5xl">{totalSubcategory}</h1>
//             </div>
//         </div>
//     )
// }