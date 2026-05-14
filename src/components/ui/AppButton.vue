<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger
  type: { type: String, default: 'button' },
  disabled: Boolean,
  loading: Boolean,
});

const variantClass = (v) => {
  switch (v) {
    case 'secondary':
      return 'btn-secondary';
    case 'ghost':
      return 'btn-ghost';
    case 'danger':
      return 'btn-danger';
    default:
      return 'btn-primary';
  }
};
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="variantClass(variant)">
    <svg v-if="loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>
