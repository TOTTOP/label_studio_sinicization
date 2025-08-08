import { cn } from "@humansignal/shad/utils";
import { createElement, type HtmlHTMLAttributes, type PropsWithChildren } from "react";

export type HeadingProps = PropsWithChildren<
  {
    size: 1 | 2 | 3 | 4 | 5 | 6;
  } & HtmlHTMLAttributes<HTMLHeadingElement>
>;
const Styles: Record<number, string> = {
  1: "text-2xl",
  2: "text-2xl",
  3: "text-xl",
  4: "text-lg",
  5: "text-normal",
  6: "text-sm",
};

export function Heading({ size, children, className: cls, ...tagProps }: HeadingProps) {
  const className = cn(Styles[size], cls);
  return createElement(`h${size}`, { ...tagProps, className }, children);
}
