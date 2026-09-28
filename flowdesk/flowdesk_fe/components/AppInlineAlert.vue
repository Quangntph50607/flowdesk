<template>
  <div :class="['fd-inline-alert', `fd-inline-alert--${severity}`]">
    <span class="fd-inline-alert__icon">
      <i :class="icon" />
    </span>
    <p class="fd-inline-alert__text">
      <slot />
    </p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    severity?: "success" | "info" | "warn" | "error";
  }>(),
  {
    severity: "info",
  },
);

const icon = computed(() => {
  if (props.severity === "success") return "pi pi-check";
  if (props.severity === "error") return "pi pi-times";
  if (props.severity === "warn") return "pi pi-exclamation-triangle";
  return "pi pi-info";
});
</script>
