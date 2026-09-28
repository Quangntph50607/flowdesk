<template>
  <Teleport to="body">
    <TransitionGroup name="fd-toast" tag="div" class="fd-toast-host">
      <article
        v-for="toast in toasts"
        :key="toast.id"
        :class="['fd-toast-card', `fd-toast-card--${toast.severity}`]"
        role="status"
      >
        <div class="fd-toast-icon">
          <i :class="iconFor(toast.severity)" />
        </div>

        <div class="min-w-0 flex-1">
          <p v-if="toast.summary" class="fd-toast-title">
            {{ toast.summary }}
          </p>
          <p v-if="toast.detail" class="fd-toast-detail">
            {{ toast.detail }}
          </p>
        </div>

        <button
          type="button"
          class="fd-toast-close"
          aria-label="Đóng thông báo"
          @click="remove(toast.id)"
        >
          <i class="pi pi-times" />
        </button>
      </article>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import type { AppToastSeverity } from "~/composables/useAppToast";

const { toasts, remove } = useAppToast();

function iconFor(severity: AppToastSeverity) {
  if (severity === "success") return "pi pi-check";
  if (severity === "error") return "pi pi-times";
  if (severity === "warn") return "pi pi-exclamation-triangle";
  return "pi pi-info";
}
</script>
