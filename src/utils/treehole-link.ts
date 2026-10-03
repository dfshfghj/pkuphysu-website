import { buildTreeholeSiteUrl } from "@/utils/treehole-quote";

const TREEHOLE_HREF = /^\/treehole(\/|$)/;

export const isTreeholeHref = (href: string | null | undefined): boolean => !!href && TREEHOLE_HREF.test(href);

export const openTreeholeSite = (href: string): void => {
  const target = buildTreeholeSiteUrl(href);
  const win = window.open(target, "_blank");
  if (win) {
    win.opener = null;
  } else {
    window.location.href = target;
  }
};

export const installTreeholeLinkHandler = (): (() => void) => {
  const handler = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const href = target.closest("a[href]")?.getAttribute("href");
    if (!href || !isTreeholeHref(href)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    openTreeholeSite(href);
  };

  document.addEventListener("click", handler, true);
  return () => document.removeEventListener("click", handler, true);
};
