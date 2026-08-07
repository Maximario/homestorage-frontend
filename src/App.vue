<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
    const token = localStorage.getItem('accessToken');
    const currentPath = router.currentRoute.value.path;
    if (!token && currentPath !== '/login' && currentPath !== '/register') {
        router.push('/login');
    }
});
</script>

<style>
/* Ваши глобальные стили */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; }
#app { min-height: 100vh; }
</style>