export interface Container {
    id: string;
    name: string;
    description?: string;
    type: ContainerType;
    parentId?: string | null;
    groupId?: string | null;
    accessLevel: 'PRIVATE' | 'GROUP_READ' | 'GROUP_WRITE';
    qrCode?: string;
    latitude?: number | null;
    longitude?: number | null;
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

export type ContainerType =
    | 'BUILDING'
    | 'APARTMENT'
    | 'ROOM'
    | 'FURNITURE'
    | 'SHELF'
    | 'BOX'
    | 'DRAWER';