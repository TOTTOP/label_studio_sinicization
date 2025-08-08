import React, { useEffect, useMemo, useState } from "react";
import CM from "codemirror";

import { Button, ToggleItems } from "../../../components";
import { Form, Input } from "../../../components/Form";
import { useAPI } from "../../../providers/ApiProvider";
import { Block, cn, Elem } from "../../../utils/bem";
import { Palette } from "../../../utils/colors";
import { FF_UNSAVED_CHANGES, isFF } from "../../../utils/feature-flags";
import { colorNames } from "./colors";
import "./Config.scss";
import { Preview } from "./Preview";
import { DEFAULT_COLUMN, EMPTY_CONFIG, isEmptyConfig, Template } from "./Template";
import { TemplatesList } from "./TemplatesList";

import tags from "./schema.json";
import { UnsavedChanges } from "./UnsavedChanges";
import { Checkbox, CodeEditor, Select } from "@humansignal/ui";
import { toSnakeCase } from "strman";

const wizardClass = cn("wizard");
const configClass = cn("configure");

const EmptyConfigPlaceholder = () => (
  <div className={configClass.elem("empty-config")}>
    <p>您的标注配置为空。标注数据需要配置标注界面。</p>
    <p>
      您可以从我们预定义的模板中选择一个开始，或者在代码面板中创建自己的配置。标注配置基于 XML，您可以{" "}
      <a href="https://labelstud.io/tags/" target="_blank" rel="noreferrer">
        在我们的文档中查看所有可用的标签
      </a>
      。
    </p>
  </div>
);

const Label = ({ label, template, color }) => {
  const value = label.getAttribute("value");

  return (
    <li className={configClass.elem("label").mod({ choice: label.tagName === "Choice" })}>
      <label style={{ background: color }}>
        <Input
          type="color"
          className={configClass.elem("label-color")}
          value={colorNames[color] || color}
          onChange={(e) => template.changeLabel(label, { background: e.target.value })}
        />
      </label>
      <span>{value}</span>
      <button
        type="button"
        className={configClass.elem("delete-label")}
        onClick={() => template.removeLabel(label)}
        aria-label="delete label"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="red"
          strokeWidth="2"
          strokeLinecap="square"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Delete label</title>
          <path d="M2 12L12 2" />
          <path d="M12 12L2 2" />
        </svg>
      </button>
    </li>
  );
};

