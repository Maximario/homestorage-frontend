<template>
  <div class="container-create">
    <h2>Создание места хранения</h2>
    <form @submit.prevent="handleSubmit" class="form">
      <!-- Название -->
      <div class="form-group">
        <label>Название *</label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Например: Спальня, Шкаф, Коробка №5"
        />
      </div>

      <!-- Тип места хранения -->
      <div class="form-group">
        <label>Тип *</label>
        <select v-model="form.type" required>
          <option value="">Выберите тип...</option>
          <option value="BUILDING">Здание</option>
          <option value="APARTMENT">Квартира</option>
          <option value="ROOM">Комната</option>
          <option value="FURNITURE">Мебель</option>
          <option value="SHELF">Полка</option>
          <option value="BOX">Коробка</option>
          <option value="DRAWER">Ящик</option>
        </select>
      </div>

      <!-- Описание -->
      <div class="form-group">
        <label>Описание</label>
        <textarea
          v-model="form.description"
          placeholder="Дополнительная информация..."
          rows="3"
        />
      </div>

      <!-- Родительское место хранения (необязательно) -->
      <div class="form-group">
        <label>Родительский место хранения</label>
        <select v-model="form.parentId">
          <option :value="null">Без родителя (корневой)</option>
          <option
            v-for="container in availableParents"
            :key="container.id"
            :value="container.id"
          >
            {{ container.name }} ({{ container.type }})
          </option>
        </select>
        <small>Если место хранения должно быть внутри другого — выберите его</small>
      </div>

      <!-- Уровень доступа -->
      <div class="form-group">
        <label>Уровень доступа</label>
        <select v-model="form.accessLevel">
          <option value="PRIVATE">Личный</option>
          <option value="GROUP_READ">Доступно для чтения группе</option>
          <option value="GROUP_WRITE">Доступно для редактирования группе</option>
        </select>
      </div>

      <!-- Группа (если место хранения групповое) -->
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

      <!-- Кнопки -->
      <div class="form-actions">
        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Создание...' : 'Создать место хранения' }}
        </button>
        <button type="button" @click="goBack" class="btn-secondary">
          Отмена
        </button>
      </div>

      <!-- Ошибки -->
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { containerApi } from '@/api/containerApi';
import { groupApi } from '@/api/groupApi';
import type { Container, ContainerRequest } from '@/types/container.types';
import type { Group } from '@/types/group.types';

const router = useRouter();
const loading = ref(false);
const error = ref('');

// Данные формы
const form = ref<ContainerRequest>({
  name: '',
  type: '',
  description: '',
  parentId: null,
  accessLevel: 'PRIVATE',
  groupId: null,
});

// Списки для выбора
const availableParents = ref<Container[]>([]);
const userGroups = ref<Group[]>([]);

// Загрузка данных для формы
const loadFormData = async () => {
  try {
    const containersResp = await containerApi.getRootContainers();
    availableParents.value = containersResp.data;
  } catch (err) {
    console.error('Failed to load containers', err);
  }

  try {
    const groupsResp = await groupApi.getUserGroups();
    userGroups.value = groupsResp.data;
  } catch (err) {
    console.warn('Groups API not available yet. Ignoring...');
    userGroups.value = [];
  }
};

// Отправка формы
const handleSubmit = async () => {
  if (!form.value.name || !form.value.type) {
    error.value = 'Название и тип места обязательны';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const payload = {
      ...form.value,
      // Если выбран родитель — отправляем его ID, иначе null
      parentId: form.value.parentId || null,
      groupId: form.value.accessLevel !== 'PRIVATE' ? form.value.groupId : null,
    };

    await containerApi.createContainer(payload);

    // Успех — переходим на список мест хранения
    router.push('/containers');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка создания места хранения';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/containers');
};

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