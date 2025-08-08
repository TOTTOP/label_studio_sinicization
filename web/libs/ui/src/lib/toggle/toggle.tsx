import { forwardRef, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Label } from "@humansignal/ui";
import styles from "./toggle.module.scss";

type ToggleProps = {
  className?: string;
  label?: string;
  labelProps?: Partial<React.ComponentProps<typeof Label>>;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
  alwaysBlue?: boolean;
};

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      className,
      label,
      labelProps,
      description,
      checked,
      defaultChecked,
      onChange,
      required,
      style,
      alwaysBlue,
      ...props
    },
    ref,
  ) => {
    const initialChecked = useMemo(() => defaultChecked ?? checked ?? false, [defaultChecked, checked]);
    const [isChecked, setIsChecked] = useState<boolean>(defaultChecked ?? checked ?? false);
    useEffect(() => {
      setIsChecked(initialChecked);
    }, [initialChecked]);

    const formField = (
      <div
        className={clsx(
          styles.toggle,
          {
            [styles.toggle_disabled]: props.disabled,
            [styles.toggle_checked]: isChecked,
            [styles.toggle_alwaysBlue]: alwaysBlue,
          },
          className,
        )}
        style={style}
      >
        <input
          {...props}
          ref={ref}
          className={clsx(styles.toggle__input)}
          type="checkbox"
          checked={isChecked}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setIsChecked(e.target.checked);
            onChange?.(e);
          }}
        />
        <span className={clsx(styles.toggle__indicator)} />
      </div>
    );

    return label ? (
      <Label
        placement="right"
        required={required}
        text={label}
        description={description}
        className="gap-2"
        {...(labelProps ?? {})}
      >
        {formField}
      </Label>
    ) : (
      formField
    );
  },
);
