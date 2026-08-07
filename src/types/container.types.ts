export interface Container {
    id: string;
    name: string;
    description?: string;
    type: 'BUILDING' | 'ROOM' | 'FURNITURE' | 'SHELF' | 'BOX' | 'DRAWER';
    parentId?: string | null;
    groupId?: string | null;
    accessLevel: 'PRIVATE' | 'GROUP_READ' | 'GROUP_WRITE';
    qrCode?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContainerRequest {
    name: string;
    description?: string;
    type: Container['type'] | string; // string для выбора в форме
    parentId?: string | null;
    groupId?: string | null;
    accessLevel?: Container['accessLevel'];
}