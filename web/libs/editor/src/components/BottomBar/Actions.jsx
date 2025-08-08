import { IconInfoOutline, IconSettings } from "@humansignal/icons";
import { Tooltip } from "@humansignal/ui";
import { Button } from "../../common/Button/Button";
import { Elem } from "../../utils/bem";
import { isSelfServe } from "../../utils/billing";
import { FF_BULK_ANNOTATION } from "../../utils/feature-flags";
import { EditingHistory } from "./HistoryActions";
import { DynamicPreannotationsToggle } from "../AnnotationTab/DynamicPreannotationsToggle";
import { AutoAcceptToggle } from "../AnnotationTab/AutoAcceptToggle";
import { GroundTruth } from "../CurrentEntity/GroundTruth";

export const Actions = ({ store }) => {
  const annotationStore = store.annotationStore;
  const entity = annotationStore.selected;
  const isPrediction = entity?.type === "prediction";
  const isViewAll = annotationStore.viewingAll === true;
  const isBulkMode = isFF(FF_BULK_ANNOTATION) && !isSelfServe() && store.hasInterface("annotation:bulk");

  return (
    <Elem name="section">
      {!isPrediction && !isViewAll && store.hasInterface("edit-history") && <EditingHistory entity={entity} />}

      {store.description && store.hasInterface("instruction") && (
        <Tooltip alignment="top-left" title="Show instructions">
          <Button
            icon={<IconInfoOutline style={{ width: 20, height: 20 }} />}
            type="text"
            aria-label="Instructions"
            onClick={() => store.toggleDescription()}
            style={{
              height: 36,
              width: 36,
              padding: 0,
            }}
          />
        </Tooltip>
      )}
      <Tooltip alignment="top-left" title="设置">
        <Button
          icon={<IconSettings />}
          type="text"
          aria-label="设置"
          onClick={() => store.toggleSettings()}
          style={{
            height: 36,
            width: 36,
            padding: 0,
          }}
        />
      </Tooltip>

      {store.hasInterface("ground-truth") && !isBulkMode && <GroundTruth entity={entity} />}

      {!isViewAll && (
        <Elem name="section">
          <DynamicPreannotationsToggle />
          <AutoAcceptToggle />
        </Elem>
      )}
    </Elem>
  );
};
