<template>
  <div class="item-create">
    <h2>➕ Новая вещь</h2>
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label>Название *</label>
        <input
            v-model="form.name"
            type="text"
            required
            placeholder="Например: Зимняя куртка, Молоток, Книга"
        />
      </div>

      <div class="form-group">
        <label>Категория *</label>
        <select v-model="form.category" required>
          <option value="">Выберите категорию...</option>
          <option value="CLOTHES">👕 Одежда</option>
          <option value="TOOLS">🔧 Инструменты</option>
          <option value="BOOKS">📚 Книги</option>
          <option value="DOCUMENTS">📄 Документы</option>
          <option value="ELECTRONICS">💻 Электроника</option>
          <option value="FOOD">🍎 Продукты</option>
          <option value="MEDICINES">💊 Лекарства</option>
          <option value="SPORTS">⚽ Спорт</option>
          <option value="OTHER">📦 Другое</option>
        </select>
      </div>

      <div class="form-group">
        <label>Описание</label>
        <textarea
            v-model="form.description"
            placeholder="Дополнительная информация о вещи..."
            rows="3"
        />
      </div>

      <div class="form-group">
        <label>Количество</label>
        <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            placeholder="1"
        />
      </div>

      <div class="form-group">
        <label>Дата напоминания</label>
        <input
            v-model="form.reminderDate"
            type="date"
        />
        <small>Например, срок годности или дата, когда нужно забрать вещь</small>
      </div>

      <div class="form-group">
        <label>Заметка для напоминания</label>
        <input
            v-model="form.reminderNote"
            type="text"
            placeholder="Например: Проверить срок годности"
        />
      </div>

      <div class="form-group">
        <label>Фото вещи</label>
        <div class="photo-upload">
          <div v-if="photoPreview" class="photo-preview">
            <img :src="photoPreview" alt="Фото вещи" class="photo-image" />
            <button
                type="button"
                class="photo-remove"
                @click="removePhoto"
                title="Удалить фото"
            >
              ✕
            </button>
          </div>
          <div v-else class="photo-placeholder">
            <span class="photo-placeholder-icon">📷</span>
            <span>Нажмите для загрузки фото</span>
          </div>
          <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="photo-input"
              @change="handleFileSelect"
          />
        </div>
        <small>Поддерживаются форматы JPG, PNG, WEBP. Максимальный размер 10 МБ.</small>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Создание...' : 'Создать вещь' }}
        </button>
        <button type="button" @click="goBack" class="btn-secondary">
          Отмена
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { itemApi } from '@/api/itemApi';
import type { ItemRequest } from '@/types/item.types';

const route = useRoute();
const router = useRouter();
const containerId = route.query.containerId as string;

const loading = ref(false);
const error = ref('');

const form = ref<ItemRequest>({
  name: '',
  category: '',
  description: '',
  containerId: containerId || '',
  quantity: 1,
  reminderDate: '',
  reminderNote: '',
});

const photoPreview = ref<string>('');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      error.value = 'Размер файла не должен превышать 10 МБ';
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      error.value = 'Пожалуйста, выберите изображение';
      input.value = '';
      return;
    }

    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removePhoto = () => {
  photoPreview.value = '';
  selectedFile.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const uploadPhoto = async (id: string): Promise<void> => {
  if (!selectedFile.value) return;
  try {
    await itemApi.uploadPhoto(id, selectedFile.value);
  } catch (err) {
    console.error('Failed to upload photo', err);
  }
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.category) {
    error.value = 'Название и категория обязательны';
    return;
  }

  if (!form.value.containerId) {
    error.value = 'Не указан контейнер для вещи';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const payload = {
      ...form.value,
      quantity: form.value.quantity || 1,
      reminderDate: form.value.reminderDate || undefined,
      reminderNote: form.value.reminderNote || undefined,
    };

    const response = await itemApi.createItem(payload);

    // Загружаем фото, если оно выбрано
    if (selectedFile.value) {
      await uploadPhoto(response.data.id);
    }

    router.push(`/containers/${form.value.containerId}`);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка создания вещи';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  if (form.value.containerId) {
    router.push(`/containers/${form.value.containerId}`);
  } else {
    router.push('/containers');
  }
};

onMounted(() => {
  if (!containerId) {
    error.value = 'Не указан контейнер для вещи';
  }
});
</script>

<style scoped>
.item-create {
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 20px;
  color: #1976d2;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  padding: 12px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-primary:disabled {
  background: #aaa;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 12px 24px;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.error {
  color: #d32f2f;
  margin-top: 12px;
  text-align: center;
}

/* 🔥 Стили для загрузки фото */
.photo-upload {
  position: relative;
  width: 200px;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
  background: #fafafa;
}

.photo-upload:hover {
  border-color: #1976d2;
}

.photo-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.photo-remove:hover {
  background: rgba(211, 47, 47, 0.9);
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

.photo-placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.photo-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
</style>