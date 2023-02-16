import { createApp } from 'vue'
import './styles/settings.scss'
import vuetify from './plugins/vuetify';
import App from './App.vue'
import { router } from './router';

const vue_app = createApp(App)
vue_app.use(router)
vue_app.use(vuetify)
vue_app.mount('#app')
