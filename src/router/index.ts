import {createRouter, createWebHistory} from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ContainerView from '@/views/ContainerView.vue';
import ContainersView from '@/views/ContainersView.vue';
import ContainerCreateView from '@/views/ContainerCreateView.vue';


const routes = [
    {path: '/login', component: LoginView},
    {path: '/register', component: RegisterView},
    {path: '/containers', component: ContainersView, meta: {requiresAuth: true}},
    {path: '/containers/create', name: 'ContainerCreate', component: ContainerCreateView, meta: {requiresAuth: true}},
    {
        path: '/containers/:id', name: 'ContainerView', component: ContainerView, meta: {requiresAuth: true},
    },
    {path: '/', redirect: '/containers'},
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('accessToken');

    console.log('🛡️ [Guard] Путь:', to.path);
    console.log('🛡️ [Guard] Токен есть?', !!token);
    console.log('🛡️ [Guard] requiresAuth?', to.meta.requiresAuth);

    // 🔥 ЯВНОЕ ИСКЛЮЧЕНИЕ ДЛЯ ПУБЛИЧНЫХ МАРШРУТОВ
    if (to.path === '/login' || to.path === '/register') {
        console.log('✅ [Guard] Публичный маршрут, пропускаем');
        next();
        return;
    }

    // 1️⃣ Если маршрут требует авторизации, а токена нет — на логин
    if (to.meta.requiresAuth && !token) {
        console.log('❌ [Guard] Нет токена, редирект на /login');
        next('/login');
        return;
    }

    // 2️⃣ Если пользователь уже залогинен и пытается зайти на /login или /register
    // (этот блок уже не нужен, потому что публичные маршруты обработаны выше)
    // if ((to.path === '/login' || to.path === '/register') && token) {
    //     console.log('✅ [Guard] Токен есть, редирект с /login или /register на /containers');
    //     next('/containers');
    //     return;
    // }

    // 3️⃣ В остальных случаях — пропускаем
    console.log('✅ [Guard] Пропускаем');
    next();
});

export default router;