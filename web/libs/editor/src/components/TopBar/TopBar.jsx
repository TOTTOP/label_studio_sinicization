import { observer } from "mobx-react";

import { Button } from "../../common/Button/Button";
import { IconViewAll, IconPlus } from "@humansignal/icons";
import { Tooltip } from "@humansignal/ui";
import { Block, Elem } from "../../utils/bem";
import { isSelfServe } from "../../utils/billing";
import { FF_BULK_ANNOTATION, FF_DEV_3873, isFF } from "../../utils/feature-flags";
import { AnnotationsCarousel } from "../AnnotationsCarousel/AnnotationsCarousel";
import { DynamicPreannotationsToggle } from "../AnnotationTab/DynamicPreannotationsToggle";
import { Actions } from "./Actions";
import { Annotations } from "./Annotations";
import { Controls } from "./Controls";
import { CurrentTask } from "./CurrentTask";

import "./TopBar.scss";

export const TopBar = observer(({ store }) => {
  const annotationStore = store.annotationStore;
  const entity = annotationStore?.selected;
  const isPrediction = entity?.type === "prediction";

  const isViewAll = annotationStore?.viewingAll === true;
  const isBulkMode = isFF(FF_BULK_ANNOTATION) && !isSelfServe() && store.hasInterface("annotation:bulk");

  if (isFF(FF_DEV_3873) && isBulkMode) return null;

  return store ? (
    <Block name="topbar" mod={{ newLabelingUI: isFF(FF_DEV_3873) }}>
      {isFF(FF_DEV_3873) ? (
        <Elem name="group">
          <CurrentTask store={store} />
          {store.hasInterface("annotations:view-all") && (
            <Tooltip title="Compare all annotations">
              <Button
                className={"topbar__button"}
                icon={<IconViewAll width={20} height={20} />}
                type={isViewAll ? undefined : "text"}
                aria-label="Compare all annotations"
                onClick={annotationStore.toggleViewingAllAnnotations}
                primary={isViewAll}
                size="medium"
                style={{
                  height: 28,
                  width: 28,
                  padding: 0,
                  marginRight: "var(--spacing-tight, 8px)",
                }}
              />
            </Tooltip>
          )}
          {store.hasInterface("annotations:add-new") && (
            <Tooltip title="Create a new annotation" style={{ "--offset-x": "11px" }}>
              <Button
                icon={<IconPlus />}
                className={"topbar__button"}
                type={isViewAll ? undefined : "text"}
                aria-label="Create an annotation"
                onClick={(event) => {
                  event.preventDefault();
                  const created = store.annotationStore.createAnnotation();

                  store.annotationStore.selectAnnotation(created.id);
                }}
                style={{
                  height: 28,
                  width: 28,
                  padding: 0,
                  marginRight: "var(--spacing-tight, 8px)",
                }}
              />
            </Tooltip>
          )}
          {!isViewAll && (
            <AnnotationsCarousel
              store={store}
              annotationStore={store.annotationStore}
              commentStore={store.commentStore}
            />
          )}
        </Elem>
      ) : (
        <>
          <Elem name="group">
            {!isBulkMode && <CurrentTask store={store} />}
            {!isViewAll && !isBulkMode && (
              <Annotations store={store} annotationStore={store.annotationStore} commentStore={store.commentStore} />
            )}
            <Actions store={store} />
          </Elem>
          <Elem name="group">
            {!isViewAll && (
              <Elem name="section">
                <DynamicPreannotationsToggle />
              </Elem>
            )}
            {!isViewAll && store.hasInterface("controls") && (store.hasInterface("review") || !isPrediction) && (
              <Elem name="section" mod={{ flat: true }} style={{ width: 320, boxSizing: "border-box" }}>
                <Controls annotation={entity} />
              </Elem>
            )}
          </Elem>
        </>
      )}
    </Block>
  ) : null;
});
