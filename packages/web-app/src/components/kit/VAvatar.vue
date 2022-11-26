<script lang="ts" setup>
import { useFirstLetters } from '@/hooks/useStringFormatter';
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    default: 3.375,
  },
  src: {
    type: String,
    default: undefined,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isMask: {
    type: Boolean,
    default: false,
  },
});

const size = computed(() => `${props.size}rem`);
const fontSize = computed(() => `${(props.size - 3.375) * 0.3 + 1.3}rem`);
const borderRadius = computed(() => (props.isMask ? '0' : '50%'));
const titleFirstLetters = computed(() => useFirstLetters(props.title, props.size < 3));
const srcValue = computed(() => props.src);
</script>

<template>
  <div
    class="v-avatar-container"
    :style="{ width: size, height: size }"
    :class="[{ 'online': false }]"
  >
    <div class="v-avatar" :style="{ width: size, height: size, borderRadius }">
      <img
        v-if="typeof srcValue !== 'undefined' && srcValue !== null"
        :style="{ width: size, height: size, borderRadius, }"
        :src="srcValue"
        alt="avatar"
      >
      <span v-else :style="{ fontSize }">{{ titleFirstLetters }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.v-avatar-container {
  --color-user: var(--color-primary);
  position: relative;

  .v-avatar {
    display: flex;
    font-weight: bold;
    color: var(--color-white);
    background: linear-gradient(var(--color-white) -125%, var(--color-user));
    white-space: nowrap;
    user-select: none;
    align-items: center;
    justify-content: center;
    font-size: 1.3125rem;
  }

  &.online {
    &::after {
      content: "";
      display: block;
      position: absolute;
      bottom: 0.0625rem;
      right: 0.0625rem;
      width: 0.875rem;
      height: 0.875rem;
      border-radius: 50%;
      border: 2px solid var(--color-background);
      background-color: #0ac630;
      flex-shrink: 0;
      z-index: 1;
    }
  }
}
</style>
