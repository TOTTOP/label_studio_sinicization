import { htmlEscape } from "./html";

const URL_CORS_DOCS = "https://labelstud.io/guide/storage.html#Troubleshoot-CORS-and-access-problems";
const URL_TAGS_DOCS = "https://labelstud.io/tags";

export default {
  DONE: "已完成!",
  NO_COMP_LEFT: "没有更多标注了",
  NO_NEXT_TASK: "队列中没有更多任务了",
  NO_ACCESS: "您没有访问此任务的权限",

  CONFIRM_TO_DELETE_ALL_REGIONS: "请确认您要删除所有已标注的区域",

  // 树验证消息
  ERR_REQUIRED: ({ modelName, field }) => {
    return `标签 <b>${modelName}</b> 中，属性 <b>${field}</b> 是必需的`;
  },

  ERR_UNKNOWN_TAG: ({ modelName, field, value }) => {
    return `名称为 <b>${value}</b> 的标签未注册。由 <b>${modelName}#${field}</b> 引用。`;
  },

  ERR_TAG_NOT_FOUND: ({ modelName, field, value }) => {
    return `名称为 <b>${value}</b> 的标签在配置中不存在。由 <b>${modelName}#${field}</b> 引用。`;
  },

  ERR_TAG_UNSUPPORTED: ({ modelName, field, value, validType }) => {
    return `标签 <b>${modelName}</b> 的属性 <b>${field}</b> 无效：引用的标签是 <b>${value}</b>，但 <b>${modelName}</b> 只能控制 <b>${[].concat(validType).join(", ")}</b>`;
  },

  ERR_PARENT_TAG_UNEXPECTED: ({ validType, value }) => {
    return `标签 <b>${value}</b> 必须是以下标签之一的子标签：<b>${[].concat(validType).join(", ")}</b>。`;
  },

  ERR_BAD_TYPE: ({ modelName, field, validType }) => {
    return `标签 <b>${modelName}</b> 的属性 <b>${field}</b> 类型无效。有效类型为：<b>${validType}</b>。`;
  },

  ERR_INTERNAL: ({ value }) => {
    return `内部错误。请查看浏览器控制台以获取更多信息。请重试或联系开发人员。<br/>${value}`;
  },

  ERR_GENERAL: ({ value }) => {
    return value;
  },

  // Object loading errors
  URL_CORS_DOCS,
  URL_TAGS_DOCS,

  ERR_LOADING_AUDIO({ attr, url, error }) {
    return (
      <div data-testid="error:audio">
        <p>
          Error while loading audio. Check <code>{attr}</code> field in task.
        </p>
        <p>Technical description: {error}</p>
        <p>URL: {htmlEscape(url)}</p>
      </div>
    );
  },

  ERR_LOADING_S3({ attr, url }) {
    return `
    <div>
      <p>
        There was an issue loading URL from <code>${attr}</code> value.
        The request parameters are invalid.
        If you are using S3, make sure you’ve specified the right bucket region name.
      </p>
      <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_CORS({ attr, url }) {
    return `
    <div>
      <p>
        There was an issue loading URL from <code>${attr}</code> value.
        Most likely that's because static server has wide-open CORS.
        <a href="${this.URL_CORS_DOCS}" target="_blank">Read more on that here.</a>
      </p>
      <p>
        Also check that:
        <ul>
          <li>URL is valid</li>
          <li>Network is reachable</li>
        </ul>
      </p>
      <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_HTTP({ attr, url, error }) {
    return `
    <div data-testid="error:http">
      <p>
        There was an issue loading URL from <code>${attr}</code> value
      </p>
      <p>
        Things to look out for:
        <ul>
          <li>URL is valid</li>
          <li>URL scheme matches the service scheme, i.e. https and https</li>
          <li>
            The static server has wide-open CORS,
            <a href=${this.URL_CORS_DOCS} target="_blank">more on that here</a>
          </li>
        </ul>
      </p>
      <p>
        Technical description: <code>${error}</code>
        <br />
        URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code>
      </p>
    </div>`;
  },
};