const ConfigureControl = ({ control, template }) => {
  const refLabels = React.useRef();
  const tagname = control.tagName;

  if (tagname !== "Choices" && !tagname.endsWith("Labels")) return null;
  const palette = Palette();

  const onAddLabels = () => {
    if (!refLabels.current) return;
    template.addLabels(control, refLabels.current.value);
    refLabels.current.value = "";
  };
  const onKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      onAddLabels();
    }
  };

  return (
    <div className={configClass.elem("labels")}>
      <form className={configClass.elem("add-labels")} action="">
        <h4>{tagname === "Choices" ? "添加选项" : "添加标签名称"}</h4>
        <span>使用换行符作为分隔符来添加多个标签</span>
        <textarea
          name="labels"
          id=""
          cols="50"
          rows="5"
          ref={refLabels}
          onKeyPress={onKeyPress}
          className="lsf-textarea-ls p-2 px-3"
        />
        <Button type="button" size="compact" onClick={onAddLabels}>
          添加
        </Button>
      </form>
      <div className={configClass.elem("current-labels")}>
        <h3>
          {tagname === "Choices" ? "Choices" : "Labels"} ({control.children.length})
        </h3>
        <ul>
          {Array.from(control.children).map((label) => (
            <Label
              label={label}
              template={template}
              key={label.getAttribute("value")}
              color={label.getAttribute("background") || palette.next().value}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

const ConfigureSettings = ({ template }) => {
  const { settings } = template;

  if (!settings) return null;
  const keys = Object.keys(settings);

  const items = keys.map((key) => {
    const options = settings[key];
    const type = Array.isArray(options.type) ? Array : options.type;
    const $object = options.object;
    const $tag = options.control ? options.control : $object;

    if (!$tag) return null;
    if (options.when && !options.when($tag)) return;
    let value = false;

    if (options.value) value = options.value($tag);
    else if (typeof options.param === "string") value = $tag.getAttribute(options.param);
    if (value === "true") value = true;
    if (value === "false") value = false;
    let onChange;
    let size;

    switch (type) {
      case Array:
        onChange = (val) => {
          if (typeof options.param === "function") {
            options.param($tag, val);
          } else {
            $object.setAttribute(options.param, val);
          }
          template.render();
        };
        return (
          <li key={key}>
            <Select
              className="border"
              value={value}
              onChange={onChange}
              options={options.type}
              label={options.title}
              isInline={true}
              dataTestid={`select-trigger-${options.title.replace(/\s+/g, "-").replace(":", "").toLowerCase()}-${value}`}
            />
          </li>
        );
      case Boolean:
        onChange = (e) => {
          if (typeof options.param === "function") {
            options.param($tag, e.target.checked);
          } else {
            $object.setAttribute(options.param, e.target.checked ? "true" : "false");
          }
          template.render();
        };
        return (
          <li key={key}>
            <Checkbox checked={value} onChange={onChange}>
              {options.title}
            </Checkbox>
          </li>
        );
      case String:
      case Number:
        size = options.type === Number ? 5 : undefined;
        onChange = (e) => {
          if (typeof options.param === "function") {
            options.param($tag, e.target.value);
          } else {
            $object.setAttribute(options.param, e.target.value);
          }
          template.render();
        };
        return (
          <li key={key}>
            <label>
              {options.title} <Input type="text" onInput={onChange} value={value} size={size} />
            </label>
          </li>
        );
    }
  });

  // check for active settings
  if (!items.filter(Boolean).length) return null;

  return (
    <ul className={configClass.elem("settings")}>
      <li>
        <h4>配置设置</h4>
        <ul className={configClass.elem("object-settings")}>{items}</ul>
      </li>
    </ul>
  );
};

// configure value source for `obj` object tag
const ConfigureColumn = ({ template, obj, columns }) => {
  const valueAttr = obj.hasAttribute("valueList") ? "valueList" : "value";
  const value = obj.getAttribute(valueAttr)?.replace(/^\$/, "");
  // if there is a value set already and it's not in the columns
  // or data was not uploaded yet
  const [isManual, setIsManual] = useState(!!value && !columns?.includes(value));
  // value is stored in state to make input conrollable
  // changes will be sent by Enter and blur
  const [newValue, setNewValue] = useState(`$${value}`);

  // update local state when external value changes
  useEffect(() => setNewValue(`$${value}`), [value]);

  const updateValue = (value) => {
    const newValue = value.replace(/^\$/, "");

    obj.setAttribute(valueAttr, `$${newValue}`);
    template.render();
  };

  const selectValue = (value) => {
    if (value === "-") {
      setIsManual(true);
      return;
    }
    if (isManual) {
      setIsManual(false);
    }

    updateValue(value);
  };

  const handleChange = (e) => {
    const newValue = e.target.value.replace(/^\$/, "");

    setNewValue(`$${newValue}`);
  };

  const handleBlur = () => {
    updateValue(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateValue(e.target.value);
    }
  };

  const columnsList = useMemo(() => {
    const cols = (columns ?? []).map((col) => {
      return {
        value: col,
        label: col === DEFAULT_COLUMN ? "<imported file>" : `$${col}`,
      };
    });
    if (!columns?.length) {
      cols.push({ value, label: "<imported file>" });
    }
    cols.push({ value: "-", label: "<set manually>" });
    return cols;
  }, [columns, DEFAULT_COLUMN, value]);

  return (
    <>
      <Select
        onChange={selectValue}
        value={isManual ? "-" : value}
        options={columnsList}
        isInline={true}
        label={
          <>
            Use {obj.tagName.toLowerCase()}
            {template.objects > 1 && ` for ${obj.getAttribute("name")}`}
            {" from "}
            {columns?.length > 0 && columns[0] !== DEFAULT_COLUMN && "field "}
          </>
        }
        labelProps={{ className: "inline-flex" }}
        dataTestid={`select-trigger-use-image-from-field-${isManual ? "-" : value}`}
      />
      {isManual && <Input value={newValue} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} />}
    </>
  );
};

const ConfigureColumns = ({ columns, template }) => {
  if (!template.objects.length) return null;

  return (
    <div className={configClass.elem("object")}>
      <h4>配置数据</h4>
      {template.objects.length > 1 && columns?.length > 0 && columns.length < template.objects.length && (
        <p className={configClass.elem("object-error")}>当前模板所需的数据量超过您现有的数据量</p>
      )}
      {columns?.length === 0 && (
        <p className={configClass.elem("object-error")}>
          若要选择要标注的字段，您需要上传数据。或者，您也可以使用代码模式来提供这些数据。
        </p>
      )}
      {template.objects.map((obj) => (
        <ConfigureColumn key={obj.getAttribute("name")} {...{ obj, template, columns }} />
      ))}
    </div>
  );
};

const Configurator = ({
  columns,
  config,
  project,
  template,
  setTemplate,
  onBrowse,
  onSaveClick,
  onValidate,
  disableSaveButton,
  warning,
  hasChanges,
}) => {
  const [configure, setConfigure] = React.useState(isEmptyConfig(config) ? "code" : "visual");
  const [visualLoaded, loadVisual] = React.useState(configure === "visual");
  const [waiting, setWaiting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // config update is debounced because of user input
  const [configToCheck, setConfigToCheck] = React.useState();
  // then we wait for validation and sample data for this config
  const [error, setError] = React.useState();
  const [parserError, setParserError] = React.useState();
  const [data, setData] = React.useState();
  const [loading, setLoading] = useState(false);
  // and only with them we'll update config in preview
  const [configToDisplay, setConfigToDisplay] = React.useState(config);

  const debounceTimer = React.useRef();
  const api = useAPI();

  React.useEffect(() => {
    // config may change during init, so wait for that, but for a very short time only
    debounceTimer.current = window.setTimeout(() => setConfigToCheck(config), configToCheck ? 500 : 30);
    return () => window.clearTimeout(debounceTimer.current);
  }, [config]);

  React.useEffect(() => {
    const validate = async () => {
      if (!configToCheck) return;

      setLoading(true);

      const validation = await api.callApi("validateConfig", {
        params: { pk: project.id },
        body: { label_config: configToCheck },
        errorFilter: () => true,
      });

      if (validation?.error) {
        setError(validation.response);
        setLoading(false);
        return;
      }

      setError(null);
      onValidate?.(validation);

      const sample = await api.callApi("createSampleTask", {
        params: { pk: project.id },
        body: { label_config: configToCheck },
        errorFilter: () => true,
      });

      setLoading(false);
      if (sample && !sample.error) {
        setData(sample.sample_task);
        setConfigToDisplay(configToCheck);
      } else {
        // @todo validation can be done in this place,
        // @todo but for now it's extremely slow in /sample-task endpoint
        setError(sample?.response);
      }
    };
    validate();
  }, [configToCheck]);

  // code should be reloaded on every render because of uncontrolled codemirror
  // visuals should be always rendered after first render
  // so load it on the first access, then just show/hide
  const onSelect = (value) => {
    setConfigure(value);
    if (value === "visual") loadVisual(true);
  };

  const onChange = React.useCallback(
    (config) => {
      try {
        setParserError(null);
        setTemplate(config);
      } catch (e) {
        setParserError({
          detail: "Parser error",
          validation_errors: [e.message],
        });
      }
    },
    [setTemplate],
  );

  const onSave = async () => {
    setError(null);
    setWaiting(true);
    const res = await onSaveClick();

    setWaiting(false);

    if (res === true) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } else {
      setError(res);
    }
    return res;
  };

  function completeAfter(cm, pred) {
    if (!pred || pred()) {
      setTimeout(() => {
        if (!cm.state.completionActive) cm.showHint({ completeSingle: false });
      }, 100);
    }
    return CM.Pass;
  }

  function completeIfInTag(cm) {
    return completeAfter(cm, () => {
      const token = cm.getTokenAt(cm.getCursor());

      if (token.type === "string" && (!/['"]$/.test(token.string) || token.string.length === 1)) return false;

      const inner = CM.innerMode(cm.getMode(), token.state).state;

      return inner.tagName;
    });
  }

  const extra = (
    <p className={configClass.elem("tags-link")}>
      Configure the labeling interface with tags.
      <br />
      <a href="https://labelstud.io/tags/" target="_blank" rel="noreferrer">
        See all available tags
      </a>
      .
    </p>
  );

  return (
    <div className={configClass}>
      <div className={configClass.elem("container")}>
        <h1>标注界面{hasChanges ? " *" : ""}</h1>
        <header>
          <Button
            look="secondary"
            type="button"
            data-leave={true}
            onClick={onBrowse}
            size="compact"
            style={{ width: 160 }}
          >
            浏览模板
          </Button>
          <ToggleItems items={{ code: "代码", visual: "可视化" }} active={configure} onSelect={onSelect} />
        </header>
        <div className={configClass.elem("editor")}>
          {configure === "code" && (
            <div className={configClass.elem("code")} style={{ display: configure === "code" ? undefined : "none" }}>
              <CodeEditor
                name="code"
                id="edit_code"
                value={config}
                autoCloseTags={true}
                smartIndent={true}
                detach
                border
                extensions={["hint", "xml-hint"]}
                options={{
                  mode: "xml",
                  theme: "default",
                  lineNumbers: true,
                  extraKeys: {
                    "'<'": completeAfter,
                    // "'/'": completeIfAfterLt,
                    "' '": completeIfInTag,
                    "'='": completeIfInTag,
                    "Ctrl-Space": "autocomplete",
                  },
                  hintOptions: { schemaInfo: tags },
                }}
                // 编辑配置时不要用 Escape 关闭模态框
                onKeyDown={(editor, e) => {
                  if (e.code === "Escape") e.stopPropagation();
                }}
                onChange={(editor, data, value) => onChange(value)}
              />
            </div>
          )}
          {visualLoaded && (
            <div
              className={configClass.elem("visual")}
              style={{ display: configure === "visual" ? undefined : "none" }}
            >
              {isEmptyConfig(config) && <EmptyConfigPlaceholder />}
              <ConfigureColumns columns={columns} project={project} template={template} />
              {template.controls.map((control) => (
                <ConfigureControl control={control} template={template} key={control.getAttribute("name")} />
              ))}
              <ConfigureSettings template={template} />
            </div>
          )}
        </div>
        {disableSaveButton !== true && onSaveClick && (
          <Form.Actions size="small" extra={configure === "code" && extra} valid>
            {saved && (
              <Block name="form-indicator">
                <Elem tag="span" mod={{ type: "success" }} name="item">
                  已保存！
                </Elem>
              </Block>
            )}
            <Button look="primary" size="compact" style={{ width: 120 }} onClick={onSave} waiting={waiting}>
              {waiting ? "保存中..." : "保存"}
            </Button>
            {isFF(FF_UNSAVED_CHANGES) && <UnsavedChanges hasChanges={hasChanges} onSave={onSave} />}
          </Form.Actions>
        )}
      </div>
      <Preview
        config={configToDisplay}
        data={data}
        project={project}
        loading={loading}
        error={parserError || error || (configure === "code" && warning)}
      />
    </div>
  );
};

export const ConfigPage = ({
  config: initialConfig = "",
  columns: externalColumns,
  project,
  onUpdate,
  onSaveClick,
  onValidate,
  disableSaveButton,
  show = true,
  hasChanges,
}) => {
  const [config, _setConfig] = React.useState("");
  const [mode, setMode] = React.useState("list"); // view | list
  const [selectedGroup, _setSelectedGroup] = React.useState(null);
  const [selectedRecipe, setSelectedRecipe] = React.useState(null);
  const [template, setCurrentTemplate] = React.useState(null);
  const api = useAPI();

  const setSelectedGroup = React.useCallback(
    (group) => {
      _setSelectedGroup(group);
      __lsa(`labeling_setup.list.${toSnakeCase(group)}`);
    },
    [_setSelectedGroup],
  );

  const setConfig = React.useCallback(
    (config) => {
      _setConfig(config);
      onUpdate(config);
    },
    [_setConfig, onUpdate],
  );

  const setTemplate = React.useCallback(
    (config) => {
      const tpl = new Template({ config });

      tpl.onConfigUpdate = setConfig;
      setConfig(config);
      setCurrentTemplate(tpl);
    },
    [setConfig, setCurrentTemplate],
  );

  const [columns, setColumns] = React.useState();

  React.useEffect(() => {
    if (externalColumns?.length) setColumns(externalColumns);
  }, [externalColumns]);

  const [warning, setWarning] = React.useState();

  React.useEffect(() => {
    const fetchData = async () => {
      if (!externalColumns || (project && !columns)) {
        const res = await api.callApi("dataSummary", {
          params: { pk: project.id },
          // 404 is ok, and errors here don't matter
          errorFilter: () => true,
        });

        if (res?.common_data_columns) {
          setColumns(res.common_data_columns);
        }
      }
      fetchData();
    };
  }, [columns, project]);

  const onSelectRecipe = React.useCallback((recipe) => {
    if (!recipe) {
      setSelectedRecipe(null);
      setMode("list");
      __lsa("labeling_setup.view.empty");
    } else {
      setTemplate(recipe.config);
      setSelectedRecipe(recipe);
      setMode("view");
      __lsa(`labeling_setup.view.${toSnakeCase(recipe.group)}.${toSnakeCase(recipe.title)}`);
    }
  });

  const onCustomTemplate = React.useCallback(() => {
    setTemplate(EMPTY_CONFIG);
    setMode("view");
    __lsa("labeling_setup.view.custom");
  });

  const onBrowse = React.useCallback(() => {
    setMode("list");
    __lsa("labeling_setup.list.browse");
  }, []);

  React.useEffect(() => {
    if (initialConfig) {
      setTemplate(initialConfig);
      setMode("view");
    }
  }, []);

  if (!show) return null;

  return (
    <div className={wizardClass} data-mode="list" id="config-wizard">
      {mode === "list" && (
        <TemplatesList
          case="list"
          selectedGroup={selectedGroup}
          selectedRecipe={selectedRecipe}
          onSelectGroup={setSelectedGroup}
          onSelectRecipe={onSelectRecipe}
          onCustomTemplate={onCustomTemplate}
        />
      )}
      {mode === "view" && (
        <Configurator
          case="view"
          columns={columns}
          config={config}
          project={project}
          selectedRecipe={selectedRecipe}
          template={template}
          setTemplate={setTemplate}
          onBrowse={onBrowse}
          onValidate={onValidate}
          disableSaveButton={disableSaveButton}
          onSaveClick={onSaveClick}
          warning={warning}
          hasChanges={hasChanges}
        />
      )}
    </div>
  );
};
