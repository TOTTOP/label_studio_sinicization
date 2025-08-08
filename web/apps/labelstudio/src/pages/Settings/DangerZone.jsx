import { useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Button } from "../../components";
import { Label } from "../../components/Form";
import { confirm } from "../../components/Modal/Modal";
import { Spinner } from "../../components/Spinner/Spinner";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";

export const DangerZone = () => {
  const { project } = useProject();
  const api = useAPI();
  const history = useHistory();
  const [processing, setProcessing] = useState(null);

  const handleOnClick = (type) => () => {
    confirm({
      title: "操作确认",
      body: "您即将删除所有内容。此操作无法撤销。",
      okText: "继续",
      buttonLook: "destructive",
      onOk: async () => {
        setProcessing(type);
        if (type === "annotations") {
          // console.log('删除标注');
        } else if (type === "tasks") {
          // console.log('删除任务');
        } else if (type === "predictions") {
          // console.log('删除预测');
        } else if (type === "reset_cache") {
          await api.callApi("projectResetCache", {
            params: {
              pk: project.id,
            },
          });
        } else if (type === "tabs") {
          await api.callApi("deleteTabs", {
            body: {
              project: project.id,
            },
          });
        } else if (type === "project") {
          await api.callApi("deleteProject", {
            params: {
              pk: project.id,
            },
          });
          history.replace("/projects");
        }
        setProcessing(null);
      },
    });
  };

  const buttons = useMemo(
    () => [
      {
        type: "annotations",
        disabled: true, //&& !project.total_annotations_number,
        label: `Delete ${project.total_annotations_number} Annotations`,
      },
      {
        type: "tasks",
        disabled: true, //&& !project.task_number,
        label: `Delete ${project.task_number} Tasks`,
      },
      {
        type: "predictions",
        disabled: true, //&& !project.total_predictions_number,
        label: `Delete ${project.total_predictions_number} Predictions`,
      },
      {
        type: "reset_cache",
        help:
          "重置缓存可能会在以下情况下有所帮助：当您由于现有标签的验证错误而无法修改标注配置，但您确信这些标签并不存在时。您可以使用此操作重置缓存并再次尝试。",
        label: "重置缓存",
      },
      {
        type: "tabs",
        help: "如果数据管理器无法加载，删除所有数据管理器标签可能会有所帮助。",
        label: "删除所有标签",
      },
      {
        type: "project",
        help: "删除项目会从数据库中移除所有任务、标注和项目数据。",
        label: "删除项目",
      },
    ],
    [project],
  );

  return (
    <div className={cn("simple-settings")}>
      <h1>危险操作</h1>
      <Label description="请自行承担执行这些操作的风险。您在本页面执行的操作无法撤销。请确保已备份您的数据。" />

      {project.id ? (
        <div style={{ marginTop: 16 }}>
          {buttons.map((btn) => {
            const waiting = processing === btn.type;
            const disabled = btn.disabled || (processing && !waiting);

            return (
              btn.disabled !== true && (
                <div className={cn("settings-wrapper")} key={btn.type}>
                  <h3>{btn.label}</h3>
                  {btn.help && <Label description={btn.help} style={{ width: 600, display: "block" }} />}
                  <Button
                    key={btn.type}
                    look="danger"
                    disabled={disabled}
                    waiting={waiting}
                    onClick={handleOnClick(btn.type)}
                    style={{ marginTop: 16 }}
                  >
                    {btn.label}
                  </Button>
                </div>
              )
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Spinner size={32} />
        </div>
      )}
    </div>
  );
};

DangerZone.title = "危险操作";
DangerZone.path = "/danger-zone";
