// utils/translations.ts
export const translateType = (type: string): string => {
    const map: Record<string, string> = {
        BUILDING: 'Здание',
        ROOM: 'Комната',
        FURNITURE: 'Мебель',
        SHELF: 'Полка',
        BOX: 'Коробка',
        DRAWER: 'Ящик',
    };
    return map[type] || type;
};

export const translateAccess = (access: string): string => {
    const map: Record<string, string> = {
        PRIVATE: 'Личное',
        GROUP_READ: 'Доступно для чтения',
        GROUP_WRITE: 'Доступно для редактирования',
    };
    return map[access] || access;
};