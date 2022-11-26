<script lang="ts" setup>
import { ref } from 'vue';

import VIcon from '@/components/kit/VIcon.vue';
import VButton from '@/components/kit/VButton.vue';
import VInput from '@/components/kit/VInput.vue';

import { useGetCSSVariable } from '@/hooks/useCssVariables';

const colorPrimary = useGetCSSVariable('--color-primary');

const roomCode = ref('');
</script>

<template>
  <div class="connect">
    <header>
      <v-icon
        name="logo"
        :size="50"
        :fill="colorPrimary"
      />
      <span class="title">voicel</span>
    </header>
    <div class="connect-body">
      <img
        class="people-illustration"
        src="@/assets/images/people-illustration.svg"
        alt="people-illustration"
        fetchpriority="high"
        rel="preload"
      >
      <div class="connect-content">
        <div class="description">
          <h2>Платформа видеоконференций</h2>
          <div class="subtitle">Потоковая передача видео, аудио, в реальном времени, чат</div>
        </div>
        <div class="actions-container">
          <v-button
            type="primary"
            :fluid="true"
            size="large"
          >
            Создать комнату
          </v-button>
          <div class="room-connection-container">
            <v-input
              v-model:value="roomCode"
              placeholder="Код комнаты"
              size="large"
              species="default"
            />
            <v-button
              type="primary"
              size="large"
            >
              Войти
            </v-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.connect {
  height: 100%;
  width: 100%;
  max-width: 1400px;
  padding: 1.5rem 0.5rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  overflow-y: auto;

  header {
    display: flex;
    align-items: center;
    gap: 1rem;

    .title {
      color: var(--color-primary);
      font-size: 2.5rem;
      font-weight: 500;
    }
  }

  .connect-body {
    height: 100%;
    display: flex;
    flex-direction: column;

    @media (min-width: 927px) {
      flex-direction: row-reverse;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6.5rem;
    }

    .people-illustration {
      height: 15rem;
      margin: 3.75rem auto 0 auto;
      object-fit: contain;

      @media (min-width: 927px) {
        margin: 0;
      }

      @media (min-width: 1100px) {
        width: 600px;
        height: auto;
      }

      @media (min-width: 1400px) {
        width: 700px;
        height: auto;
      }
    }

    .connect-content {
      margin-top: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      @media (min-width: 927px) {
        max-width: 540px;
      }

      .description {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .subtitle {
          font-size: 1.5rem;
          color: var(--color-text-secondary);
        }
      }

      .actions-container {
        margin-top: 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;

        .room-connection-container {
          display: flex;
          gap: 1rem;
        }
      }
    }
  }
}
</style>
