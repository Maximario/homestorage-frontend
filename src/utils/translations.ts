// utils/translations.ts
export const translateType = (type?: string) => {
    const map: Record<string, string> = {
        BUILDING: 'Здание',
        APARTMENT: 'Квартира, офис',
        ROOM: 'Комната',
        FURNITURE: 'Мебель',
        SHELF: 'Полка',
        BOX: 'Коробка',
        DRAWER: 'Ящик',
    };
    return type ? map[type] || type : '';
};

export const translateAccess = (access?: string) => {
    const map: Record<string, string> = {
        PRIVATE: 'Личное',
        GROUP_READ: 'Доступно для чтения',
        GROUP_WRITE: 'Доступно для редактирования',
    };
    return access ? map[access] || access : '';
};

export const translateCategory = (category?: string) => {
    const map: Record<string, string> = {
        CLOTHES: '👕 Одежда',
        TOOLS: '🔧 Инструменты',
        BOOKS: '📚 Книги',
        DOCUMENTS: '📄 Документы',
        ELECTRONICS: '💻 Электроника',
        FOOD: '🍎 Продукты',
        MEDICINES: '💊 Лекарства',
        SPORTS: '⚽ Спорт',
        OTHER: '📦 Другое',
    };
    return category ? map[category] || category : '';
};

export const getTypeIcon = (type?: string) => {
    const map: Record<string, string> = {
        BUILDING: '🏢',
        APARTMENT: '🏠',
        ROOM: '🚪',
        FURNITURE: '🪑',
        SHELF: '📚',
        BOX: '📦',
        DRAWER: '🗄️',
    };
    return type ? map[type] || '📁' : '📁';
};

export const getTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
        BUILDING: '🏢 Здание',
        APARTMENT: '🏠 Квартира',
        ROOM: '🚪 Комната',
        FURNITURE: '🪑 Мебель',
        SHELF: '📚 Полка',
        BOX: '📦 Коробка',
        DRAWER: '🗄️ Ящик',
    };
    return map[type] || type;
};

