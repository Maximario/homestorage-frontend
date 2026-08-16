<template>
  <div class="item-view">
    <div class="breadcrumb">
      <router-link to="/containers">📦 Места хранения</router-link>
      <span v-if="containerPath"> → {{ containerPath }}</span>
      <span> → {{ item?.name || 'Загрузка...' }}</span>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="item" class="item-details">
      <div class="header">
        <div class="title-section">
          <h2>{{ item.name }}</h2>
          <span class="category-badge">{{ translateCategory(item.category) }}</span>
          <span v-if="item.quantity > 1" class="quantity-badge">
            × {{ item.quantity }}
          </span>
        </div>
        <div class="actions">
          <button class="btn-secondary" @click="goToEdit">
            ✏️ Редактировать
          </button>
          <button class="btn-danger" @click="deleteItem">
            🗑️ Удалить
          </button>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Категория</span>
          <span class="info-value">{{ translateCategory(item.category) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Количество</span>
          <span class="info-value">{{ item.quantity }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Место хранения</span>
          <span class="info-value">
            <router-link :to="`/containers/${item.containerId}`">
              {{ containerName || 'Загрузка...' }}
            </router-link>
          </span>
        </div>
        <div v-if="item.reminderDate" class="info-item">
          <span class="info-label">⏰ Напоминание</span>
          <span class="info-value">
            {{ formatDate(item.reminderDate) }}
            <span v-if="item.reminderNote" class="reminder-note">
              ({{ item.reminderNote }})
            </span>
            <span v-if="item.reminderCompleted" class="reminder-completed">
              ✅ Выполнено
            </span>
          </span>
        </div>
        <div v-if="item.description" class="info-item full-width">
          <span class="info-label">Описание</span>
          <span class="info-value">{{ item.description }}</span>
        </div>

        <!-- 🔥 ОБНОВЛЁННЫЙ БЛОК С ФОТО -->
        <div v-if="item.photoUrl" class="info-item full-width">
          <span class="info-label">Фото</span>
          <div class="photo-container">
            <img
                :src="getFullPhotoUrl(item.photoUrl)"
                alt="Фото вещи"
                class="item-photo"
                @error="handleImageError"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { itemApi } from '@/api/itemApi';
import { containerApi } from '@/api/containerApi';
import type { Item } from '@/types/item.types';

const route = useRoute();
const router = useRouter();
const itemId = route.params.id as string;

const item = ref<Item | null>(null);
const containerName = ref<string>('');
const containerPath = ref<string>('');
const loading = ref(true);
const error = ref('');

// 🔥 Базовый URL для API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const translateCategory = (category?: string) => {
  const map: Record<string, string> = {
    CLOTHES: '👕 Одежда',
    TOOLS: '🔧 Инструменты',
    BOOKS: '📚 Книги',
    DOCUMENTS: '📄 Документы',
    ELECTRONICS: '💻 Электроника',
    FOOD: '🍎 Продукты',
    MEDICINES: '💊 Лекарства',
    SPORTS: '⚽ Спорт',
    OTHER: '📦 Другое',
  };
  return category ? map[category] || category : '';
};

const formatDate = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// 🔥 Формируем полный URL для фото
const getFullPhotoUrl = (photoUrl: string) => {
  if (!photoUrl) return '';
  // Если это уже полный URL (начинается с http), возвращаем как есть
  if (photoUrl.startsWith('http')) {
    return photoUrl;
  }
  // Если это путь к эндпоинту (начинается с /api), добавляем базовый URL
  if (photoUrl.startsWith('/api')) {
    return API_BASE_URL + photoUrl.replace('/api/v1', '');
  }
  // Если это просто путь, формируем полный URL
  return API_BASE_URL + '/items/' + itemId + '/photo';
};

// 🔥 Обработка ошибки загрузки фото
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // Можно показать заглушку или скрыть блок
  img.style.display = 'none';
  // Или показать сообщение об ошибке
  console.warn('Failed to load photo for item:', itemId);
};

const loadItem = async () => {
  try {
    const response = await itemApi.getItemById(itemId);
    item.value = response.data;

    // Загружаем имя контейнера
    try {
      const containerResp = await containerApi.getContainerById(item.value.containerId);
      containerName.value = containerResp.data.name;
    } catch (err) {
      console.error('Failed to load container name', err);
    }

    // Загружаем путь
    try {
      const pathResp = await containerApi.getContainerPath(item.value.containerId);
      containerPath.value = pathResp.data;
    } catch (err) {
      console.error('Failed to load container path', err);
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка загрузки вещи';
  } finally {
    loading.value = false;
  }
};

const goToEdit = () => {
  router.push(`/items/${itemId}/edit`);
};

const deleteItem = async () => {
  if (!confirm('Вы уверены, что хотите удалить эту вещь?')) {
    return;
  }

  try {
    await itemApi.deleteItem(itemId);
    router.push(`/containers/${item.value?.containerId}`);
  } catch (err) {
    alert('Ошибка при удалении. Попробуйте позже.');
    console.error(err);
  }
};

onMounted(() => {
  loadItem();
});
</script>

<style scoped>
.item-view {
  max-width: 800px;
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

.loading,
.error {
  text-align: center;
  padding: 40px;
  color: #888;
}

.error {
  color: #d32f2f;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 24px;
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

.category-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.quantity-badge {
  background: #fff3cd;
  color: #856404;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  color: #333;
}

.reminder-note {
  font-size: 14px;
  color: #666;
}

.reminder-completed {
  color: #4caf50;
  font-weight: 500;
}

.photo-container {
  margin-top: 8px;
}

.item-photo {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  border: 1px solid #ddd;
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