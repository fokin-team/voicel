<script lang="ts">
import type { CSSProperties } from 'vue';
import { defineComponent, computed } from 'vue';

export default defineComponent({
  name: 'VIcon',
  props: {
    prefix: {
      type: String,
      default: 'icon',
    },
    name: {
      type: String,
      required: true,
    },
    size: {
      type: [Number, String],
      default: 20,
    },
    height: {
      type: [Number, String],
      default: undefined,
    },
    fill: {
      type: String,
      default: '#000000',
    },
  },
  setup(props) {
    const symbolId = computed(() => `#${props.prefix}-${props.name}`);
    const getStyle = computed((): CSSProperties => {
      const { size } = props;
      const height = props.height?.toString();
      let s = `${size}`;
      s = `${s.replace('px', '')}px`;
      return {
        width: s,
        height: height ? `${height.replace('px', '')}px` : s,
      };
    });
    return { symbolId, getStyle };
  },
});
</script>

<template>
  <svg
    class="v-icon"
    :style="getStyle"
    :aria-label="name"
    aria-hidden="true"
  >
    <use
      class="svg"
      :href="symbolId"
      :fill="fill"
    />
  </svg>
</template>

<style lang="scss" scoped>
.v-icon {
  &:hover {
    .svg {
      transition: fill ease-out .1s;
    }
  }
}
</style>
