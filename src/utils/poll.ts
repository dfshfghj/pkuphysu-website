export interface PollConfig {
  multiple: boolean;
  options: string[];
}

export const POLL_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
  <rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <rect x="3.5" y="8" width="2.2" height="3.5" rx="0.5" fill="currentColor"/>
  <rect x="6.9" y="5.5" width="2.2" height="6" rx="0.5" fill="currentColor"/>
  <rect x="10.3" y="7" width="2.2" height="4.5" rx="0.5" fill="currentColor"/>
</svg>`;

export const createPollToolbarItem = (onClick: () => void) => ({
  name: "poll",
  tip: "发起投票",
  icon: POLL_ICON,
  click: onClick,
});
