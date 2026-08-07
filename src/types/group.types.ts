export interface Group {
    id: string;
    name: string;
    createdBy: string;
    createdAt: string;
}

export interface GroupMember {
    id: string;
    groupId: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    joinedAt: string;
}

export interface GroupRequest {
    name: string;
}