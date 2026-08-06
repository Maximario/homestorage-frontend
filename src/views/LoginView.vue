<template>
  <div class="login-container">
    <h2>Вход в HomeStorage</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" required placeholder="test@example.com" />
      </div>
      <div class="form-group">
        <label>Пароль</label>
        <input v-model="password" type="password" required placeholder="password123" />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Вход...' : 'Войти' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
      <p class="register-link">
        Нет аккаунта? <a href="/register">Зарегистрироваться</a>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api/authApi';

const router = useRouter();
const email = ref('test@example.com');
const password = ref('password123');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await authApi.login({
      email: email.value,
      password: password.value,
    });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    router.push('/containers');
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Ошибка входа. Проверьте логин и пароль.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 100px auto;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  background: white;
}
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}
button {
  width: 100%;
  padding: 12px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
button:disabled { background: #aaa; cursor: not-allowed; }
.error { color: red; margin-top: 10px; }
.register-link { margin-top: 15px; text-align: center; }
</style>