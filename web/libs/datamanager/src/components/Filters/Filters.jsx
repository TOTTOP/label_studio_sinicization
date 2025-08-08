import { inject } from "mobx-react";
import React from "react";
import { Block, cn, Elem } from "../../utils/bem";
import { Button } from "../Common/Button/Button";
import { Icon } from "../Common/Icon/Icon";
import { Tooltip } from "@humansignal/ui";
import { FilterLine } from "./FilterLine/FilterLine";
import { IconChevronRight, IconPlus } from "@humansignal/icons";
import "./Filters.scss";

const injector = inject(({ store }) => ({
  store,
  views: store.viewsStore,
  currentView: store.currentView,
  filters: store.currentView?.currentFilters ?? [],
}));

export const Filters = injector(({ views, currentView, filters }) => {
  const { sidebarEnabled } = views;

  const fields = React.useMemo(
    () =>
      currentView.availableFilters.reduce((res, filter) => {
        const target = filter.field.target;
        const groupTitle = target
          .split("_")
          .map((s) =>
            s
              .split("")
              .map((c, i) => (i === 0 ? c.toUpperCase() : c))
              .join(""),
          )
          .join(" ");

        const group = res[target] ?? {
          id: target,
          title: groupTitle,
          options: [],
        };

        group.options.push({
          value: filter.id,
          title: filter.field.title,
          original: filter,
        });

        return { ...res, [target]: group };
      }, {}),
    [currentView.availableFilters],
  );

  return (
    <Block name="filters" mod={{ sidebar: sidebarEnabled }}>
      <Elem name="list" mod={{ withFilters: !!filters.length }}>
        {filters.length ? (
          filters.map((filter, i) => (
            <FilterLine
              index={i}
              filter={filter}
              view={currentView}
              sidebar={sidebarEnabled}
              value={filter.currentValue}
              key={`${filter.filter.id}-${i}`}
              availableFilters={Object.values(fields)}
              dropdownClassName={cn("filters").elem("selector")}
            />
          ))
        ) : (
          <Elem name="empty">No filters applied</Elem>
        )}
      </Elem>
      <Elem name="actions">
        <Button type="primary" size="small" onClick={() => currentView.createFilter()} icon={<IconPlus />}>
          Add {filters.length ? "Another Filter" : "Filter"}
        </Button>

        {!sidebarEnabled ? (
          <Tooltip title="Pin to sidebar">
            <Button
              type="link"
              size="small"
              about="Pin to sidebar"
              onClick={() => views.expandFilters()}
              style={{ display: "inline-flex", alignItems: "center", padding: 0, width: "var(--button-height)" }}
              icon={<Icon icon={IconChevronRight} size={18} />}
            />
          </Tooltip>
        ) : null}
      </Elem>
    </Block>
  );
});
