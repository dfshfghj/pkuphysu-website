import { createApp } from "vue";
import "./style.css";
import "./styles/main.css";
import App from "./App.vue";

import { createPinia } from "pinia";

import router from "./router";
import { initializeSafeArea } from "./safe-area";
import { installTreeholeLinkHandler } from "./utils/treehole-link";

initializeSafeArea();
installTreeholeLinkHandler();

const pinia = createPinia();
createApp(App).use(pinia).use(router).mount("#app");
