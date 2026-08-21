<template>
  <div class="map-container">
    <div v-if="loading" class="map-loading">Загрузка карты...</div>
    <l-map
      v-else
      ref="mapRef"
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
      class="map"
      @ready="onMapReady"
    >
      <l-tile-layer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          layer-type="base"
          name="OpenStreetMap"
      />

      <!-- Маркеры -->
      <l-marker
          v-for="place in placesWithCoords"
          :key="place.id"
          :lat-lng="[place.latitude!, place.longitude!]"
          @click="onMarkerClick(place)"
      >
        <l-icon :icon-size="[32, 42]" :icon-anchor="[16, 42]">
          <div class="custom-marker" :style="{ backgroundColor: getMarkerColor(place.type) }">
            {{ getTypeIcon(place.type) }}
          </div>
        </l-icon>

        <l-popup>
          <div class="marker-popup">
            <h3>{{ place.name }}</h3>
            <p class="marker-type">{{ translateType(place.type) }}</p>
            <p v-if="place.description" class="marker-description">
              {{ place.description }}
            </p>
            <div class="marker-actions">
              <router-link :to="`/containers/${place.id}`" class="btn-primary">
                Открыть
              </router-link>
            </div>
          </div>
        </l-popup>
      </l-marker>
    </l-map>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon } from '@vue-leaflet/vue-leaflet';
import { containerApi } from '@/api/containerApi';
import type { Container } from '@/types/container.types';
import {getTypeIcon, translateType} from "@/utils/translations";
import 'leaflet/dist/leaflet.css';

const loading = ref(true);
const zoom = ref(12);
const center = ref<[number, number]>([55.755825, 37.617298]); // Москва по умолчанию
const places = ref<Container[]>([]);
const mapRef = ref<typeof LMap | null>(null);
const mapReady = ref(false);

// ? Только места с координатами
const placesWithCoords = computed(() => {
  return places.value.filter(p => p.latitude && p.longitude);
});

// ? Центр карты на основе координат
const mapCenter = computed(() => {
  if (placesWithCoords.value.length === 0) {
    return center.value;
  }
  // Усредняем координаты
  const avgLat = placesWithCoords.value.reduce((sum, p) => sum + p.latitude!, 0) / placesWithCoords.value.length;
  const avgLng = placesWithCoords.value.reduce((sum, p) => sum + p.longitude!, 0) / placesWithCoords.value.length;
  return [avgLat, avgLng] as [number, number];
});

const mapOptions = {
  zoomControl: true,
  attributionControl: true,
};

const getMarkerColor = (type: string) => {
  const map: Record<string, string> = {
    BUILDING: '#e74c3c',
    APARTMENT: '#f39c12',
    ROOM: '#2ecc71',
    FURNITURE: '#3498db',
    SHELF: '#9b59b6',
    BOX: '#1abc9c',
    DRAWER: '#e67e22',
  };
  return map[type] || '#95a5a6';
};

const loadPlaces = async () => {
  loading.value = true;
  try {
    const response = await containerApi.getContainersForMap();
    places.value = response.data;
  } catch (err) {
    console.error('Failed to load places for map', err);
  } finally {
    loading.value = false;
  }
};

// 🔥 Обновляем центр карты
const updateMapCenter = async () => {
  await nextTick();
  if (mapRef.value && mapRef.value.leafletObject) {
    const mapInstance = mapRef.value.leafletObject;
    mapInstance.setView(mapCenter.value, zoom.value);
  }
};

// 🔥 При готовности карты
const onMapReady = async () => {
  await nextTick();
  if (mapRef.value && mapRef.value.leafletObject) {
    const mapInstance = mapRef.value.leafletObject;
    mapInstance.setView(mapCenter.value, zoom.value);
    mapReady.value = true;
    console.info("Map instance ready")
  } else {
    console.warn('Map instance not ready');
  }
};

// 🔥 Следим за изменением мест и обновляем центр
watch(
  () => placesWithCoords.value.length,
  () => {
    if (mapReady.value) {
      updateMapCenter();
    }
  }
);

// 🔥 Следим за изменением mapCenter (для случаев, когда координаты изменились)
watch(
  mapCenter,
  (newCenter) => {
    if (mapReady.value && newCenter) {
      updateMapCenter();
    }
  },
  { deep: true }
);

const onMarkerClick = (place: Container) => {
  console.log('Clicked on:', place.name);
};

onMounted(() => {
  loadPlaces();
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e0e0e0;
}

.map {
  width: 100%;
  height: 100%;
}

.map-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
  font-size: 16px;
  background: #f9f9f9;
}

/* ? Кастомный маркер */
.custom-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
  cursor: pointer;
}

.custom-marker:hover {
  transform: scale(1.15);
}

/* ? Попап маркера */
.marker-popup {
  min-width: 150px;
  padding: 4px 0;
}

.marker-popup h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.marker-popup .marker-type {
  font-size: 13px;
  color: #666;
  margin: 0 0 4px 0;
}

.marker-popup .marker-description {
  font-size: 13px;
  color: #888;
  margin: 0 0 8px 0;
}

.marker-popup .marker-actions {
  margin-top: 8px;
}

.marker-popup .btn-primary {
  display: inline-block;
  padding: 4px 12px;
  background: #1976d2;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-size: 13px;
  transition: background 0.2s;
}

.marker-popup .btn-primary:hover {
  background: #1565c0;
}
</style>