<template>
  <div class="containers-page">
    <div class="header">
      <h2>Мои контейнеры</h2>
      <button class="add-btn">+ Добавить контейнер</button>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="containers.length === 0" class="empty">
      У вас пока нет контейнеров. Создайте первый!
    </div>
    <ul v-else class="container-list">
      <li v-for="container in containers" :key="container.id" class="container-item">
        <div class="container-info">
          <span class="name">{{ container.name }}</span>
          <span class="type">[{{ container.type }}]</span>
          <span class="access" :class="container.accessLevel.toLowerCase()">
            {{ container.accessLevel }}
          </span>
        </div>
        <button class="open-btn">Открыть</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { containerApi, type Container } from '@/api/containerApi';

const containers = ref<Container[]>([]);
const loading = ref(true);
const error = ref('');

const loadContainers = async () => {
  loading.value = true;
  try {
    const response = await containerApi.getRootContainers();
    containers.value = response.data;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка загрузки контейнеров';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadContainers();
});
</script>

<style scoped>
.containers-page { max-width: 800px; margin: 0 auto; padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.add-btn { background: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
.add-btn:hover { background: #43a047; }
.container-list { list-style: none; padding: 0; }
.container-item {
  display: flex; justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}
.container-item:hover { background: #f5f5f5; }
.container-info { display: flex; gap: 10px; align-items: center; }
.name { font-weight: bold; }
.type { color: #666; font-size: 14px; }
.access { font-size: 12px; padding: 2px 8px; border-radius: 12px; }
.access.private { background: #ffeb3b; color: #333; }
.access.group_read { background: #2196f3; color: white; }
.access.group_write { background: #9c27b0; color: white; }
.open-btn { background: #1976d2; color: white; border: none; padding: 5px 15px; border-radius: 4px; cursor: pointer; }
.loading, .empty { text-align: center; color: #666; padding: 40px; }
.error { color: red; text-align: center; padding: 20px; }
</style>