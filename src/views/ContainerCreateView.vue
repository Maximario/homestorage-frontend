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
        <select v-model="form.type" required @change="onTypeChange">
          <option value="">Выберите тип...</option>
          <option
              v-for="type in filteredTypes"
              :key="type"
              :value="type"
          >
            {{ getTypeLabel(type) }}
          </option>
        </select>
        <small v-if="form.parentId && filteredTypes.length > 0">
          🔹 Доступны только типы, которые могут находиться внутри выбранного родителя.
        </small>
        <small v-else-if="!form.parentId && form.type">
          🔹 Выберите родителя, чтобы ограничить доступные типы.
        </small>
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
        <TreeSelect
            v-model="form.parentId"
            :tree-data="filteredTreeData"
            :valid-child-types="[]"
            placeholder="Выберите родительское место..."
            @update:model-value="onParentChange"
        />
        <small v-if="form.type && !form.parentId">
          🔹 Выберите родителя, соответствующий правилам иерархии для типа "{{ getTypeLabel(form.type) }}".
        </small>
        <small v-else-if="form.parentId && filteredTreeData.length === 0">
          🔹 Для выбранного типа нет доступных родительских контейнеров.
        </small>
        <small v-else-if="route.query.parentId">
          🔹 Родительское место установлено из текущего контейнера.
        </small>
        <small v-else-if="form.type === 'BUILDING'">
          🔹 Здание не может иметь родителя — оно всегда корневое.
        </small>
        <small v-else-if="form.type === 'BOX'">
          🔹 Коробка может находиться внутри здания, квартиры, комнаты, мебели, полки, другой коробки или ящика.
        </small>
        <small v-else-if="form.type === 'DRAWER'">
          🔹 Ящик может находиться внутри здания, квартиры, комнаты, мебели или полки.
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

      <!-- Блок с координатами -->
      <div class="form-group">
        <label>📍 Местоположение на карте</label>
        <LocationPicker v-model="form.coordinates" />
        <small>Выберите точку на карте или введите координаты вручную</small>
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
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { containerApi, type ContainerTree } from '@/api/containerApi';
import { groupApi } from '@/api/groupApi';
import TreeSelect from '@/components/TreeSelect.vue';
import LocationPicker from '@/components/LocationPicker.vue';
import type { Container, ContainerRequest } from '@/types/container.types';
import type { Group } from '@/types/group.types';
import {getTypeLabel} from '@/utils/translations';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const error = ref('');

const form = ref<ContainerRequest & { type: string }>({
  name: '',
  type: '',
  description: '',
  parentId: undefined,
  accessLevel: 'PRIVATE',
  groupId: null,
  coordinates: {
    latitude: null,
    longitude: null,
  },
});

const treeData = ref<ContainerTree[]>([]);
const userGroups = ref<Group[]>([]);

// 🔥 Все доступные типы
const allTypes = ['BUILDING', 'APARTMENT', 'ROOM', 'FURNITURE', 'SHELF', 'BOX', 'DRAWER'];

// 🔥 Правила: какие типы могут быть внутри какого родителя
const validChildrenMap: Record<string, string[]> = {
  BUILDING: ['APARTMENT', 'ROOM', 'FURNITURE', 'SHELF', 'BOX', 'DRAWER'],
  APARTMENT: ['ROOM', 'FURNITURE', 'SHELF', 'BOX', 'DRAWER'],
  ROOM: ['FURNITURE', 'SHELF', 'BOX', 'DRAWER'],
  FURNITURE: ['SHELF', 'BOX', 'DRAWER'],
  SHELF: ['BOX', 'DRAWER'],
  BOX: ['BOX'],
  DRAWER: ['BOX'],
};

// 🔥 Правила: какие родители подходят для типа
const validParentsMap: Record<string, string[]> = {
  BUILDING: [],
  APARTMENT: ['BUILDING'],
  ROOM: ['BUILDING', 'APARTMENT'],
  FURNITURE: ['BUILDING', 'APARTMENT', 'ROOM'],
  SHELF: ['BUILDING', 'APARTMENT', 'ROOM', 'FURNITURE'],
  BOX: ['BUILDING', 'APARTMENT', 'ROOM', 'FURNITURE', 'SHELF', 'BOX', 'DRAWER'],
  DRAWER: ['BUILDING', 'APARTMENT', 'ROOM', 'FURNITURE', 'SHELF'],
};

