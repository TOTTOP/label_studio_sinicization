import { useCallback, useContext } from "react";
import { Button, Columns } from "../../../components";
import { confirm, modal } from "../../../components/Modal/Modal";
import { Spinner } from "../../../components/Spinner/Spinner";
import { ApiContext } from "../../../providers/ApiProvider";
import { projectAtom } from "../../../providers/ProjectProvider";
import { StorageCard } from "./StorageCard";
import { StorageForm } from "./StorageForm";
import { useAtomValue } from "jotai";
import { useStorageCard } from "./hooks/useStorageCard";

export const StorageSet = ({ title, target, rootClass, buttonLabel }) => {
  const api = useContext(ApiContext);
  const project = useAtomValue(projectAtom);
  const storageTypesQueryKey = ["storage-types", target];
  const storagesQueryKey = ["storages", target, project?.id];

  const {
    storageTypes,
    storageTypesLoading,
    storageTypesLoaded,
    reloadStorageTypes,
    storages,
    storagesLoading,
    storagesLoaded,
    reloadStoragesList,
    loading,
    loaded,
    fetchStorages,
  } = useStorageCard(target, project?.id);

  const showStorageFormModal = useCallback(
    (storage) => {
      const action = storage ? "编辑" : "添加";
      const actionTarget = target === "export" ? "目标" : "源";
      const title = `${action} ${actionTarget} 存储`;

      const modalRef = modal({
        title,
        closeOnClickOutside: false,
        style: { width: 760 },
        body: (
          <StorageForm
            target={target}
            storage={storage}
            project={project.id}
            rootClass={rootClass}
            storageTypes={storageTypes}
            onSubmit={async () => {
              await fetchStorages();
              modalRef.close();
            }}
          />
        ),
        footer: (
          <>
            将完成的标注保存到 Amazon S3、Google Cloud、Microsoft Azure 或 Redis。
            <br />
            <a href="https://labelstud.io/guide/storage.html">查看文档了解更多</a>。
          </>
        ),
      });
    },
    [project, fetchStorages, target, rootClass],
  );

  const onEditStorage = useCallback(
    async (storage) => {
      showStorageFormModal(storage);
    },
    [showStorageFormModal],
  );

  const onDeleteStorage = useCallback(
    async (storage) => {
      confirm({
        title: "删除存储",
        body: "此操作无法撤销。您确定吗？",
        buttonLook: "destructive",
        onOk: async () => {
          const response = await api.callApi("deleteStorage", {
            params: {
              type: storage.type,
              pk: storage.id,
              target,
            },
          });

          if (response !== null) fetchStorages();
        },
      });
    },
    [fetchStorages],
  );

  return (
    <Columns.Column title={title}>
      <div className={rootClass.elem("controls")}>
        <Button onClick={() => showStorageFormModal()} disabled={loading}>
          {buttonLabel}
        </Button>
      </div>

      {loading && !loaded ? (
        <div className={rootClass.elem("empty")}>
          <Spinner size={32} />
        </div>
      ) : storagesLoaded && storages.length === 0 ? null : (
        storages?.map?.((storage) => (
          <StorageCard
            key={storage.id}
            storage={storage}
            target={target}
            rootClass={rootClass}
            storageTypes={storageTypes}
            onEditStorage={onEditStorage}
            onDeleteStorage={onDeleteStorage}
          />
        ))
      )}
    </Columns.Column>
  );
};
