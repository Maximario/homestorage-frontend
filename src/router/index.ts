import {createRouter, createWebHistory} from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ContainerView from '@/views/ContainerView.vue';
import ContainersView from '@/views/ContainersView.vue';
import ContainerCreateView from '@/views/ContainerCreateView.vue';
import ContainerEditView from '@/views/ContainerEditView.vue';


const routes = [
    {path: '/login', component: LoginView},
    {path: '/register', component: RegisterView},
    {path: '/containers', component: ContainersView, meta: {requiresAuth: true}},
    {path: '/containers/create', name: 'ContainerCreate', component: ContainerCreateView, meta: {requiresAuth: true}},
    {
        path: '/containers/:id', name: 'ContainerView', component: ContainerView, meta: {requiresAuth: true},
    },
    {
        path: '/containers/:id/edit',
        name: 'ContainerEdit',
        component: ContainerEditView,
        meta: { requiresAuth: true },
    },
    {path: '/', redirect: '/containers'},
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('accessToken');

    if (to.path === '/login' || to.path === '/register') {
        next();
        return;
    }

    if (to.meta.requiresAuth && !token) {
        next('/login');
        return;
    }

    next();
});

export default router;