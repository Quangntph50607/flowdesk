<template>
  <div class="flex flex-col items-center justify-center py-14 text-surface-400">
    <i :class="[icon, 'text-5xl mb-4']" />
    <p class="text-base font-medium">{{ message }}</p>
    <p v-if="description" class="text-sm mt-1">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  message: string;
  description?: string;
}>();

withDefaults(defineProps<{ icon?: string }>(), {
  icon: "pi pi-inbox",
});
</script>
