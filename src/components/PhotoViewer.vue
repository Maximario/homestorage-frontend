<template>
  <div class="photo-viewer">
    <div v-if="loading" class="photo-loading">Загрузка фото...</div>
    <img
        v-else-if="photoUrl"
        :src="photoUrl"
        :alt="alt"
        class="photo-image"
        @error="onError"
    />
    <div v-else class="photo-placeholder">
      <span>?</span>
      <span>Нет фото</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { itemApi } from '@/api/itemApi';

const props = defineProps<{
  itemId: string;
  thumbnail?: boolean;
  alt?: string;
}>();

const photoUrl = ref<string>('');
const loading = ref(true);

const loadPhoto = async () => {
  loading.value = true;
  try {
    const endpoint = props.thumbnail ? 'getPhotoThumbnail' : 'getPhoto';
    const response = await itemApi[endpoint](props.itemId);
    const blob = new Blob([response.data], { type: 'image/jpeg' });
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
};

onMounted(() => {
  loadPhoto();
});

watch(() => props.itemId, () => {
  loadPhoto();
});
</script>

<style scoped>
.photo-viewer {
  width: 100%;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
}

.photo-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 8px;
}

.photo-loading {
  color: #999;
  font-size: 14px;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ccc;
  font-size: 48px;
}

.photo-placeholder span:last-child {
  font-size: 14px;
  margin-top: 8px;
}
</style>