<template>
  <div class="location-picker">
    <div class="location-picker__map">
      <l-map
          ref="map"
          :zoom="zoom"
          :center="center"
          @click="onMapClick"
          class="location-map"
      >
        <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            layer-type="base"
            name="OpenStreetMap"
        />

        <l-marker
            v-if="markerPosition"
            :lat-lng="markerPosition"
            draggable
            @dragend="onMarkerDragEnd"
        />
      </l-map>
    </div>

    <div class="location-picker__controls">
      <div class="coord-inputs">
        <div class="coord-input">
          <label>Широта</label>
          <input
              type="number"
              step="any"
              :value="latitude"
              @input="onLatitudeChange($event)"
              placeholder="55.755825"
          />
        </div>
        <div class="coord-input">
          <label>Долгота</label>
          <input
              type="number"
              step="any"
              :value="longitude"
              @input="onLongitudeChange($event)"
              placeholder="37.617298"
          />
        </div>
      </div>
      <button class="btn-secondary" @click="getCurrentLocation">
        📍 Моё местоположение
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';

const props = defineProps<{
  modelValue: { latitude: number | null; longitude: number | null };
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { latitude: number | null; longitude: number | null }): void;
}>();

const zoom = ref(15);
const center = ref<[number, number]>([55.755825, 37.617298]);
const markerPosition = ref<[number, number] | null>(null);
const map = ref();

const latitude = ref<number | null>(props.modelValue?.latitude || null);
const longitude = ref<number | null>(props.modelValue?.longitude || null);

const updatePosition = (lat: number, lng: number) => {
  markerPosition.value = [lat, lng];
  latitude.value = lat;
  longitude.value = lng;
  center.value = [lat, lng];
  emit('update:modelValue', { latitude: lat, longitude: lng });
};

const onMapClick = (event: any) => {
  const { lat, lng } = event.latlng;
  updatePosition(lat, lng);
};

const onMarkerDragEnd = (event: any) => {
  const { lat, lng } = event.target.getLatLng();
  updatePosition(lat, lng);
};

const onLatitudeChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const val = parseFloat(input.value);
  if (!isNaN(val) && markerPosition.value) {
    markerPosition.value = [val, markerPosition.value[1]];
    emit('update:modelValue', { latitude: val, longitude: longitude.value });
  }
};

const onLongitudeChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const val = parseFloat(input.value);
  if (!isNaN(val) && markerPosition.value) {
    markerPosition.value = [markerPosition.value[0], val];
    emit('update:modelValue', { latitude: latitude.value, longitude: val });
  }
};

const getCurrentLocation = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
          updatePosition(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Не удалось определить местоположение. Проверьте настройки браузера.');
        }
    );
  } else {
    alert('Геолокация не поддерживается вашим браузером.');
  }
};

// Синхронизация с пропсами
watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal?.latitude && newVal?.longitude) {
        updatePosition(newVal.latitude, newVal.longitude);
      }
    },
    { deep: true }
);

onMounted(() => {
  if (props.modelValue?.latitude && props.modelValue?.longitude) {
    updatePosition(props.modelValue.latitude, props.modelValue.longitude);
  }
});
</script>

<style scoped>
.location-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-picker__map {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.location-map {
  width: 100%;
  height: 100%;
}

.location-picker__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.coord-inputs {
  display: flex;
  gap: 12px;
  flex: 1;
}

.coord-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.coord-input label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.coord-input input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
}

.coord-input input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.btn-secondary {
  padding: 6px 16px;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>