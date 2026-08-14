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

// 🛡️ Guard: проверяем, есть ли токен
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('accessToken');
    if (to.path === '/register') {
        next('/register');
    } else if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if ((to.path === '/login' || to.path === '/register') && token) {
        next('/containers');
    } else {
        next();
    }
});

export default router;