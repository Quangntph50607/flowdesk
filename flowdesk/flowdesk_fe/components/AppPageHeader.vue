<template>
  <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
    <div class="flex items-start gap-3">
      <Button
        v-if="back"
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        class="mt-1"
        @click="$router.back()"
      />
      <div>
        <span v-if="breadcrumb" class="fd-breadcrumb">{{ breadcrumb }}</span>
        <h1 class="fd-page-title" :class="breadcrumb ? 'mt-1' : ''">{{ title }}</h1>
        <p v-if="subtitle" class="fd-page-subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  back?: boolean;
}>();
</script>
