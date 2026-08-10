import apiClient from './client';
import type { Container, ContainerRequest } from '@/types/container.types';

export const containerApi = {
    // Получить все контейнеры пользователя (для выбора родителя)
    getAvailableForParent: () =>
        apiClient.get<Container[]>('/containers/available-for-parent'),

    // Получить корневые места хранения
    getRootContainers: () =>
        apiClient.get<Container[]>('/containers'),

    // Создать место хранения
    createContainer: (data: ContainerRequest) =>
        apiClient.post<Container>('/containers', data),

    // Получить место хранения по ID
    getContainerById: (id: string) =>
        apiClient.get<Container>(`/containers/${id}`),

    // Получить дочерние места хранения
    getChildContainers: (parentId: string) =>
        apiClient.get<Container[]>(`/containers/${parentId}/children`),

    // Получить путь к месту хранения
    getContainerPath: (id: string) =>
        apiClient.get<string>(`/containers/${id}/path`),

    // Переместить место хранения
    moveContainer: (id: string, newParentId: string | null) =>
        apiClient.patch<Container>(`/containers/${id}/move`, { parentId: newParentId }),

    // Удалить место хранения
    deleteContainer: (id: string) =>
        apiClient.delete(`/containers/${id}`),
};