<script lang="ts" setup>
import {
  computed, onMounted, PropType, watch,
} from 'vue';
import { NPopover } from 'naive-ui';

import { useSetCSSVariable } from '@/hooks/useCssVariables';

const props = defineProps({
  isShow: {
    type: Boolean,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  placement: {
    type: String as PropType<'top-start' | 'top' | 'top-end' | 'right-start'
    | 'right' | 'right-end' | 'bottom-start' | 'bottom' | 'bottom-end' | 'left-start' | 'left' | 'left-end'>,
    required: true,
  },
});

const emit = defineEmits(['clickOutside']);

const isShowValue = computed(() => props.isShow);

const followerContainerPointerEventsVar = `--${props.to.slice(1)}-pointer-events`;

let popoverRenderElement: HTMLElement | null = null;
onMounted(() => {
  popoverRenderElement = document.querySelector(props.to);
  if (popoverRenderElement !== null) {
    popoverRenderElement.style.pointerEvents = `var(${followerContainerPointerEventsVar})`;
  }
});

watch((isShowValue), (showValue) => {
  useSetCSSVariable(followerContainerPointerEventsVar, showValue ? 'all' : 'none');
});

const onOutsideClickHandler = (e: MouseEvent) => {
  console.log(e.type);
  if (e.type === 'mouseup') {
    emit('clickOutside', e);
  }
};

</script>

<template>
  <n-popover
    class="v-popover"
    trigger="click"
    :show="props.isShow"
    :placement="props.placement"
    :show-arrow="false"
    :to="props.to"
    :on-clickoutside="onOutsideClickHandler"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <slot name="default" />
  </n-popover>
</template>

<style lang="scss" scoped>
:global(.v-popover) {
  :deep(.n-popover) {
    background: rgba(255, 255, 255, 0.733333) !important;
    backdrop-filter: blur(10px);
  }
}

:global(.v-binder-follower-container) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: inherit;
}
</style>
