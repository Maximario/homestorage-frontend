<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// Ничего не нужно, роутер сам подставит страницу
</script>

<style>
/* Ваши глобальные стили */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; }
#app { min-height: 100vh; }
</style>