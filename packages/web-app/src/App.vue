<script setup lang="ts">

</script>

<template>
  <div>
    123
  </div>
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
