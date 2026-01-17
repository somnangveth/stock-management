// "use client";

// import { useState } from "react";
// import { RxPlusCircled } from "react-icons/rx";
// import { btnStyle } from "@/app/components/ui";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import CreateLedger from "./addform";
// import { Button } from "@/components/ui/button";

// interface LedgerFormProps {
// onSuccess?:()=>void;
//   onLedgerAdded?: () => void;
// }

// export default function LedgerForm({onSuccess, onLedgerAdded }: LedgerFormProps) {
//   const [open, setOpen] = useState(false);

//   const handleSuccess = () => {
//     setOpen(false); // 关闭弹窗
//     onLedgerAdded?.(); // 触发父组件刷新
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <button
//         className=" bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-amber-400 hover:border-yellow-400 font-medium transition-colors"
//  type="button">
//           <RxPlusCircled className="w-4 h-4" />
//           <span>Add Ledger</span>
//         </button>
//       </DialogTrigger>
      
//       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Create Ledger Entry</DialogTitle>
//         </DialogHeader>
        
//         <CreateLedger onSuccess={handleSuccess} />
//       </DialogContent>
//     </Dialog>
//   );
// }
