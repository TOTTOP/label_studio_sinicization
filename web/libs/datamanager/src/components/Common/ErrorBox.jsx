import { inject } from "mobx-react";
import { Button } from "./Button/Button";
import { Dropdown } from "./Dropdown/Dropdown";
import { Menu } from "./Menu/Menu";
import { IconInfo } from "@humansignal/icons";

const ErrorRenderer = (error, i) => {
  return (
    <Menu.Item key={i} disabled={true}>
      {error.response?.detail}
    </Menu.Item>
  );
};

const injector = inject(({ store }) => {
  return {
    errors: store.serverErrors,
  };
});

export const ErrorBox = injector(({ errors }) => {
  return errors?.size > 0 ? (
    <Dropdown.Trigger content={<Menu>{Array.from(errors.values()).map(ErrorRenderer)}</Menu>}>
      <Button
        type="text"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0 10px",
          fontSize: 12,
        }}
        icon={<IconInfo color="#ff5a46" size={18} style={{ marginRight: 5 }} />}
      >
        Errors occurred
      </Button>
    </Dropdown.Trigger>
  ) : null;
});
