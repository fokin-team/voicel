<script lang="ts" setup>
import { computed, ref, PropType } from 'vue';
import VRippleEffect from '@/components/kit/shared/VRippleEffect.vue';

const props = defineProps({
  type: {
    type: String as PropType<'default' | 'primary' | 'success' | 'warning' | 'error'>,
    default: 'default',
  },
  nativeType: {
    type: String as PropType<'button' | 'submit' | 'reset'>,
    default: 'button',
  },
  size: {
    type: [String, Number] as PropType<number | 'small' | 'medium' | 'large'>,
    default: 'medium',
  },
  fluid: {
    type: Boolean,
    default: false,
  },
  round: {
    type: Boolean,
    default: false,
  },
  fontSize: {
    type: Number,
    default: 1,
  },
  fontWeight: {
    type: Number,
    default: 400,
  },
  circle: {
    type: Boolean,
    default: false,
  },
  ghost: {
    type: Boolean,
    default: false,
  },
  quaternary: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: Boolean,
    default: false,
  },
  text: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const buttonRef = ref<null | HTMLButtonElement>(null);
const typeValue = computed(() => props.type);
const fluidValue = computed(() => (props.fluid ? 'fluid' : ''));
const circleValue = computed(() => (props.circle ? 'circle' : ''));
const roundValue = computed(() => (props.round ? 'round' : ''));
const ghostValue = computed(() => (props.ghost ? 'ghost' : ''));
const textValue = computed(() => (props.text ? 'text' : ''));
const quaternaryValue = computed(() => (props.quaternary ? 'quaternary' : ''));
const iconValue = computed(() => (props.icon ? 'icon' : ''));
const disabledValue = computed(() => (props.disabled ? 'disabled' : ''));
const fontSize = computed(() => props.fontSize);
const fontWeight = computed(() => props.fontWeight);

const sizeCalculate = (size: string | number) => {
  if (size === 'medium') {
    return 2.75;
  }
  if (size === 'small') {
    return 2;
  }
  return 3.5;
};

const sizeValue = computed(() => {
  if (typeof props.size === 'number') {
    return props.size;
  }
  return sizeCalculate(props.size);
});

const buttonStyle = computed(() => ({
  height: `${sizeValue.value}rem`,
  fontSize: fontSize.value,
  fontWeight: fontWeight.value,
  borderRadiusRound: `${sizeValue.value}rem`,
}));

const vButtonBorderEffect = () => {
  if (buttonRef.value !== null) {
    const boxShadowColor = getComputedStyle(buttonRef.value).borderColor.replace(')', ', 0.2)').replace('rgb', 'rgba');
    buttonRef.value.style.boxShadow = `0 0 0 3px ${boxShadowColor}`;
    setTimeout(() => {
      if (buttonRef.value !== null) {
        buttonRef.value.style.boxShadow = 'unset';
      }
    }, 250);
  }
};

const onButtonClickHandler = () => {
  if (disabledValue.value === '' && textValue.value === '') {
    if (ghostValue.value !== '') {
      vButtonBorderEffect();
    }
  }
};
</script>

<template>
  <button
    ref="buttonRef"
    :type="props.nativeType"
    class="v-button-base"
    :class="[typeValue, fluidValue, roundValue, circleValue,
             ghostValue, quaternaryValue, iconValue, textValue, disabledValue]"
    :style="{ fontSize: `${buttonStyle.fontSize}rem`, fontWeight: buttonStyle.fontWeight }"
    @click="onButtonClickHandler"
  >
    <span class="v-button-text"><slot name="default" /></span>
    <span class="v-button-icon">
      <slot name="icon" />
    </span>
    <v-ripple-effect v-if="ghostValue === ''" :duration="500" />
  </button>
</template>

<style lang="scss" scoped>
@use "sass:color";

.v-button-base {
  height: v-bind('buttonStyle.height');
  position: relative;
  width: initial;
  display: inline-flex;
  flex-wrap: nowrap;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: var(--default-line-height);
  outline: none;
  margin: 0;
  cursor: pointer;
  overflow: hidden;
  text-decoration: none;
  user-select: none;
  border: none;
  padding: 0 1rem;
  border-radius: var(--border-radius-default-small);
  font-weight: 400;
  transition: color .2s ease, background-color .2s ease,
  opacity .2s ease, border-color .2s ease, box-shadow .2s ease;
  background-color: transparent;

  .v-button-text {
    user-select: none;
    pointer-events: none;
    line-height: var(--default-line-height);
  }

  .v-button-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  :global(.v-button-wave-effect) {
    position: absolute;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: scale(0);
    animation: v-button-wave-effect-animation .4s linear;
    pointer-events: none;
  }

  @keyframes v-button-wave-effect-animation {
    100% {
      transform: scale(2.5);
      opacity: 0;
    }
  }

  @keyframes v-button-border-effect-animation {
    100% {
      opacity: 0;
    }
  }

  &.default {
    color: var(--color-text);
    background-color: var(--color-default);
    border: 1px solid var(--color-borders);

    &:hover {
      background-color: var(--color-default-shade);
      border: 1px solid var(--color-borders-input);
    }
  }

  &.primary {
    color: var(--color-primary);
    background-color: var(--color-primary);
    border: 1px solid var(--color-primary);

    &:hover {
      background-color: var(--color-primary-shade);
      border: 1px solid var(--color-primary-shade);
    }
  }

  &.success {
    color: var(--color-green);
    background-color: var(--color-green);
    border: 1px solid var(--color-green);

    &:hover {
      background-color: var(--color-green-shade);
      border: 1px solid var(--color-green-shade);
    }
  }

  &.warning {
    color: var(--color-warning);
    background-color: var(--color-warning);
    border: 1px solid var(--color-warning);

    &:hover {
      background-color: var(--color-warning-shade);
      border: 1px solid var(--color-warning-shade);
    }
  }

  &.fluid {
    width: 100%;
  }

  &.round {
    border-radius: v-bind('buttonStyle.borderRadiusRound');
  }

  &.circle {
    border-radius: 0.5rem;
    background-color: #EDEDED !important;
    min-width: v-bind('buttonStyle.height');
    padding: 0.5rem;
  }

  &.error {
    color: var(--color-error);
    background-color: var(--color-error) !important;
    border: 1px solid var(--color-error);

    &:hover {
      background-color: var(--color-error-shade);
      border: 1px solid var(--color-error-shade);
    }
  }

  &:not(.ghost, .quaternary, .text) {
    color: #ffffff;
    border: none;

    &:hover {
      border: none;
    }
  }

  &.ghost {
    background-color: transparent;

    &:hover {
      background-color: transparent;
    }
  }

  &.quaternary {
    background-color: transparent;
    border: none;

    &:hover {
      background-color: var(--color-interactive-element-hover);
      border: none;
    }
  }

  &.icon {
    background-color: transparent;
    border: none;

    &:hover {
      background-color: transparent;
      border: none;
    }
  }

  &.text {
    height: auto;
    padding: 0;
    background-color: transparent;
    border: none;

    &:hover {
      background-color: transparent;
      border: none;
      text-decoration: underline;
    }
  }

  &.disabled {
    background-color: var(--color-gray);
    border: none;
    cursor: not-allowed;

    &:hover {
      background-color: var(--color-gray);
      border: none;
    }
  }
}
</style>
