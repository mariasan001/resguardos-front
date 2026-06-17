"use client";

import { toast } from "sonner";

export const notify = {
  success(title: string, description?: string) {
    return toast.success(title, { description });
  },
  error(title: string, description?: string) {
    return toast.error(title, { description });
  },
  info(title: string, description?: string) {
    return toast.info(title, { description });
  },
  warning(title: string, description?: string) {
    return toast.warning(title, { description });
  },
};
