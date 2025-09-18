class UserIdManager {
    constructor() {
        this.storageKey = 'globalway_user_ids';
        this.mappingKey = 'globalway_address_id_mapping';
        this.usedIds = this.loadUsedIds();
        this.addressMapping = this.loadAddressMappings();
        
        this.init();
    }
    
    init() {
        // Слушаем изменения подключения кошелька
        document.addEventListener('accountChanged', (e) => {
            this.handleAccountChange(e.detail.account);
        });
        
        console.log('UserIdManager initialized');
    }
    
    loadUsedIds() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.error('Error loading used IDs:', error);
            return new Set();
        }
    }
    
    loadAddressMappings() {
        try {
            const stored = localStorage.getItem(this.mappingKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading address mappings:', error);
            return {};
        }
    }
    
    saveUsedIds() {
        try {
            const idsArray = Array.from(this.usedIds);
            localStorage.setItem(this.storageKey, JSON.stringify(idsArray));
        } catch (error) {
            console.error('Error saving used IDs:', error);
        }
    }
    
    saveAddressMappings() {
        try {
            localStorage.setItem(this.mappingKey, JSON.stringify(this.addressMapping));
        } catch (error) {
            console.error('Error saving address mappings:', error);
        }
    }
    
    generateUniqueId() {
        let id;
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            // Генерация 7-значного числа от 1000000 до 9999999
            id = Math.floor(Math.random() * 9000000) + 1000000;
            attempts++;
            
            if (attempts >= maxAttempts) {
                throw new Error('Failed to generate unique ID after maximum attempts');
            }
        } while (this.usedIds.has(id.toString()));
        
        const idString = id.toString();
        this.usedIds.add(idString);
        this.saveUsedIds();
        
        return idString;
    }
    
    async assignIdToUser(userAddress) {
        if (!userAddress) {
            throw new Error('User address is required');
        }
        
        const normalizedAddress = userAddress.toLowerCase();
        
        // Проверка, есть ли уже ID для этого адреса
        const existingId = this.addressMapping[normalizedAddress];
        if (existingId) {
            console.log(`Existing ID found for address ${userAddress}:`, existingId);
            return existingId;
        }
        
        // Генерация нового ID
        const newId = this.generateUniqueId();
        
        // Сохранение привязки
        this.addressMapping[normalizedAddress] = newId;
        this.saveAddressMappings();
        
        console.log(`New ID assigned to ${userAddress}:`, newId);
        
        // Попытка синхронизации с блокчейном (если контракт поддерживает)
        await this.syncWithBlockchain(userAddress, newId);
        
        return newId;
    }
    
    getUserId(userAddress) {
        if (!userAddress) return null;
        
        const normalizedAddress = userAddress.toLowerCase();
        return this.addressMapping[normalizedAddress] || null;
    }
    
    getUserByAddress(userAddress) {
        const userId = this.getUserId(userAddress);
        return userId ? {
            address: userAddress,
            id: userId,
            referralLink: this.generateReferralLink(userId)
        } : null;
    }
    
    generateReferralLink(userId) {
        const baseUrl = window.location.origin;
        return `${baseUrl}/ref${userId}`;
    }
    
    parseReferralLink(url = window.location.pathname) {
        const refMatch = url.match(/\/ref(\d{7})/);
        return refMatch ? refMatch[1] : null;
    }
    
    getSponsorByReferralId(referralId) {
        // Поиск адреса по ID
        for (const [address, id] of Object.entries(this.addressMapping)) {
            if (id === referralId) {
                return address;
            }
        }
        return null;
    }
    
    async syncWithBlockchain(userAddress, userId) {
        // Попытка записи ID в смарт-контракт (если поддерживается)
        try {
            if (window.contractManager && window.contractManager.globalWayContract) {
                // Здесь можно добавить вызов контракта для сохранения ID
                // Пока что только логируем
                console.log(`Attempting to sync ID ${userId} for address ${userAddress} with blockchain`);
            }
        } catch (error) {
            console.warn('Failed to sync with blockchain:', error);
            // Не критично, продолжаем работу с локальным хранением
        }
    }
    
    handleAccountChange(newAccount) {
        if (newAccount) {
            // Автоматически назначаем ID новому аккаунту
            this.assignIdToUser(newAccount).catch(error => {
                console.error('Failed to assign ID to new account:', error);
            });
        }
    }
    
    // Экспорт данных для резервного копирования
    exportData() {
        return {
            usedIds: Array.from(this.usedIds),
            addressMapping: this.addressMapping,
            timestamp: Date.now()
        };
    }
    
    // Импорт данных из резервной копии
    importData(data) {
        try {
            if (data.usedIds && Array.isArray(data.usedIds)) {
                this.usedIds = new Set(data.usedIds);
                this.saveUsedIds();
            }
            
            if (data.addressMapping && typeof data.addressMapping === 'object') {
                this.addressMapping = { ...this.addressMapping, ...data.addressMapping };
                this.saveAddressMappings();
            }
            
            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
    
    // Валидация ID
    isValidId(id) {
        return /^\d{7}$/.test(id) && parseInt(id) >= 1000000 && parseInt(id) <= 9999999;
    }
    
    // Статистика
    getStats() {
        return {
            totalIds: this.usedIds.size,
            totalMappings: Object.keys(this.addressMapping).length,
            availableIds: 9000000 - this.usedIds.size
        };
    }
    
    // Поиск пользователей
    searchUsers(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const [address, id] of Object.entries(this.addressMapping)) {
            if (address.includes(queryLower) || id.includes(query)) {
                results.push({
                    address: address,
                    id: id,
                    referralLink: this.generateReferralLink(id)
                });
            }
        }
        
        return results;
    }
    
    // Очистка устаревших данных
    cleanup() {
        try {
            // Можно добавить логику для очистки старых неиспользуемых ID
            // Пока что просто логируем статистику
            const stats = this.getStats();
            console.log('ID Manager stats:', stats);
            
            return stats;
        } catch (error) {
            console.error('Cleanup failed:', error);
            return null;
        }
    }
}

// Global instance
window.userIdManager = null;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.userIdManager = new UserIdManager();
});
