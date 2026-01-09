"use client";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaRedoAlt } from "react-icons/fa";

export function RetryButton(){
    return(
        <button
        onClick={() => window.location.reload()}
        className="flex items-center px-3 py-1 border border-gray-400 text-gray-400 rounded-lg gap-2">
           <FaRedoAlt/> Retry
        </button>
    )
}

export function IsLoading(){
    return(
        <div className="flex items-center justify-center gap-2 p-8 text-gray-500 text-sm">
                Loading <AiOutlineLoading3Quarters className="animate-spin" />
        </div>
    )
}