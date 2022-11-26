import './style.scss';
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// eslint-disable-next-line import/no-unresolved
import 'virtual:svg-icons-register';

import App from './App.vue';

const pinia = createPinia();

createApp(App)
  .use(pinia)
  .mount('#app');
