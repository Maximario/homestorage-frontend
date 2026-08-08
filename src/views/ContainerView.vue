<template>
  <div class="container-view">
    <!-- Путь -->
    <div class="breadcrumb">
      <router-link to="/containers">📦 Места хранения</router-link>
      <span v-if="path"> → {{ path }}</span>
    </div>

    <!-- Заголовок -->
    <div class="header">
      <div class="title-section">
        <h2>{{ container?.name || 'Загрузка...' }}</h2>
        <span class="type-badge">{{ translateType(container?.type) }}</span>
        <span class="access-badge" :class="container?.accessLevel?.toLowerCase()">
          {{ translateAccess(container?.accessLevel) }}
        </span>
      </div>
      <div class="actions">
        <button class="btn-secondary" @click="goToEdit" v-if="container">
          ✏️ Редактировать
        </button>
        <button class="btn-danger" @click="deleteContainer" v-if="container">
          🗑️ Удалить
        </button>
      </div>
    </div>

    <!-- Описание -->
    <p v-if="container?.description" class="description">
      {{ container.description }}
    </p>

    <!-- Вложенные контейнеры (дочерние места) -->
    <div v-if="children.length > 0" class="section">
      <h3>📁 Внутри находятся:</h3>
      <div class="child-grid">
        <div
          v-for="child in children"
          :key="child.id"
          class="child-card"
          @click="goToContainer(child.id)"
        >
          <div class="child-icon">{{ getTypeIcon(child.type) }}</div>
          <div class="child-name">{{ child.name }}</div>
          <div class="child-type">{{ translateType(child.type) }}</div>
        </div>
      </div>
    </div>

    <!-- Вещи -->
    <div class="section">
      <div class="section-header">
        <h3>📦 Вещи</h3>
        <button class="btn-primary" @click="goToCreateItem">
          + Добавить вещь
        </button>
      </div>

      <div v-if="itemsLoading" class="loading">Загрузка вещей...</div>
      <div v-else-if="items.length === 0" class="empty">
        В этом месте пока нет вещей. Добавьте первую!
      </div>
      <div v-else class="items-grid">
        <div
          v-for="item in items"
          :key="item.id"
          class="item-card"
          @click="goToItem(item.id)"
        >
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-category">{{ translateCategory(item.category) }}</div>
            <div class="item-quantity">× {{ item.quantity }}</div>
          </div>
          <div v-if="item.reminderDate" class="item-reminder">
            ⏰ {{ formatDate(item.reminderDate) }}
          </div>
          <div v-if="item.photoThumbnailUrl" class="item-photo">
            <img :src="item.photoThumbnailUrl" alt="Фото" />
          </div>
        </div>
      </div>
    </div>

    <!-- Кнопка назад -->
    <div class="back">
      <button class="btn-secondary" @click="goBack">← Назад к списку</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { containerApi } from '@/api/containerApi';
import { itemApi } from '@/api/itemApi';
import type { Container } from '@/types/container.types';
import type { Item } from '@/types/item.types';
import { translateType, translateAccess, translateCategory, getTypeIcon} from "@/utils/translations";

const route = useRoute();
const router = useRouter();

const containerId = route.params.id as string;

const container = ref<Container | null>(null);
const children = ref<Container[]>([]);
const items = ref<Item[]>([]);
const path = ref<string>('');
const itemsLoading = ref(true);

const formatDate = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ----- ЗАГРУЗКА ДАННЫХ -----
const loadContainer = async (id: string) => {
  if (!id) {
    console.warn('Container ID is empty');
    return;
  }
  try {
    const response = await containerApi.getContainerById(id);
    container.value = response.data;

    const pathResponse = await containerApi.getContainerPath(id);
    path.value = pathResponse.data;
  } catch (err) {
    console.error('Failed to load container', err);
  }
};

const loadChildren = async (id: string) => {
  if (!id) {
    console.warn('No container ID provided for loading children');
    return;
  }
  try {
    const response = await containerApi.getChildContainers(id);
    children.value = response.data;
  } catch (err) {
    console.error('Failed to load children', err);
  }
};

const loadItems = async (id: string) => {
  if (!id) {
    console.warn('No ID provided for loading items');
    return;
  }
  itemsLoading.value = true;
  try {
    const response = await itemApi.getItemsByContainer(id);
    items.value = response.data;
  } catch (err) {
    console.error('Failed to load items', err);
  } finally {
    itemsLoading.value = false;
  }
};

const loadAllData = async (id: string) => {
  if (!id) return;
  await Promise.all([loadContainer(id), loadChildren(id), loadItems(id)]);
};

// ----- ЖИЗНЕННЫЙ ЦИКЛ -----
onMounted(() => {
  const id = route.params.id as string;
  loadAllData(id);
});

// 🔥 ГЛАВНОЕ: следим за изменением ID в URL
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      loadAllData(newId as string);
    }
  }
);

// ----- НАВИГАЦИЯ -----
const goToContainer = (id: string) => {
  router.push(`/containers/${id}`);
};

const goToCreateItem = () => {
  router.push(`/items/create?containerId=${route.params.id}`);
};

const goToEdit = () => {
  router.push(`/containers/${route.params.id}/edit`);
};

const goToItem = (id: string) => {
  router.push(`/items/${id}`);
};

const goBack = () => {
  router.push('/containers');
};

const deleteContainer = async () => {
  if (!confirm('Вы уверены, что хотите удалить это место хранения и всё, что в нём находится?')) {
    return;
  }

  try {
    await containerApi.deleteContainer(route.params.id as string);
    router.push('/containers');
  } catch (err) {
    alert('Ошибка при удалении. Попробуйте позже.');
    console.error(err);
  }
};

</script>

<style scoped>
.container-view {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.breadcrumb {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.breadcrumb a {
  color: #1976d2;
  text-decoration: none;
}
.breadcrumb a:hover {
  text-decoration: underline;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title-section h2 {
  margin: 0;
  font-size: 28px;
}

.type-badge {
  background: #e0e0e0;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.access-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.access-badge.private {
  background: #fff3cd;
  color: #856404;
}
.access-badge.group_read {
  background: #cce5ff;
  color: #004085;
}
.access-badge.group_write {
  background: #d4edda;
  color: #155724;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.description {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 6px;
  color: #555;
  margin-bottom: 24px;
}

.section {
  margin-top: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

.child-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.child-card {
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.child-card:hover {
  background: #e3f2fd;
  border-color: #1976d2;
  transform: translateY(-2px);
}

.child-icon {
  font-size: 32px;
}
.child-name {
  font-weight: 600;
  margin-top: 6px;
}
.child-type {
  font-size: 12px;
  color: #888;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.item-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.item-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #1976d2;
}

.item-name {
  font-weight: 600;
  font-size: 16px;
}
.item-category {
  font-size: 13px;
  color: #666;
}
.item-quantity {
  font-size: 14px;
  color: #1976d2;
}
.item-reminder {
  font-size: 13px;
  color: #d32f2f;
}
.item-photo img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #888;
}

.back {
  margin-top: 30px;
}

.btn-primary {
  padding: 8px 16px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  padding: 8px 16px;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #d0d0d0;
}

.btn-danger {
  padding: 8px 16px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-danger:hover {
  background: #b71c1c;
}
</style>