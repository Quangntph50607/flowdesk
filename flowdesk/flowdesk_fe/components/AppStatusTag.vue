<template>
  <Tag :value="label" :severity="severity" />
</template>

<script setup lang="ts">
const props = defineProps<{ active: boolean }>();

const label = computed(() => (props.active ? "Hoạt động" : "Vô hiệu"));
const severity = computed(() => (props.active ? "success" : "secondary"));
</script>
