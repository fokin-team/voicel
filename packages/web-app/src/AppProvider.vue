<script lang="ts" setup>
import {
  NConfigProvider,
  NLoadingBarProvider,
  NNotificationProvider,
  NMessageProvider,
  NDialogProvider,
  GlobalThemeOverrides,
} from 'naive-ui';

import { useGetCSSVariable } from '@/hooks/useCssVariables';

// Color
const colorText = useGetCSSVariable('--color-text');
const colorPrimary = useGetCSSVariable('--color-primary');

const borderRadiusDefault = useGetCSSVariable('--border-radius-default');
const colorShadowDefault = useGetCSSVariable('--color-default-shadow');

const themeOverrides: GlobalThemeOverrides = {
  common: {
    fontFamily: 'Roboto, -apple-system, "Apple Color Emoji", "Helvetica Neue", sans-serif',
    fontSize: '16px',
    fontSizeMedium: '16px',
    fontSizeLarge: '18px',
    fontSizeHuge: '18px',
    lineHeight: '1.5rem',
    textColorBase: colorText,
    primaryColor: colorPrimary,
  },
  Select: {
    peers: {
      InternalSelection: {
        // textColor: '#FF0000',
      },
    },
  },
  Popover: {
    borderRadius: borderRadiusDefault,
    padding: '0px',
    boxShadow: `0 0.25rem 0.5rem 0.125rem ${colorShadowDefault}`,
  },
  Scrollbar: {
    color: 'rgba(0, 0, 0, 0.2)',
    colorHover: 'rgba(0, 0, 0, 0.2)',
  },
};
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-notification-provider>
        <n-message-provider>
          <n-dialog-provider>
            <slot />
          </n-dialog-provider>
        </n-message-provider>
      </n-notification-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
