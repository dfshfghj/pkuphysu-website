const IFRAME_ROOT_MARGIN = "200px";

export const applyLazyMedia = (root: HTMLElement): (() => void) => {
  root.querySelectorAll("img").forEach((img) => {
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
  });

  const frames = Array.from(root.querySelectorAll<HTMLIFrameElement>("iframe[src]"));
  if (frames.length === 0) {
    return () => {};
  }

  const activate = (frame: HTMLIFrameElement) => {
    const src = frame.dataset.src;
    if (!src) {
      return;
    }
    frame.setAttribute("src", src);
    frame.removeAttribute("data-src");
  };

  for (const frame of frames) {
    frame.dataset.src = frame.getAttribute("src") ?? "";
    frame.removeAttribute("src");
  }

  if (typeof IntersectionObserver === "undefined") {
    frames.forEach(activate);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }
        activate(entry.target as HTMLIFrameElement);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: IFRAME_ROOT_MARGIN },
  );

  frames.forEach((frame) => observer.observe(frame));

  return () => observer.disconnect();
};
