import apiClient from './client';
import type { Container, ContainerRequest } from '@/types/container.types';

export const containerApi = {
    // Получить корневые контейнеры
    getRootContainers: () =>
        apiClient.get<Container[]>('/containers'),

    // Создать контейнер
    createContainer: (data: ContainerRequest) =>
        apiClient.post<Container>('/containers', data),

    // Получить контейнер по ID
    getContainerById: (id: string) =>
        apiClient.get<Container>(`/containers/${id}`),

    // Получить дочерние контейнеры
    getChildContainers: (parentId: string) =>
        apiClient.get<Container[]>(`/containers/${parentId}/children`),

    // Получить путь к контейнеру
    getContainerPath: (id: string) =>
        apiClient.get<string>(`/containers/${id}/path`),

    // Переместить контейнер
    moveContainer: (id: string, newParentId: string | null) =>
        apiClient.patch<Container>(`/containers/${id}/move`, { parentId: newParentId }),

    // Удалить контейнер
    deleteContainer: (id: string) =>
        apiClient.delete(`/containers/${id}`),
};