import { useCallback, useContext, useEffect, useState } from "react";
import { Button, Card, Dropdown, Menu } from "../../../components";
import { ApiContext } from "../../../providers/ApiProvider";
import { StorageSummary } from "./StorageSummary";
import { IconEllipsisVertical } from "@humansignal/icons";

export const StorageCard = ({ rootClass, target, storage, onEditStorage, onDeleteStorage, storageTypes }) => {
  const [syncing, setSyncing] = useState(false);
  const api = useContext(ApiContext);
  const [storageData, setStorageData] = useState({ ...storage });
  const [synced, setSynced] = useState(null);

  const startSync = useCallback(async () => {
    setSyncing(true);
    setSynced(null);

    const result = await api.callApi("syncStorage", {
      params: {
        target,
        type: storageData.type,
        pk: storageData.id,
      },
    });

    if (result) {
      setStorageData(result);
      setSynced(result.last_sync_count);
    }

    setSyncing(false);
  }, [storage]);

  useEffect(() => {
    setStorageData(storage);
  }, [storage]);

  const notSyncedYet = synced !== null || ["in_progress", "queued"].includes(storageData.status);

  return (
    <Card
      header={storageData.title?.slice?.(0, 70) ?? `Untitled ${storageData.type}`}
      extra={
        <Dropdown.Trigger
          align="right"
          content={
            <Menu size="compact" style={{ width: 110 }}>
              <Menu.Item onClick={() => onEditStorage(storageData)}>编辑</Menu.Item>
              <Menu.Item onClick={() => onDeleteStorage(storageData)}>删除</Menu.Item>
            </Menu>
          }
        >
          <Button type="link" style={{ marginRight: -10 }} icon={<IconEllipsisVertical />} />
        </Dropdown.Trigger>
      }
    >
      <StorageSummary
        target={target}
        storage={storageData}
        className={rootClass.elem("summary")}
        storageTypes={storageTypes}
      />
      <div className={rootClass.elem("sync")}>
        <div>
          <Button waiting={syncing} onClick={startSync} disabled={notSyncedYet}>
            同步存储
          </Button>
          {notSyncedYet && (
            <div className={rootClass.elem("sync-count")}>
              同步可能需要一些时间，请刷新页面查看当前状态。
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
