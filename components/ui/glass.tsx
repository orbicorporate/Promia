import { cn } from "./cn";

// Painel de vidro. `forte` para o que fica por cima de outro vidro
// (folhas, menus) e precisa de mais contraste.
export function Glass({
  as: Tag = "div",
  forte,
  className,
  children,
  ...rest
}: {
  as?: "div" | "section" | "article" | "aside" | "header" | "li" | "nav" | "form";
  forte?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag className={cn(forte ? "vidro-forte" : "vidro", "rounded-[24px]", className)} {...rest}>
      {children}
    </Tag>
  );
}
