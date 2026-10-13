// Vditor treats the entire code className as the language identifier.
// Server-rendered Chroma spans must become plain source before its highlighter runs.
export const prepareVditorPreview = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("pre > code.highlight-chroma").forEach((code) => {
    code.querySelectorAll(".highlight-ln").forEach((lineNumber) => lineNumber.remove());
    code.textContent = code.textContent;
    code.classList.remove("highlight-chroma");
  });
  return template.innerHTML;
};
