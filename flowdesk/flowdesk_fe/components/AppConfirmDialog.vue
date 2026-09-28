<template>
  <Teleport to="body">
    <Transition name="fd-confirm">
      <div v-if="state.open" class="fd-confirm-backdrop" @click.self="cancel">
        <section class="fd-confirm-panel" role="dialog" aria-modal="true">
          <div :class="['fd-confirm-icon', `fd-confirm-icon--${state.tone}`]">
            <i
              :class="
                state.tone === 'danger'
                  ? 'pi pi-exclamation-triangle'
                  : 'pi pi-question'
              "
            />
          </div>

          <div class="min-w-0">
            <h2 class="fd-confirm-title">{{ state.title }}</h2>
            <p class="fd-confirm-message">{{ state.message }}</p>
          </div>

          <div class="fd-confirm-actions">
            <Button
              type="button"
              :label="state.cancelLabel"
              severity="secondary"
              outlined
              @click="cancel"
            />
            <Button
              type="button"
              :label="state.confirmLabel"
              :severity="state.tone === 'danger' ? 'danger' : undefined"
              @click="confirm"
            />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { state, confirm, cancel } = useAppConfirm();
</script>
