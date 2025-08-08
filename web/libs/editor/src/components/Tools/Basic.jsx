import { Component } from "react";
import { Button } from "antd";
import { Tooltip } from "@humansignal/ui";
import { observer } from "mobx-react";

import styles from "./Styles.module.scss";

export default observer(
  class BasicToolView extends Component {
    render() {
      return (
        <Tooltip title={this.props.tooltip} alignment="top-left">
          <Button
            shape="circle"
            type={this.props.selected ? "primary" : "default"}
            disabled={!!this.props.disabled}
            icon={this.props.icon}
            className={styles.button}
            onClick={this.props.onClick}
          />
        </Tooltip>
      );
    }
  },
);
