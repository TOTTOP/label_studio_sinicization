import { inject } from "mobx-react";
import { IconRefresh } from "@humansignal/icons";
import { Button } from "../../Common/Button/Button";

const injector = inject(({ store }) => {
  return {
    store,
    needsDataFetch: store.needsDataFetch,
    projectFetch: store.projectFetch,
  };
});

export const RefreshButton = injector(({ store, needsDataFetch, projectFetch, size, style, ...rest }) => {
  return (
    <Button
      size={size}
      look={needsDataFetch}
      waiting={projectFetch}
      onClick={async () => {
        await store.fetchProject({ force: true, interaction: "refresh" });
        await store.currentView?.reload();
      }}
      style={{
        ...(style ?? {}),
        minWidth: 0,
        padding: 0,
        width: 40,
      }}
      {...rest}
    >
      <IconRefresh width={24} height={24} />
    </Button>
  );
});
