import { observer } from "mobx-react";
import { Button } from "../../common/Button/Button";
import { IconStar, IconStarOutline } from "@humansignal/icons";
import { Tooltip } from "@humansignal/ui";
import { BemWithSpecifiContext } from "../../utils/bem";
import { FF_DEV_3873, isFF } from "../../utils/feature-flags";
import "./GroundTruth.scss";

const { Block, Elem } = BemWithSpecifiContext();

export const GroundTruth = observer(({ entity, disabled = false, size = "md" }) => {
  const title = entity.ground_truth ? "Unset this result as a ground truth" : "Set this result as a ground truth";

  return (
    !entity.skipped &&
    !entity.userGenerate &&
    entity.type !== "prediction" && (
      <Block name="ground-truth" mod={{ disabled, size }}>
        <Tooltip alignment="top-left" title={title}>
          <Elem
            tag={Button}
            name="toggle"
            size="small"
            type="link"
            onClick={(ev) => {
              ev.preventDefault();
              entity.setGroundTruth(!entity.ground_truth);
            }}
          >
            <Elem
              name="indicator"
              tag={isFF(FF_DEV_3873) && !entity.ground_truth ? IconStarOutline : IconStar}
              mod={{ active: entity.ground_truth, dark: isFF(FF_DEV_3873) }}
            />
          </Elem>
        </Tooltip>
      </Block>
    )
  );
});
