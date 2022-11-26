<template>
  <div class="v-dot-loading">
    <div class="text">
      <slot name="default" />
    </div>
    <div class="ellipsis" />
  </div>
</template>

<style lang="scss" scoped>
.v-dot-loading {
  display: inline-flex;
  align-items: baseline;

  .text {
    font-size: 0.875rem;
    line-height: 1.125rem;
    margin: 0;
    color: var(--color-text-secondary);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: inline-block;
  }

  @keyframes dot-animation {
    from {
      transform: translateX(-1rem);
    }
  }

  @keyframes dot-animation-rtl {
    from {
      transform: translateX(1rem);
    }
  }

  .ellipsis {
    display: inline-flex;
    width: 1rem;
    overflow: hidden;
    color: var(--color-text-secondary);

    &::after {
      content: '...';
      animation: dot-animation 1s steps(4, start) infinite;

      html[lang="ar"] &,
      html[lang="fa"] & {
        animation-name: dot-animation-rtl;
      }
    }
  }
}
</style>
