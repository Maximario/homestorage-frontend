import apiClient from './client';
import type { Item, ItemRequest } from '@/types/item.types';

export const itemApi = {
    // Получить вещи по контейнеру
    getItemsByContainer: (containerId: string) =>
        apiClient.get<Item[]>(`/items/container/${containerId}`),

    // Получить вещь по ID
    getItemById: (id: string) =>
        apiClient.get<Item>(`/items/${id}`),

    // Создать вещь
    createItem: (data: ItemRequest) =>
        apiClient.post<Item>('/items', data),

    // Обновить вещь
    updateItem: (id: string, data: Partial<ItemRequest>) =>
        apiClient.put<Item>(`/items/${id}`, data),

    // Переместить вещь
    moveItem: (id: string, containerId: string) =>
        apiClient.patch<Item>(`/items/${id}/move`, { containerId }),

    // Удалить вещь
    deleteItem: (id: string) =>
        apiClient.delete(`/items/${id}`),

    // Загрузить фото
    uploadPhoto: (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<Item>(`/items/${id}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};