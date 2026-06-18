"use client";

import { CircleAlert, CircleCheck, CircleX, Info, LoaderCircle, X } from "lucide-react";
import { Toaster, type ToasterProps } from "sonner";

const icons: NonNullable<ToasterProps["icons"]> = {
  success: <CircleCheck size={18} strokeWidth={1.9} />,
  info: <Info size={18} strokeWidth={1.9} />,
  warning: <CircleAlert size={18} strokeWidth={1.9} />,
  error: <CircleX size={18} strokeWidth={1.9} />,
  loading: <LoaderCircle size={18} strokeWidth={1.9} />,
  close: <X size={16} strokeWidth={2} />,
};

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      visibleToasts={4}
      closeButton
      duration={4200}
      icons={icons}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "app-toast",
          content: "app-toast__content",
          title: "app-toast__title",
          description: "app-toast__description",
          actionButton: "app-toast__action",
          cancelButton: "app-toast__cancel",
          closeButton: "app-toast__close",
          success: "app-toast--success",
          error: "app-toast--error",
          info: "app-toast--info",
          warning: "app-toast--warning",
          loading: "app-toast--loading",
        },
      }}
    />
  );
}
