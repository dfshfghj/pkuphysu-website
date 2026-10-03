import { createApp } from "vue";
import "./style.css";
import "./styles/main.css";
import "./styles/arco-palette.css";
import App from "./App.vue";

import { createPinia } from "pinia";

import router from "./router";
import { installTreeholeLinkHandler } from "./utils/treehole-link";

installTreeholeLinkHandler();

const pinia = createPinia();
createApp(App).use(pinia).use(router).mount("#app");
