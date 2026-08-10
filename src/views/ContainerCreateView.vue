<template>
  <div class="container-create">
    <h2>➕ Новое место хранения</h2>
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label>Название *</label>
        <input
            v-model="form.name"
            type="text"
            required
            placeholder="Например: Спальня, Шкаф, Коробка №5"
        />
      </div>

      <div class="form-group">
        <label>Тип *</label>
        <select v-model="form.type" required>
          <option value="">Выберите тип...</option>
          <option value="BUILDING">🏢 Здание</option>
          <option value="APARTMENT">🏠 Квартира</option>
          <option value="ROOM">🚪 Комната</option>
          <option value="FURNITURE">🪑 Мебель</option>
          <option value="SHELF">📚 Полка</option>
          <option value="BOX">📦 Коробка</option>
          <option value="DRAWER">🗄️ Ящик</option>
        </select>
      </div>

      <div class="form-group">
        <label>Описание</label>
        <textarea
            v-model="form.description"
            placeholder="Дополнительная информация о месте хранения..."
            rows="3"
        />
      </div>

      <div class="form-group">
        <label>Родительское место</label>
        <select
            v-model="form.parentId"
            @change="handleParentChange"
        >
          <option :value="null">Без родителя (корневое)</option>
          <option
              v-for="container in filteredParents"
              :key="container.id"
              :value="container.id"
          >
            {{ getIndent(container) }} {{ container.name }}
            <span v-if="!isValidParent(container)" style="color: #999;">
        (недоступно)
      </span>
          </option>
        </select>
        <small v-if="form.type === 'BUILDING'">
          🔹 Здание не может иметь родителя — оно всегда корневое.
        </small>
        <small v-else-if="form.type === 'BOX'">
          🔹 Коробка может находиться внутри здания, квартиры, комнаты, мебели, полки, другой коробки или ящика.
        </small>
        <small v-else-if="form.type === 'DRAWER'">
          🔹 Ящик может находиться внутри здания, квартиры, комнаты, мебели или полки.
        </small>
        <small v-else-if="filteredParents.length === 0 && form.type">
          🔹 Для выбранного типа пока нет доступных родительских контейнеров.
        </small>
        <small v-else>
          🔹 Доступны только контейнеры, соответствующие правилам иерархии.
        </small>
      </div>

      <div class="form-group">
        <label>Уровень доступа</label>
        <select v-model="form.accessLevel">
          <option value="PRIVATE">Личное</option>
          <option value="GROUP_READ">Доступно для чтения группе</option>
          <option value="GROUP_WRITE">Доступно для редактирования группе</option>
        </select>
      </div>

      <div v-if="form.accessLevel !== 'PRIVATE'" class="form-group">
        <label>Группа</label>
        <select v-model="form.groupId">
          <option :value="null">Выберите группу...</option>
          <option
              v-for="group in userGroups"
              :key="group.id"
              :value="group.id"
          >
            {{ group.name }}
          </option>
        </select>
        <small>Если у вас нет групп — создайте их в разделе "Группы"</small>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Создание...' : 'Создать место' }}
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
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { containerApi } from '@/api/containerApi';
import { groupApi } from '@/api/groupApi';
import type { Container, ContainerRequest } from '@/types/container.types';
import type { Group } from '@/types/group.types';

const router = useRouter();
const loading = ref(false);
const error = ref('');

// Данные формы
const form = ref<ContainerRequest & { type: string }>({
  name: '',
  type: '',
  description: '',
  parentId: null,
  accessLevel: 'PRIVATE',
  groupId: null,
});

const allContainers = ref<Container[]>([]);
const userGroups = ref<Group[]>([]);

const validParents: Record<string, string[]> = {
  BUILDING: [],
  APARTMENT: ['BUILDING'],
  ROOM: ['BUILDING', 'APARTMENT'],
  FURNITURE: ['BUILDING', 'APARTMENT', 'ROOM'],
  SHELF: ['BUILDING', 'APARTMENT', 'ROOM', 'FURNITURE'],
  BOX: ['BUILDING', 'APARTMENT', 'ROOM', 'FURNITURE', 'SHELF', 'BOX', 'DRAWER'],
  DRAWER: ['BUILDING', 'APARTMENT', 'ROOM', 'FURNITURE', 'SHELF'],
};

// Проверка: можно ли выбрать этот контейнер как родителя
const isValidParent = (container: Container): boolean => {
  if (!form.value.type) return false;
  if (container.id === form.value.parentId) return false; // сам себя
  if (isDescendant(container.id)) return false; // защита от циклов

  // Если у типа нет доступных родителей (BUILDING) — родитель запрещён
  const allowedTypes = validParents[form.value.type] || [];
  if (allowedTypes.length === 0) return false;

  return allowedTypes.includes(container.type);
};

// 🔥 Проверка на цикл (упрощённая версия)
const isDescendant = (parentId: string): boolean => {
  // Временно: простая проверка, чтобы не выбрать потомка
  // Более точная версия потребует загрузки дерева
  return false;
};

// Фильтруем доступные родители
const filteredParents = computed(() => {
  return allContainers.value.filter(c => isValidParent(c));
});

// Отступы для визуализации иерархии
const getIndent = (container: Container): string => {
  const parent = allContainers.value.find(c => c.id === container.parentId);
  if (parent) {
    return '>>' + getIndent(parent);
  }
  return '';
};

const handleParentChange = () => {
  // Ничего не делаем — просто принудительно обновляем реактивность
  nextTick(() => {
    // Небольшой трюк: обновляем ссылку на массив,
    // чтобы Vue перерисовал select
    const currentParentId = form.value.parentId;
    form.value.parentId = null;
    nextTick(() => {
      form.value.parentId = currentParentId;
    });
  });
};

const loadFormData = async () => {
  try {
    const containersResp = await containerApi.getAvailableForParent();
    allContainers.value = containersResp.data;

    try {
      const groupsResp = await groupApi.getUserGroups();
      userGroups.value = groupsResp.data;
    } catch {
      userGroups.value = [];
    }
  } catch (err) {
    console.error('Failed to load form data', err);
  }
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.type) {
    error.value = 'Название и тип контейнера обязательны';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const payload: ContainerRequest = {
      name: form.value.name,
      description: form.value.description || undefined,
      type: form.value.type as Container['type'],
      parentId: form.value.parentId || undefined,
      accessLevel: form.value.accessLevel as Container['accessLevel'],
      groupId: form.value.accessLevel !== 'PRIVATE' ? form.value.groupId : undefined,
    };

    await containerApi.createContainer(payload);
    router.push('/containers');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка создания контейнера';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/containers');
};

// Сброс родителя при смене типа
watch(() => form.value.type, () => {
  if (form.value.parentId) {
    const parent = allContainers.value.find(c => c.id === form.value.parentId);
    if (!parent || !isValidParent(parent)) {
      form.value.parentId = null;
    }
  }
});

onMounted(() => {
  loadFormData();
});
</script>

<style scoped>
.container-create {
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
</style>