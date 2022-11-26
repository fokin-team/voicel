<template>
  <div class="v-empty">
    <span class="v-empty-text">
      <slot name="default" />
    </span>
  </div>
</template>

<style lang="scss" scoped>
.v-empty {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
  margin: auto 0;

  .v-empty-text {
    padding: 0.25rem 1rem;
    font-size: 0.875rem;
    font-weight: 400;
    color: #fff;
    background-color: var(--color-primary);
    border-radius: 2rem;
    user-select: none;
  }
}
</style>
