import { toast } from "sonner";

export const styledToast = {
  success: (msg: string, desc?: string) =>
    toast.success(msg, {
      description: desc,
      className: "bg-green-600 text-white font-medium rounded-lg",
      duration: 2500,
    }),

  error: (msg: string, desc?: string) =>
    toast.error(msg, {
      description: desc,
      className: "bg-red-600 text-white font-medium rounded-lg",
      duration: 2500,
    }),

  warning: (msg: string, desc?: string) =>
    toast.warning(msg, {
      description: desc,
      className: "bg-yellow-500 text-white font-medium rounded-lg",
      duration: 2500,
    }),
}
