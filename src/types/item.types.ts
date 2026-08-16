export interface Item {
    id: string;
    name: string;
    description?: string;
    category: 'CLOTHES' | 'TOOLS' | 'BOOKS' | 'DOCUMENTS' | 'ELECTRONICS' | 'FOOD' | 'MEDICINES' | 'SPORTS' | 'OTHER';
    containerId: string;
    quantity: number;
    photoUrl?: string;
    photoThumbnailUrl?: string;
    reminderDate?: string;
    reminderNote?: string;
    reminderCompleted?: boolean;
    reminderCompletedAt?: string;
    addedAt: string;
    updatedAt: string;
}

export interface ItemRequest {
    name: string;
    description?: string;
    category: Item['category'] | string;
    containerId: string;
    quantity?: number;
    reminderDate?: string;
    reminderNote?: string;
}