<script setup>
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const url = urlParams.get("redirect");
  console.log(url);

  if (url) {
    try {
      window.location.href = url;
    } catch (err) {
      console.error("无效的跳转链接:", url, err);
      alert("无效的链接地址");
    }
  } else {
    alert("缺少跳转地址");
  }
});
</script>

<template>
  <div style="text-align: center; margin-top: 100px">
    <p>正在跳转到外部页面...</p>
  </div>
</template>
