import { ff } from "@humansignal/core";
import { SampleDatasetSelect } from "@humansignal/app-common/blocks/SampleDatasetSelect/SampleDatasetSelect";
import { IconError, IconFileUpload, IconInfo, IconTrash, IconUpload } from "@humansignal/icons";
import { Badge } from "@humansignal/shad/components/ui/badge";
import { cn as scn } from "@humansignal/shad/utils";
import { Button } from "apps/labelstudio/src/components";
import { useAtomValue } from "jotai";
import Input from "libs/datamanager/src/components/Common/Input/Input";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Modal } from "../../../components/Modal/Modal";
import { useAPI } from "../../../providers/ApiProvider";
import { cn } from "../../../utils/bem";
import { unique } from "../../../utils/helpers";
import { sampleDatasetAtom } from "../utils/atoms";
import "./Import.scss";
import samples from "./samples.json";
import { importFiles } from "./utils";
import { CodeBlock, SimpleCard, Spinner } from "@humansignal/ui";

const importClass = cn("upload_page");
const dropzoneClass = cn("dropzone");

function flatten(nested) {
  return [].concat(...nested);
}

// Keep in sync with core.settings.SUPPORTED_EXTENSIONS on the BE.
const supportedExtensions = {
  text: ["txt"],
  audio: ["wav", "mp3", "flac", "m4a", "ogg"],
  video: ["mp4", "webp", "webm"],
  image: ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"],
  html: ["html", "htm", "xml"],
  timeSeries: ["csv", "tsv"],
  common: ["csv", "tsv", "txt", "json"],
};
const allSupportedExtensions = flatten(Object.values(supportedExtensions));

function getFileExtension(fileName) {
  if (!fileName) {
    return fileName;
  }
  return fileName.split(".").pop().toLowerCase();
}

function traverseFileTree(item, path) {
  return new Promise((resolve) => {
    path = path || "";
    if (item.isFile) {
      // Avoid hidden files
      if (item.name[0] === ".") return resolve([]);

      resolve([item]);
    } else if (item.isDirectory) {
      // Get folder contents
      const dirReader = item.createReader();
      const dirPath = `${path + item.name}/`;

      dirReader.readEntries((entries) => {
        Promise.all(entries.map((entry) => traverseFileTree(entry, dirPath)))
          .then(flatten)
          .then(resolve);
      });
    }
  });
}

function getFiles(files) {
  // @todo this can be not a files, but text or any other draggable stuff
  return new Promise((resolve) => {
    if (!files.length) return resolve([]);
    if (!files[0].webkitGetAsEntry) return resolve(files);

    // Use DataTransferItemList interface to access the file(s)
    const entries = Array.from(files).map((file) => file.webkitGetAsEntry());

    Promise.all(entries.map(traverseFileTree))
      .then(flatten)
      .then((fileEntries) => fileEntries.map((fileEntry) => new Promise((res) => fileEntry.file(res))))
      .then((filePromises) => Promise.all(filePromises))
      .then(resolve);
  });
}

const Footer = () => {
  return (
    <Modal.Footer className="import-footer">
      <IconInfo className={scn(importClass.elem("info-icon"), "mr-1")} width="20" height="20" />
      <span>
        See the&nbsp;documentation to{" "}
        <a target="_blank" href="https://labelstud.io/guide/predictions.html" rel="noreferrer">
          import preannotated data
        </a>{" "}
        or&nbsp;to{" "}
        <a target="_blank" href="https://labelstud.io/guide/storage.html" rel="noreferrer">
          sync data from a&nbsp;database or&nbsp;cloud storage
        </a>
        .
      </span>
    </Modal.Footer>
  );
};

