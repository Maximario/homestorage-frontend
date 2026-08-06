import {createRouter, createWebHistory} from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import ContainersView from '@/views/ContainersView.vue';

const routes = [
    { path: '/login', component: LoginView },
    { path: '/containers', component: ContainersView },
    { path: '/', redirect: '/containers' },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [],
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('accessToken');
    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.path === '/login' && token) {
        next('/containers');
    } else {
        next();
    }
});

export default router
