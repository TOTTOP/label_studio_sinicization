import { inject } from "mobx-react";
import { Button } from "../../Common/Button/Button";
import { Interface } from "../../Common/Interface";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevron, IconChevronDown } from "@humansignal/icons";

const injector = inject(({ store }) => {
  const { dataStore, currentView } = store;
  const totalTasks = store.project?.task_count ?? store.project?.task_number ?? 0;
  const foundTasks = dataStore?.total ?? 0;

  return {
    store,
    canLabel: totalTasks > 0 || foundTasks > 0,
    target: currentView?.target ?? "tasks",
    selectedCount: currentView?.selectedCount,
    allSelected: currentView?.allSelected,
  };
});

export const LabelButton = injector(({ store, canLabel, size, target, selectedCount }) => {
  // const all = selectedCount === 0 || allSelected;
  const disabled = target === "annotations";
  const triggerRef = useRef();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback(() => setIsOpen((isOpen) => !isOpen), []);

  const handleClickOutside = useCallback((e) => {
    const el = triggerRef.current;

    if (el && !el.contains(e.target)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside, { capture: true });

    return () => {
      document.removeEventListener("click", handleClickOutside, { capture: true });
    };
  }, []);

  const onLabelAll = () => {
    localStorage.setItem("dm:labelstream:mode", "all");
    store.startLabelStream();
  };

  const onLabelVisible = () => {
    localStorage.setItem("dm:labelstream:mode", "filtered");
    store.startLabelStream();
  };

  const triggerStyle = {
    width: 24,
    padding: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: isOpen ? 0 : undefined,
    boxShadow: "none",
  };

  const primaryStyle = {
    width: 160,
    padding: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: isOpen ? 0 : undefined,
  };

  const secondStyle = {
    width: triggerStyle.width + primaryStyle.width,
    padding: 0,
    display: isOpen ? "flex" : "none",
    position: "absolute",
    zIndex: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  };

  selectedCount;

  return canLabel ? (
    <Interface name="labelButton">
      <div>
        <div style={{ display: "flex" }}>
          <Button
            size={size}
            disabled={disabled}
            mod={{ size: size ?? "medium", look: "primary", disabled }}
            style={primaryStyle}
            onClick={onLabelAll}
          >
            标注 {selectedCount ? selectedCount : "所有"} 任务{!selectedCount || selectedCount > 1 ? "" : ""}
          </Button>
          <Button
            ref={triggerRef}
            size={size}
            mod={{ size: size ?? "medium", look: "primary", disabled }}
            style={triggerStyle}
            onClick={toggleOpen}
            aria-label={"Toggle open"}
          >
            {isOpen ? <IconChevron /> : <IconChevronDown />}
          </Button>
        </div>
        <Button size={size} style={secondStyle} mod={{ size: size ?? "medium", disabled }} onClick={onLabelVisible}>
          标注显示的任务
        </Button>
      </div>
    </Interface>
  ) : null;
});
