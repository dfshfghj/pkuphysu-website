const API_PATH_PREFIX = "/api/";

const URL_ATTRIBUTES: [string, string][] = [
  ["a", "href"],
  ["audio", "src"],
  ["iframe", "src"],
  ["img", "src"],
  ["source", "src"],
  ["video", "src"],
];

export const apiBase = () => import.meta.env.VITE_API_BASE_URL || "";

export const apiUrl = (path: string) => (path.startsWith(API_PATH_PREFIX) ? `${apiBase()}${path}` : path);

export const resolveApiUrls = (root: ParentNode) => {
  for (const [tag, attribute] of URL_ATTRIBUTES) {
    root.querySelectorAll(`${tag}[${attribute}]`).forEach((element) => {
      const value = element.getAttribute(attribute);
      if (!value) {
        return;
      }
      const resolved = apiUrl(value);
      if (resolved !== value) {
        element.setAttribute(attribute, resolved);
      }
    });
  }
};

export const resolveApiUrlsInHtml = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  resolveApiUrls(template.content);
  return template.innerHTML;
};
