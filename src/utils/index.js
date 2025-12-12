export function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const formattedTime = `${month}-${day} ${hours}:${minutes}`;

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  let relativeTime;

  if (diffInSeconds < 60) {
    relativeTime = "刚刚";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    relativeTime = `${minutes}分钟前`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    relativeTime = `${hours}小时前`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    relativeTime = `${days}天前`;
  } else if (diffInSeconds < 604800) {
    const weeks = Math.floor(diffInSeconds / 604800);
    relativeTime = `${weeks}周前`;
  } else {
    const months = Math.floor(diffInSeconds / 2592000);
    relativeTime = `${months}月前`;
  }

  return {
    formattedTime: formattedTime,
    relativeTime: relativeTime,
  };
}
