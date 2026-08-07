<template>
  <div class="register-container">
    <h2>Регистрация в HomeStorage</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label>Полное имя</label>
        <input
          v-model="fullName"
          type="text"
          required
          placeholder="Иван Петров"
        />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="test@example.com"
        />
      </div>
      <div class="form-group">
        <label>Пароль</label>
        <input
          v-model="password"
          type="password"
          required
          placeholder="Минимум 6 символов"
        />
      </div>
      <div class="form-group">
        <label>Подтверждение пароля</label>
        <input
          v-model="confirmPassword"
          type="password"
          required
          placeholder="Повторите пароль"
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
      <p class="login-link">
        Уже есть аккаунт? <a href="/login">Войти</a>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api/authApi';

const router = useRouter();
const fullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const handleRegister = async () => {
  // Проверка на заполненность полей
  if (!fullName.value || !email.value || !password.value) {
    error.value = 'Все поля обязательны для заполнения';
    return;
  }

  // Проверка совпадения паролей
  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают';
    return;
  }

  // Проверка длины пароля
  if (password.value.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await authApi.register({
      email: email.value,
      password: password.value,
      fullName: fullName.value,
    });

    // Сохраняем токены
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);

    // Перенаправляем на страницу с местами хранения
    router.push('/containers');
  } catch (err: any) {
    // Обработка ошибок от сервера
    if (err.response?.data?.message) {
      error.value = err.response.data.message;
    } else if (err.response?.status === 409) {
      error.value = 'Пользователь с таким email уже существует';
    } else {
      error.value = 'Ошибка регистрации. Попробуйте позже.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  background: white;
}

h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #1976d2;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

button {
  width: 100%;
  padding: 12px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 10px;
}

button:hover:not(:disabled) {
  background: #1565c0;
}

button:disabled {
  background: #aaa;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}

.login-link {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #1976d2;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>