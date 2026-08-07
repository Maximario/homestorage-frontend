import apiClient from './client';
import type { Group, GroupMember, GroupRequest } from '@/types/group.types';

export const groupApi = {
    // Получить все группы пользователя
    getUserGroups: () =>
        apiClient.get<Group[]>('/groups'),

    // Получить группу по ID
    getGroupById: (id: string) =>
        apiClient.get<Group>(`/groups/${id}`),

    // Создать группу
    createGroup: (data: GroupRequest) =>
        apiClient.post<Group>('/groups', data),

    // Обновить группу
    updateGroup: (id: string, data: Partial<GroupRequest>) =>
        apiClient.put<Group>(`/groups/${id}`, data),

    // Удалить группу
    deleteGroup: (id: string) =>
        apiClient.delete(`/groups/${id}`),

    // Получить участников группы
    getGroupMembers: (groupId: string) =>
        apiClient.get<GroupMember[]>(`/groups/${groupId}/members`),

    // Добавить участника в группу
    addGroupMember: (groupId: string, email: string) =>
        apiClient.post<GroupMember>(`/groups/${groupId}/members`, { email }),

    // Удалить участника из группы
    removeGroupMember: (groupId: string, userId: string) =>
        apiClient.delete(`/groups/${groupId}/members/${userId}`),
};