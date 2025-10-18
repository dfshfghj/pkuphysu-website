import { createApp } from 'vue'
import './style.css'
import './styles/arco-palette.css'
import './styles/main.css'
import App from './App.vue'

import { createPinia } from 'pinia'
// import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import router from './router'

const pinia = createPinia()
const app = createApp(App).use(pinia).use(router).mount('#app')
