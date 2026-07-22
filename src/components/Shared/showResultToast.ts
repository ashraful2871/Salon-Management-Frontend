import { toast } from "sonner";

type ResultShape = {
  success: boolean;
  message?: string;
};

export function showResultToast(result: ResultShape, defaultSuccess?: string, defaultError?: string) {
  if (result?.success) {
    toast.success(result.message || defaultSuccess || "Operation successful");
  } else {
    toast.error(result?.message || defaultError || "Something went wrong");
  }
}
