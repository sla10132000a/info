<template>
  <div class="flex gap-2">
    <select v-model="category" class="border px-2 py-1">
      <option value="">All</option>
      <option value="it">IT</option>
      <option value="invest">Invest</option>
    </select>
    <input v-model="datePrefix" type="date" class="border px-2 py-1" />
    <input
      v-model="q"
      @input="$emit('update:q', q)"
      placeholder="Search..."
      class="flex-1 border px-2 py-1"
    />
    <button class="border px-3 py-1" @click="$emit('load', { category, datePrefix })">
      Load
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue?: { category: string; datePrefix: string; q: string };
}>();
const emit = defineEmits<{
  (e: 'update:q', v: string): void;
  (e: 'update:filters', v: { category: string; datePrefix: string }): void;
  (e: 'load', v: { category: string; datePrefix: string }): void;
}>();

const category = ref(props.modelValue?.category ?? '');
const datePrefix = ref(props.modelValue?.datePrefix ?? '');
const q = ref(props.modelValue?.q ?? '');

watch([category, datePrefix], () => {
  emit('update:filters', { category: category.value, datePrefix: datePrefix.value });
});
</script>
