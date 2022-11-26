<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useDebounce } from '@/hooks/useDebounce';

interface Ripple {
  x: number;
  y: number;
  size: number;
}

const props = defineProps({
  duration: {
    type: Number,
    required: false,
    default: 700,
  },
});

const ripples = ref<Ripple[]>([]);

const animationDurationStyle = computed(() => `${props.duration}ms`);

const cleanUpDebounced = useDebounce(() => {
  ripples.value = [];
}, props.duration);

const onRippleContainerClickHandler = (e: MouseEvent) => {
  const container = e.currentTarget as HTMLDivElement;
  const position = container.getBoundingClientRect();
  const rippleSize = container.offsetWidth / 2;

  ripples.value.push({
    x: e.clientX - position.x - (rippleSize / 2),
    y: e.clientY - position.y - (rippleSize / 2),
    size: rippleSize,
  });

  cleanUpDebounced();
};
</script>

<template>
  <div class="ripple-container" @click="onRippleContainerClickHandler">
    <span
      v-for="({ x, y, size }, index) in ripples"
      :key="index"
      :style="{ left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` }"
    />
  </div>
</template>

<style lang="scss" scoped>
@-webkit-keyframes ripple-animation {
  from {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: scale(2);
  }
}

@keyframes ripple-animation {
  from {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: scale(2);
  }
}

.ripple-container {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;

  span {
    position: absolute;
    display: block;
    background-color: var(--ripple-color, rgba(0, 0, 0, 0.08));
    border-radius: 50%;
    transform: scale(0);
    animation-name: ripple-animation;
    animation-duration: v-bind(animationDurationStyle);
  }
}
</style>
