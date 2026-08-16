<template>
  <div class="photo-viewer">
    <div v-if="loading" class="photo-loading">
      <span class="spinner"></span>
      <span>Загрузка фото...</span>
    </div>
    <img
        v-else-if="photoUrl"
        :src="photoUrl"
        :alt="alt"
        class="photo-image"
        @error="onError"
    />
    <div v-else class="photo-placeholder">
      <span class="placeholder-icon">?</span>
      <span class="placeholder-text">Нет фото</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { itemApi } from '@/api/itemApi';

const props = defineProps<{
  itemId: string;
  thumbnail?: boolean;
  alt?: string;
}>();

const photoUrl = ref<string>('');
const loading = ref(true);

const loadPhoto = async () => {
  if (!props.itemId) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const endpoint = props.thumbnail ? 'getPhotoThumbnail' : 'getPhoto';
    const response = await itemApi[endpoint](props.itemId);
    const blob = new Blob([response.data], { type: 'image/jpeg' });
    // Освобождаем старый URL, если он был
    if (photoUrl.value) {
      URL.revokeObjectURL(photoUrl.value);
    }
    photoUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    console.error('Failed to load photo:', err);
    photoUrl.value = '';
  } finally {
    loading.value = false;
  }
};

const onError = () => {
  photoUrl.value = '';
  loading.value = false;
};

onMounted(() => {
  loadPhoto();
});

watch(() => props.itemId, () => {
  loadPhoto();
});

// Освобождаем URL при размонтировании
onBeforeUnmount(() => {
  if (photoUrl.value) {
    URL.revokeObjectURL(photoUrl.value);
  }
});
</script>

<style scoped>
.photo-viewer {
  width: 100%;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #eee;
  overflow: hidden;
  position: relative;
}

.photo-image {
  max-width: 50%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 4px;
}

.photo-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 14px;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 14px;
}
</style>