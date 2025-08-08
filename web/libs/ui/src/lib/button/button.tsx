import { cn } from "../../utils/utils";
import { forwardRef, type ButtonHTMLAttributes, type PropsWithChildren, type ReactNode } from "react";
import styles from "./button.module.scss";

const variants = {
  primary: styles["variant-primary"],
  neutral: styles["variant-neutral"],
  negative: styles["variant-negative"],
  positive: styles["variant-positive"],
  warning: styles["variant-warning"],
  inverted: styles["variant-neutral-interted"],
};

const looks = {
  filled: styles["look-filled"],
  string: styles["look-string"],
  outlined: styles["look-outlined"],
};

const sizes = {
  medium: styles["size-medium"], // 40px
  small: styles["size-small"], // 32px
  smaller: styles["size-smaller"], // 24px
};

const alignment = {
  default: styles["align-default"],
  center: styles["align-center"],
  left: styles["align-left"],
  right: styles["align-right"],
};

/**
 * Generates a className string with button styling that can be applied to any element
 *
 * This utility function creates a consistent button styling that can be applied not only to
 * button elements but also to other interactive elements like links (`<a>` tags), divs, or spans
 * that need to visually appear as buttons.
 *
 * @example
 * // Apply button styling to a link
 * <a href="/path" className={buttonVariant({ variant: 'primary', look: 'outlined' })}>
 *   Link that looks like a button
 * </a>
 */
export function buttonVariant(
  {
    variant = "primary",
    look = "filled",
    size = "medium",
    align = "default",
    waiting = false,
  }: {
    variant?: ButtonProps["variant"];
    look?: ButtonProps["look"];
    size?: ButtonProps["size"];
    align?: ButtonProps["align"];
    waiting?: boolean;
  },
  className?: string,
) {
  const buttonStyles = [styles.base, variants[variant], looks[look], sizes[size], alignment[align]];
  return cn(
    "inline-flex items-center rounded-smaller border text-shadow-button box-border border transition-all",
    ...buttonStyles,
    { [styles.waiting]: waiting },
    className,
  );
}

export type ButtonProps = {
  variant?: keyof typeof variants;
  look?: keyof typeof looks;
  size?: keyof typeof sizes;
  align?: keyof typeof alignment;
  waiting?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * A versatile button component with various styling options
 *
 * The Button component provides a consistent UI element for user interactions
 * with support for different visual variants, looks, and sizes. It can include
 * leading and trailing elements for additional visual context.
 */
const Button = forwardRef(
  (
    {
      children,
      className = "",
      variant = "primary",
      look = "filled",
      size = "medium",
      waiting = false,
      align = "default",
      leading,
      trailing,
      ...buttonProps
    }: PropsWithChildren<ButtonProps>,
    ref,
  ) => {
    return (
      <button
        {...buttonProps}
        ref={(el) => {
          if (ref instanceof Function) {
            ref(el);
          } else if (ref) {
            ref.current = el;
          }
        }}
        disabled={buttonProps.disabled ?? waiting}
        className={buttonVariant({ variant, look, size, waiting, align }, className)}
      >
        {leading}
        <span>{children}</span>
        {trailing}
      </button>
    );
  },
);

const ButtonGroup = ({ children, collapsed = true }: PropsWithChildren<{ collapsed?: boolean }>) => {
  const className = cn("inline-flex", styles["button-group"], {
    [styles["button-group-collapsed"]]: collapsed,
  });
  return <div className={className}>{children}</div>;
};

export { Button, ButtonGroup };
