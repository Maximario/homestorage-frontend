import apiClient from './client';
import type { Item, ItemRequest } from '@/types/item.types';

export const itemApi = {
    // ----- ПОЛУЧЕНИЕ -----
    getItemsByContainer: (containerId: string) =>
        apiClient.get<Item[]>(`/items/container/${containerId}`),

    getItemById: (id: string) =>
        apiClient.get<Item>(`/items/${id}`),

    searchItems: (query: string) =>
        apiClient.get<Item[]>(`/items/search?query=${query}`),

    getActiveReminders: () =>
        apiClient.get<Item[]>('/items/reminders/active'),

    // ----- СОЗДАНИЕ / ОБНОВЛЕНИЕ / УДАЛЕНИЕ -----
    createItem: (data: ItemRequest) =>
        apiClient.post<Item>('/items', data),

    updateItem: (id: string, data: Partial<ItemRequest>) =>
        apiClient.put<Item>(`/items/${id}`, data),

    moveItem: (id: string, containerId: string) =>
        apiClient.patch<Item>(`/items/${id}/move`, { containerId }),

    deleteItem: (id: string) =>
        apiClient.delete(`/items/${id}`),

    // ----- ФОТО -----
    uploadPhoto: (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<Item>(`/items/${id}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    getPhoto: (id: string) =>
        apiClient.get(`/items/${id}/photo`, {
            responseType: 'blob',
        }),

    getPhotoThumbnail: (id: string) =>
        apiClient.get(`/items/${id}/photo/thumbnail`, {
            responseType: 'blob',
        }),

    deletePhoto: (id: string) =>
        apiClient.delete(`/items/${id}/photo`),

    // ----- НАПОМИНАНИЯ -----
    completeReminder: (id: string) =>
        apiClient.patch<Item>(`/items/${id}/reminder/complete`),
};