import { onMounted, ref } from 'vue';
import { defineStore } from 'pinia';

export const useInitialStore = defineStore('initialStore', () => {
  const isMobile = ref(false);
  const isWideScreen = ref(false);
  const activeColorSchema = ref('shiki-light');

  onMounted(() => {
    const colorSchema = localStorage.getItem('color-schema');
    if (colorSchema) {
      activeColorSchema.value = colorSchema;
    }
  });

  const saveColorSchema = (schemaName: string) => {
    activeColorSchema.value = schemaName;
    localStorage.setItem('color-schema', schemaName);
  };

  return {
    isMobile,
    isWideScreen,
    activeColorSchema,
    saveColorSchema,
  };
});
