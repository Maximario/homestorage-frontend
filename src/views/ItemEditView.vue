<template>
  <div class="item-edit">
    <h2>✏️ Редактирование вещи</h2>
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
        <label>Переместить в другое место</label>
        <TreeSelect
            v-model="form.containerId"
            :tree-data="treeData"
            :valid-child-types="[]"
            placeholder="Выберите место хранения..."
        />
        <small>Вы можете переместить вещь в другое место хранения</small>
      </div>

      <div class="form-group">
        <label>Фото вещи</label>
        <div class="photo-wrapper">
          <div class="photo-upload" @click="openFilePicker">
            <!-- Если есть фото — показываем его через PhotoViewer -->
            <div v-if="hasPhoto" class="photo-preview">
              <PhotoViewer
                  :item-id="itemId"
                  class="photo-viewer-compact"
              />
            </div>
            <!-- Если выбрано новое фото для загрузки — показываем превью -->
            <div v-else-if="photoPreview" class="photo-preview">
              <img
                  :src="photoPreview"
                  alt="Новое фото"
                  class="photo-image"
              />
            </div>
            <!-- Если нет фото — показываем заглушку -->
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
          <!-- 🔥 Кнопка удаления вынесена за пределы photo-upload -->
          <button
              v-if="hasPhoto || photoPreview"
              type="button"
              class="photo-remove-btn"
              @click="removePhoto"
              title="Удалить фото"
          >
            ✕ Удалить фото
          </button>
        </div>
        <small>Поддерживаются форматы JPG, PNG, WEBP. Максимальный размер 10 МБ.</small>
        <small v-if="hasPhoto" class="photo-hint">
          🔹 Текущее фото будет заменено при загрузке нового.
        </small>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
        <button type="button" @click="goBack" class="btn-secondary">
          Отмена
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { itemApi } from '@/api/itemApi';
import { containerApi } from '@/api/containerApi';
import TreeSelect from '@/components/TreeSelect.vue';
import PhotoViewer from '@/components/PhotoViewer.vue';
import type { ItemRequest } from '@/types/item.types';

const route = useRoute();
const router = useRouter();
const itemId = route.params.id as string;

const loading = ref(false);
const error = ref('');
const success = ref('');

const form = ref<ItemRequest>({
  name: '',
  category: '',
  description: '',
  containerId: '',
  quantity: 1,
  reminderDate: '',
  reminderNote: '',
});

const treeData = ref<any[]>([]);
const currentPhotoUrl = ref<string>('');
const photoPreview = ref<string>('');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

const hasPhoto = computed(() => {
  return !!currentPhotoUrl.value && !photoPreview.value;
});

// 🔥 Рекурсивная загрузка дерева всех мест хранения
const loadFullTree = async (node: any): Promise<any> => {
  if (!node.id) return node;
  try {
    const childrenResp = await containerApi.getChildContainers(node.id);
    node.children = await Promise.all(
        childrenResp.data.map(async (c: any) => {
          const child = {
            id: c.id,
            name: c.name,
            type: c.type,
            children: [],
          };
          return await loadFullTree(child);
        })
    );
    return node;
  } catch (err) {
    console.error(`Failed to load children for ${node.id}`, err);
    return node;
  }
};

// 🔥 Загружаем дерево контейнеров
const loadTreeData = async () => {
  try {
    const response = await containerApi.getRootContainers();
    treeData.value = await Promise.all(
        response.data.map(async (c: any) => {
          const root = {
            id: c.id,
            name: c.name,
            type: c.type,
            children: [],
          };
          return await loadFullTree(root);
        })
    );
  } catch (err) {
    console.error('Failed to load tree data', err);
  }
};

const loadItem = async () => {
  try {
    const response = await itemApi.getItemById(itemId);
    const item = response.data;

    form.value.name = item.name;
    form.value.category = item.category;
    form.value.description = item.description || '';
    form.value.containerId = item.containerId;
    form.value.quantity = item.quantity;
    form.value.reminderDate = item.reminderDate || '';
    form.value.reminderNote = item.reminderNote || '';

    // Сохраняем URL фото
    currentPhotoUrl.value = item.photoUrl || '';

    await loadTreeData();
  } catch (err) {
    console.error('Failed to load item', err);
    error.value = 'Не удалось загрузить данные вещи';
  }
};

// 🔥 Обработка выбора файла
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];

    // Проверка размера (10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      error.value = 'Размер файла не должен превышать 10 МБ';
      input.value = '';
      return;
    }

    // Проверка типа
    if (!file.type.startsWith('image/')) {
      error.value = 'Пожалуйста, выберите изображение';
      input.value = '';
      return;
    }

    selectedFile.value = file;

    // Создаём превью
    const reader = new FileReader();
    reader.onload = (e) => {
      photoPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// 🔥 Удаление фото
const removePhoto = async () => {
  // Если есть выбранный файл для загрузки — просто сбрасываем его
  if (selectedFile.value) {
    photoPreview.value = '';
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  // Если есть сохранённое фото — удаляем через API
  if (currentPhotoUrl.value) {
    // Если есть сохранённое фото — удаляем через API
    try {
      isUploading.value = true;
      await itemApi.deletePhoto(itemId);
      currentPhotoUrl.value = '';
      photoPreview.value = '';
      selectedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      success.value = 'Фото удалено';
      setTimeout(() => { success.value = ''; }, 3000);
    } catch (err) {
      error.value = 'Ошибка при удалении фото';
      console.error(err);
    } finally {
      isUploading.value = false;
    }
  }
};

// 🔥 Загрузка фото
const uploadPhoto = async (): Promise<string | null> => {
  if (!selectedFile.value) return null;

  try {
    isUploading.value = true;
    const response = await itemApi.uploadPhoto(itemId, selectedFile.value);
    currentPhotoUrl.value = response.data.photoUrl || '';
    photoPreview.value = '';
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return currentPhotoUrl.value;
  } catch (err) {
    console.error('Failed to upload photo', err);
    error.value = 'Ошибка при загрузке фото';
    return null;
  } finally {
    isUploading.value = false;
  }
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.category || !form.value.containerId) {
    error.value = 'Название, категория и место хранения обязательны';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    // Сначала обновляем данные вещи
    const payload = {
      ...form.value,
      quantity: form.value.quantity || 1,
      reminderDate: form.value.reminderDate || undefined,
      reminderNote: form.value.reminderNote || undefined,
    };

    await itemApi.updateItem(itemId, payload);
    success.value = 'Изменения сохранены!';

    // Затем загружаем фото, если оно выбрано
    if (selectedFile.value) {
      await uploadPhoto();
    }

    setTimeout(() => {
      router.push(`/items/${itemId}`);
    }, 1000);
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка обновления вещи';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push(`/items/${itemId}`);
};

onMounted(() => {
  loadItem();
});
</script>

<style scoped>
.item-edit {
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

.form-group .photo-hint {
  color: #1976d2;
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

.success {
  color: #4caf50;
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

.photo-viewer-compact {
  width: 100%;
  height: 100%;
  border-radius: 0;
  border: none;
  min-height: unset;
}

.photo-viewer-compact :deep(.photo-image) {
  max-height: 200px;
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

.photo-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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

.photo-remove-btn {
  align-self: flex-start;
  padding: 4px 12px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.photo-remove-btn:hover {
  background: #b71c1c;
}
</style>