// 🔥 Фильтруем типы в зависимости от выбранного родителя
const filteredTypes = computed(() => {
  if (!form.value.parentId) return allTypes;

  // Находим родителя в дереве
  const findParent = (nodes: any[]): any => {
    for (const node of nodes) {
      if (node.id === form.value.parentId) return node;
      const found = findParent(node.children);
      if (found) return found;
    }
    return null;
  };

  const parent = findParent(treeData.value);
  if (!parent) return allTypes;

  return validChildrenMap[parent.type] || [];
});

// 🔥 Фильтруем дерево в зависимости от выбранного типа
const filteredTreeData = computed(() => {
  if (!form.value.type) return treeData.value;
  if (form.value.type === 'BUILDING') return []; // BUILDING не может иметь родителя

  const allowedParentTypes = validParentsMap[form.value.type] || [];
  if (allowedParentTypes.length === 0) return [];

  // Фильтруем дерево: оставляем только те узлы, типы которых разрешены
  const filterTree = (nodes: any[]): any[] => {
    return nodes
        .map(node => ({
          ...node,
          children: filterTree(node.children),
        }))
        .filter(node => allowedParentTypes.includes(node.type) || node.children.length > 0);
  };

  return filterTree(treeData.value);
});

// 🔥 Обработчик изменения типа
const onTypeChange = () => {
  // Если выбран тип BUILDING — очищаем родителя
  if (form.value.type === 'BUILDING') {
    form.value.parentId = undefined;
  }

  // Если выбранный родитель не подходит под тип — сбрасываем
  if (form.value.parentId && form.value.type) {
    const parent = treeData.value.find(c => c.id === form.value.parentId);
    if (parent && !validParentsMap[form.value.type].includes(parent.type)) {
      form.value.parentId = undefined;
    }
  }
};

// 🔥 Обработчик изменения родителя
const onParentChange = (parentId: string | undefined) => {
  form.value.parentId = parentId;
  // Если выбран тип BUILDING и появился родитель — сбрасываем тип
  if (parentId && form.value.type === 'BUILDING') {
    form.value.type = '';
  }
  // Если выбранный тип не подходит под родителя — сбрасываем
  if (parentId && form.value.type) {
    const parent = treeData.value.find(c => c.id === parentId);
    if (parent && !validChildrenMap[parent.type].includes(form.value.type)) {
      form.value.type = '';
    }
  }
};

// 🔥 Рекурсивная загрузка всех потомков
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

// 🔥 Загружаем дерево для выбора родителя
const loadTreeData = async () => {
  try {
    const parentIdFromQuery = route.query.parentId as string;
    if (parentIdFromQuery) {
      const response = await containerApi.getContainerById(parentIdFromQuery);
      const root = {
        id: response.data.id,
        name: response.data.name,
        type: response.data.type,
        children: [],
      };
      const fullRoot = await loadFullTree(root);
      treeData.value = [fullRoot];
    } else {
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
    }
  } catch (err) {
    console.error('Failed to load tree data', err);
  }
};

const loadFormData = async () => {
  try {
    await loadTreeData();

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
      parentId: form.value.parentId,
      accessLevel: form.value.accessLevel as Container['accessLevel'],
      groupId: form.value.accessLevel !== 'PRIVATE' ? form.value.groupId : undefined,
      latitude: form.value.coordinates?.latitude || null,
      longitude: form.value.coordinates?.longitude || null,
    };

    await containerApi.createContainer(payload);

    if (form.value.parentId) {
      router.push(`/containers/${form.value.parentId}`);
    } else {
      router.push('/containers');
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка создания контейнера';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  if (form.value.parentId) {
    router.push(`/containers/${form.value.parentId}`);
  } else {
    router.push('/containers');
  }
};

watch(
    () => route.query.parentId,
    () => {
      loadTreeData();
    }
);

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

.parent-select option {
  padding: 4px 8px;
  font-size: 14px;
}

.parent-select option.is-child {
  background-color: #f9f9f9;
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