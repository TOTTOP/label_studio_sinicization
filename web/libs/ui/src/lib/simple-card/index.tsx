import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@humansignal/shad/components/ui/card";
import { cn } from "@humansignal/shad/utils";
import type { HtmlHTMLAttributes, PropsWithChildren, ReactNode } from "react";

export function SimpleCard({
  children,
  title,
  description,
  className: cls,
  ...rest
}: PropsWithChildren<
  {
    title: ReactNode;
    description?: ReactNode;
  } & Omit<HtmlHTMLAttributes<HTMLDivElement>, "title">
>) {
  const className = cn("bg-transparent", cls);
  const hasHeaderContent = Boolean(title || description);
  const contentClass = cn("p-4", { "pt-0": hasHeaderContent });
  return (
    <Card className={className} {...rest}>
      {hasHeaderContent && (
        <CardHeader className="p-4 pb-2">
          {title && <CardTitle className="flex justify-between font-medium">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={contentClass}>{children}</CardContent>
    </Card>
  );
}
