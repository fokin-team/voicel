<script setup lang="ts">
import { useInitialStore } from '@/stores/initialStore';
import AppProvider from '@/AppProvider.vue';

const initialStore = useInitialStore();

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);

initialStore.$patch({
  isMobile: window.innerWidth < 927,
  isWideScreen: window.innerWidth > 1280,
});

window.addEventListener('resize', () => {
  initialStore.$patch({
    isMobile: window.innerWidth < 927,
    isWideScreen: window.innerWidth > 1280,
  });
  vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

</script>

<template>
  <app-provider>
    <router-view />
  </app-provider>
</template>

<style lang="scss">
@import 'styles/index';

#app {
  height: 100%;

  @media (max-width: 926px) {
    height: calc(var(--vh, 1vh) * 100);
  }

  @media (min-width: 927px) {
    --padding-containter: 1.5rem;
  }
}
</style>
