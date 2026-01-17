import { toast } from "sonner";

export const styledToast = {
  success: (msg: string, desc?: string) =>
    toast.success(msg, {
      description: desc,
      style: {
        background: '#16a34a', // green-600
        color: 'white',
        fontWeight: '500',
        borderRadius: '0.5rem',
        border: 'none',
      },
      duration: 2500,
    }),
  error: (msg: string, desc?: string) =>
    toast.error(msg, {
      description: desc,
      style: {
        background: '#dc2626', // red-600
        color: 'white',
        fontWeight: '500',
        borderRadius: '0.5rem',
        border: 'none',
      },
      duration: 2500,
    }),
  warning: (msg: string, desc?: string) =>
    toast.warning(msg, {
      description: desc,
      style: {
        background: '#eab308', // yellow-500
        color: 'white',
        fontWeight: '500',
        borderRadius: '0.5rem',
        border: 'none',
      },
      duration: 2500,
    }),
};
