import { observer } from "mobx-react";
import { Button } from "../../common/Button/Button";
import { IconRedo, IconRemove, IconUndo } from "@humansignal/icons";
import { Tooltip } from "@humansignal/ui";
import { Block, Elem } from "../../utils/bem";
import "./HistoryActions.scss";

export const EditingHistory = observer(({ entity }) => {
  const { history } = entity;

  return (
    <Block name="history-buttons">
      <Tooltip title="Undo">
        <Elem
          tag={Button}
          name="action"
          type="text"
          aria-label="Undo"
          disabled={!history?.canUndo}
          onClick={() => entity.undo()}
          icon={<IconUndo />}
        />
      </Tooltip>
      <Tooltip title="Redo">
        <Elem
          tag={Button}
          name="action"
          type="text"
          aria-label="Redo"
          disabled={!history?.canRedo}
          onClick={() => entity.redo()}
          icon={<IconRedo />}
        />
      </Tooltip>
      <Tooltip title="Reset">
        <Elem
          tag={Button}
          name="action"
          look="danger"
          type="text"
          aria-label="Reset"
          disabled={!history?.canUndo}
          onClick={() => history?.reset()}
          icon={<IconRemove />}
        />
      </Tooltip>
    </Block>
  );
});
