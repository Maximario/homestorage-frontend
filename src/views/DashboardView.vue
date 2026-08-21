<template>
  <div class="dashboard">
    <h1>🏠 Панель управления</h1>

    <!-- Статистика -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📁</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalContainers }}</div>
          <div class="stat-label">Мест хранения</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalItems }}</div>
          <div class="stat-label">Всего вещей</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏢</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalBuildings }}</div>
          <div class="stat-label">Зданий</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activeReminders }}</div>
          <div class="stat-label">Активных напоминаний</div>
        </div>
      </div>
    </div>

    <div class="map-section">
      <h2>🏢 Места хранения на карте</h2>
      <MapView />
    </div>

    <!-- Напоминания -->
    <div class="reminders-section">
      <h2>⏰ Активные напоминания</h2>
      <div v-if="remindersLoading" class="loading">Загрузка напоминаний...</div>
      <div v-else-if="reminders.length === 0" class="empty">
        🎉 У вас нет активных напоминаний
      </div>
      <div v-else class="reminders-list">
        <div
            v-for="reminder in reminders"
            :key="reminder.id"
            class="reminder-card"
        >
          <div class="reminder-info">
            <div class="reminder-name">{{ reminder.name }}</div>
            <div class="reminder-meta">
              <span class="reminder-category">{{ translateCategory(reminder.category) }}</span>
              <span class="reminder-date">? {{ formatDate(reminder.reminderDate) }}</span>
            </div>
            <div v-if="reminder.reminderNote" class="reminder-note">
              📝 {{ reminder.reminderNote }}
            </div>
          </div>
          <div class="reminder-actions">
            <button class="btn-success" @click="completeReminder(reminder.id)">
              ✅ Выполнено
            </button>
            <router-link
                :to="`/items/${reminder.id}`"
                class="btn-secondary"
            >
              📋 Подробнее
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="quick-actions">
      <h2>⚡ Быстрые действия</h2>
      <div class="quick-actions-grid">
        <router-link to="/containers/create" class="quick-action">
          <span class="quick-icon">➕</span>
          <span>Создать место</span>
        </router-link>
        <router-link to="/containers" class="quick-action">
          <span class="quick-icon">📁</span>
          <span>Все места</span>
        </router-link>
        <router-link to="/items/reminders" class="quick-action">
          <span class="quick-icon">⏰</span>
          <span>Все напоминания</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { itemApi } from '@/api/itemApi';
import { containerApi } from '@/api/containerApi';
import MapView from '@/components/MapView.vue';
import type { Item } from '@/types/item.types';
import {translateCategory} from "@/utils/translations";

const router = useRouter();

const stats = ref({
  totalContainers: 0,
  totalItems: 0,
  totalBuildings: 0,
  activeReminders: 0,
});

const reminders = ref<Item[]>([]);
const remindersLoading = ref(true);

const formatDate = (date: string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const loadStats = async () => {
  try {
    // Загружаем корневые контейнеры
    const containersResp = await containerApi.getRootContainers();
    stats.value.totalContainers = containersResp.data.length;

    // Считаем здания
    stats.value.totalBuildings = containersResp.data.filter(
        c => c.type === 'BUILDING'
    ).length;

    // Загружаем все вещи (можно добавить эндпоинт для статистики)
    // Пока используем приблизительные значения
    // В будущем можно добавить отдельный эндпоинт /api/stats
    stats.value.totalItems = 0; // TODO: добавить подсчёт

    // Загружаем активные напоминания
    const remindersResp = await itemApi.getActiveReminders();
    reminders.value = remindersResp.data;
    stats.value.activeReminders = reminders.value.length;
  } catch (err) {
    console.error('Failed to load stats', err);
  }
};

const loadReminders = async () => {
  remindersLoading.value = true;
  try {
    const response = await itemApi.getActiveReminders();
    reminders.value = response.data;
  } catch (err) {
    console.error('Failed to load reminders', err);
  } finally {
    remindersLoading.value = false;
  }
};

const completeReminder = async (itemId: string) => {
  try {
    await itemApi.completeReminder(itemId);
    // Обновляем список напоминаний
    await loadReminders();
    // Обновляем статистику
    await loadStats();
  } catch (err) {
    console.error('Failed to complete reminder', err);
  }
};

onMounted(() => {
  loadStats();
  loadReminders();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard h1 {
  margin-bottom: 30px;
  color: #1976d2;
}

/* ---------- Статистика ---------- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1976d2;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* ---------- Напоминания ---------- */
.reminders-section {
  margin-bottom: 40px;
}

.reminders-section h2 {
  margin-bottom: 16px;
  color: #333;
}

.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  transition: box-shadow 0.2s;
}

.reminder-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.reminder-info {
  flex: 1;
  min-width: 200px;
}

.reminder-name {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.reminder-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #666;
  margin-top: 4px;
  flex-wrap: wrap;
}

.reminder-category {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0 8px;
  border-radius: 12px;
}

.reminder-date {
  color: #d32f2f;
}

.reminder-note {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.reminder-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reminder-actions .btn-success {
  padding: 6px 14px;
  font-size: 13px;
}

.reminder-actions .btn-secondary {
  padding: 6px 14px;
  font-size: 13px;
}

/* ---------- Быстрые действия ---------- */
.quick-actions h2 {
  margin-bottom: 16px;
  color: #333;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.quick-action {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  color: #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.quick-action:hover {
  border-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.quick-icon {
  font-size: 32px;
}

/* ---------- Пустые состояния ---------- */
.loading,
.empty {
  text-align: center;
  padding: 30px;
  color: #888;
}

.empty {
  font-size: 16px;
}

.map-section {
  margin-top: 40px;
}

.map-section h2 {
  margin-bottom: 16px;
  color: #333;
}
</style>