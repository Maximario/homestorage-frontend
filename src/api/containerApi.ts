import apiClient from './client';
import type { Container, ContainerRequest } from '@/types/container.types';

export const containerApi = {
    // ----- ПОЛУЧЕНИЕ КОНТЕЙНЕРОВ -----

    // Получить корневые контейнеры пользователя
    getRootContainers: () =>
        apiClient.get<Container[]>('/containers'),

    // Получить контейнер по ID
    getContainerById: (id: string) =>
        apiClient.get<Container>(`/containers/${id}`),

    // Получить дочерние контейнеры
    getChildContainers: (parentId: string) =>
        apiClient.get<Container[]>(`/containers/${parentId}/children`),

    // Получить полное дерево контейнеров (для TreeSelect)
    getContainerTree: (id: string) =>
        apiClient.get<ContainerTree>(`/containers/${id}/tree`),

    // Получить путь к контейнеру
    getContainerPath: (id: string) =>
        apiClient.get<string>(`/containers/${id}/path`),

    // Получить контейнеры, доступные для выбора в качестве родителя
    getAvailableForParent: () =>
        apiClient.get<Container[]>('/containers/available-for-parent'),

    // ----- СОЗДАНИЕ / ОБНОВЛЕНИЕ / УДАЛЕНИЕ -----

    // Создать контейнер
    createContainer: (data: ContainerRequest) =>
        apiClient.post<Container>('/containers', data),

    // Обновить контейнер
    updateContainer: (id: string, data: ContainerRequest) =>
        apiClient.put<Container>(`/containers/${id}`, data),

    // Переместить контейнер
    moveContainer: (id: string, newParentId: string | null) =>
        apiClient.patch<Container>(`/containers/${id}/move`, { parentId: newParentId }),

    // Удалить контейнер
    deleteContainer: (id: string) =>
        apiClient.delete(`/containers/${id}`),
};

// 🔥 Тип для дерева контейнеров
export interface ContainerTree {
    id: string;
    name: string;
    type: string;
    accessLevel: string;
    groupId: string | null;
    children: ContainerTree[];
    itemsCount: number;
    createdAt: string;
}