const Upload = ({ children, sendFiles }) => {
  const [hovered, setHovered] = useState(false);
  const onHover = (e) => {
    e.preventDefault();
    setHovered(true);
  };
  const onLeave = setHovered.bind(null, false);
  const dropzoneRef = useRef();

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      onLeave();
      getFiles(e.dataTransfer.items).then((files) => sendFiles(files));
    },
    [onLeave, sendFiles],
  );

  return (
    <div
      id="holder"
      className={dropzoneClass.mod({ hovered })}
      ref={dropzoneRef}
      onDragStart={onHover}
      onDragOver={onHover}
      onDragLeave={onLeave}
      onDrop={onDrop}
      // {...getRootProps}
    >
      {children}
    </div>
  );
};

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  let extra = error.validation_errors ?? error.extra;
  // support all possible responses

  if (extra && typeof extra === "object" && !Array.isArray(extra)) {
    extra = extra.non_field_errors ?? Object.values(extra);
  }
  if (Array.isArray(extra)) extra = extra.join("; ");

  return (
    <div className={importClass.elem("error")}>
      <IconError style={{ marginRight: 8 }} />
      {error.id && `[${error.id}] `}
      {error.detail || error.message}
      {extra && ` (${extra})`}
    </div>
  );
};

export const ImportPage = ({
  project,
  sample,
  show = true,
  onWaiting,
  onFileListUpdate,
  onSampleDatasetSelect,
  highlightCsvHandling,
  dontCommitToProject = false,
  csvHandling,
  setCsvHandling,
  addColumns,
  openLabelingConfig,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const api = useAPI();
  const projectConfigured = project?.label_config !== "<View></View>";
  const sampleConfig = useAtomValue(sampleDatasetAtom);

  const processFiles = (state, action) => {
    if (action.sending) {
      return { ...state, uploading: [...action.sending, ...state.uploading] };
    }
    if (action.sent) {
      return { ...state, uploading: state.uploading.filter((f) => !action.sent.includes(f)) };
    }
    if (action.uploaded) {
      return { ...state, uploaded: unique([...state.uploaded, ...action.uploaded], (a, b) => a.id === b.id) };
    }
    if (action.ids) {
      const ids = unique([...state.ids, ...action.ids]);

      onFileListUpdate?.(ids);
      return { ...state, ids };
    }
    return state;
  };

  const [files, dispatch] = useReducer(processFiles, { uploaded: [], uploading: [], ids: [] });
  const showList = Boolean(files.uploaded?.length || files.uploading?.length || sample);

  const loadFilesList = useCallback(
    async (file_upload_ids) => {
      const query = {};

      if (file_upload_ids) {
        // should be stringified array "[1,2]"
        query.ids = JSON.stringify(file_upload_ids);
      }
      const files = await api.callApi("fileUploads", {
        params: { pk: project.id, ...query },
      });

      dispatch({ uploaded: files ?? [] });

      if (files?.length) {
        dispatch({ ids: files.map((f) => f.id) });
      }
      return files;
    },
    [project?.id],
  );

  const onStart = () => {
    setLoading(true);
    setError(null);
  };
  const onError = (err) => {
    console.error(err);
    // @todo workaround for error about input size in a wrong html format
    if (typeof err === "string" && err.includes("RequestDataTooBig")) {
      const message = "导入的文件太大";
      const extra = err.match(/"exception_value">(.*)<\/pre>/)?.[1];

      err = { message, extra };
    }
    setError(err);
    setLoading(false);
    onWaiting?.(false);
  };
  const onFinish = useCallback(
    async (res) => {
      const { could_be_tasks_list, data_columns, file_upload_ids } = res;

      dispatch({ ids: file_upload_ids });
      if (could_be_tasks_list && !csvHandling) setCsvHandling("choose");
      setLoading(true);
      onWaiting?.(false);
      addColumns(data_columns);

      return loadFilesList(file_upload_ids).then(() => setLoading(false));
    },
    [addColumns, loadFilesList, setLoading],
  );

  const importFilesImmediately = useCallback(
    async (files, body) => {
      importFiles({
        files,
        body,
        project,
        onError,
        onFinish,
        onUploadStart: (files) => dispatch({ sending: files }),
        onUploadFinish: (files) => dispatch({ sent: files }),
        dontCommitToProject,
      });
    },
    [project, onFinish],
  );

  const sendFiles = useCallback(
    (files) => {
      onStart();
      onWaiting?.(true);
      files = [...files]; // they can be array-like object
      const fd = new FormData();

      for (const f of files) {
        if (!allSupportedExtensions.includes(getFileExtension(f.name))) {
          onError(new Error(`The filetype of file "${f.name}" is not supported.`));
          return;
        }
        fd.append(f.name, f);
      }
      return importFilesImmediately(files, fd);
    },
    [importFilesImmediately, onStart],
  );

  const onUpload = useCallback(
    (e) => {
      sendFiles(e.target.files);
      e.target.value = "";
    },
    [sendFiles],
  );

  const onLoadURL = useCallback(
    (e) => {
      e.preventDefault();
      onStart();
      const url = urlRef.current?.value;

      if (!url) {
        setLoading(false);
        return;
      }
      urlRef.current.value = "";
      onWaiting?.(true);
      const body = new URLSearchParams({ url });

      importFilesImmediately([{ name: url }], body);
    },
    [importFilesImmediately],
  );

  const openConfig = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLabelingConfig?.();
    },
    [openLabelingConfig],
  );

  useEffect(() => {
    if (project?.id !== undefined) {
      loadFilesList().then((files) => {
        if (csvHandling) return;
        // empirical guess on start if we have some possible tasks list/time series problem
        if (Array.isArray(files) && files.some(({ file }) => /\.[ct]sv$/.test(file))) {
          setCsvHandling("choose");
        }
      });
    }
  }, [project?.id, loadFilesList]);

  const urlRef = useRef();

  if (!project) return null;
  if (!show) return null;

  const csvProps = {
    name: "csv",
    type: "radio",
    onChange: (e) => setCsvHandling(e.target.value),
  };

  return (
    <div className={importClass}>
      {highlightCsvHandling && <div className={importClass.elem("csv-splash")} />}
      <input id="file-input" type="file" name="file" multiple onChange={onUpload} style={{ display: "none" }} />

      <header className="flex gap-4">
        <form className={`${importClass.elem("url-form")} inline-flex`} method="POST" onSubmit={onLoadURL}>
          <Input placeholder="数据集URL" name="url" ref={urlRef} style={{ height: 40 }} />
          <Button type="submit" look="primary">
            添加URL
          </Button>
        </form>
        <span>或者</span>
        <Button
          type="button"
          onClick={() => document.getElementById("file-input").click()}
          className={importClass.elem("upload-button")}
        >
          <IconUpload width="16" height="16" className={importClass.elem("upload-icon")} />
          上传 {files.uploaded.length ? "更多 " : ""}文件
        </Button>
        {ff.isActive(ff.FF_SAMPLE_DATASETS) && (
          <SampleDatasetSelect samples={samples} sample={sample} onSampleApplied={onSampleDatasetSelect} />
        )}
        <div
          className={importClass.elem("csv-handling").mod({ highlighted: highlightCsvHandling, hidden: !csvHandling })}
        >
          <span>Treat CSV/TSV as</span>
          <label>
            <input {...csvProps} value="tasks" checked={csvHandling === "tasks"} /> 任务列表
          </label>
          <label>
            <input {...csvProps} value="ts" checked={csvHandling === "ts"} /> 时间序列或完整文本文件
          </label>
        </div>
        <div className={importClass.elem("status")}>
          {files.uploaded.length ? `${files.uploaded.length} files uploaded` : ""}
        </div>
      </header>

      <ErrorMessage error={error} />

      <main>
        <Upload sendFiles={sendFiles} project={project}>
          <div className={scn("flex gap-4 min-h-full", { "justify-center": !showList })}>
            {!showList && (
              <div className="flex gap-4 justify-center items-start">
                <label htmlFor="file-input">
                  <div className={dropzoneClass.elem("content")}>
                    <header>
                      拖放文件到此处
                      <br />
                      或点击浏览
                    </header>
                    <IconFileUpload height="64" className={dropzoneClass.elem("icon")} />
                    <dl>
                      <dt>文本</dt>
                      <dd>{supportedExtensions.text.join(", ")}</dd>
                      <dt>音频</dt>
                      <dd>{supportedExtensions.audio.join(", ")}</dd>
                      <dt>视频</dt>
                      <dd>mpeg4/H.264 webp, webm* {/* 与 supportedExtensions.video 保持同步 */}</dd>
                      <dt>图像</dt>
                      <dd>{supportedExtensions.image.join(", ")}</dd>
                      <dt>HTML</dt>
                      <dd>{supportedExtensions.html.join(", ")}</dd>
                      <dt>时间序列</dt>
                      <dd>{supportedExtensions.timeSeries.join(", ")}</dd>
                      <dt>常用格式</dt>
                      <dd>{supportedExtensions.common.join(", ")}</dd>
                    </dl>
                    <b>
                      * – 支持情况取决于浏览器
                      <br />* – 直接媒体上传有{" "}
                      <a href="https://labelstud.io/guide/tasks.html#Import-data-from-the-Label-Studio-UI">
                        限制
                      </a>{" "}
                      我们强烈建议使用{" "}
                      <a href="https://labelstud.io/guide/storage.html" target="_blank" rel="noreferrer">
                        云存储
                      </a>{" "}
                      替代
                    </b>
                  </div>
                </label>
              </div>
            )}

            {showList && (
              <div className="w-1/2">
                <table>
                  <tbody>
                    {sample && (
                      <tr key={sample.url}>
                        <td>
                          <div className="flex items-center gap-2">
                            {sample.title}
                            <Badge variant="info" className="h-5 text-xs rounded-sm">
                              示例
                            </Badge>
                          </div>
                        </td>
                        <td>{sample.description}</td>
                        <td>
                          <Button
                            size="icon"
                            look="destructive"
                            rawClassName="h-6 w-6 p-0"
                            onClick={() => onSampleDatasetSelect(undefined)}
                          >
                            <IconTrash className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    )}
                    {files.uploading.map((file, idx) => (
                      <tr key={`${idx}-${file.name}`}>
                        <td>{file.name}</td>
                        <td colSpan={2}>
                          <span className={importClass.elem("file-status").mod({ uploading: true })} />
                        </td>
                      </tr>
                    ))}
                    {files.uploaded.map((file) => (
                      <tr key={file.file}>
                        <td>{file.file}</td>
                        <td>
                          <span className={importClass.elem("file-status")} />
                        </td>
                        <td>{file.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="w-[650px]">
              {projectConfigured && ff.isFF(ff.FF_JSON_PREVIEW) ? (
                <SimpleCard title="预期输入预览" className="w-[650px] h-full">
                  {sampleConfig.data ? (
                    <CodeBlock
                      title="预期输入预览"
                      code={sampleConfig?.data ?? ""}
                      className="w-[650px] h-full"
                    />
                  ) : sampleConfig.isLoading ? (
                    <div className="w-full flex justify-center py-12">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : sampleConfig.isError ? (
                    <div className="w-full pt-4 text-lg text-negative-content">无法加载示例数据</div>
                  ) : null}
                </SimpleCard>
              ) : ff.isFF(ff.FF_JSON_PREVIEW) ? (
                <SimpleCard title="预期输入预览" className="w-[650px] h-full">
                  设置您的{" "}
                  <button
                    type="button"
                    look="link"
                    onClick={openConfig}
                    className="border-none bg-none p-0 m-0 text-primary-content underline"
                  >
                    标注配置
                  </button>{" "}
                  以生成输入预览。
                </SimpleCard>
              ) : null}
            </div>
          </div>
        </Upload>
      </main>

      <Footer />
    </div>
  );
};
