import apiClient from './client';

export interface Container {
    id: string;
    name: string;
    description?: string;
    type: 'BUILDING' | 'ROOM' | 'FURNITURE' | 'SHELF' | 'BOX' | 'DRAWER';
    parentId?: string | null;
    accessLevel: 'PRIVATE' | 'GROUP_READ' | 'GROUP_WRITE';
    createdAt: string;
}

export const containerApi = {
    getRootContainers: () =>
        apiClient.get<Container[]>('/containers'),
};