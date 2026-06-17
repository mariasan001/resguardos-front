import styles from "@/components/ui/FeedbackMessage.module.css";

interface FeedbackMessageProps {
  tone?: "success" | "error" | "info";
  message: string;
}

export default function FeedbackMessage({
  tone = "info",
  message,
}: FeedbackMessageProps) {
  const className =
    tone === "success"
      ? styles.success
      : tone === "error"
        ? styles.error
        : styles.info;

  return <div className={`${styles.message} ${className}`}>{message}</div>;
}
