class UserIdManager {
    constructor() {
        this.userIds = new Map();
        this.referralMapping = new Map();
        this.counter = this.loadCounter();
        
        console.log('UserIdManager initialized');
    }
    
    loadCounter() {
        const saved = localStorage.getItem('globalway_id_counter');
        return saved ? parseInt(saved) : 1000000;
    }
    
    saveCounter() {
        localStorage.setItem('globalway_id_counter', this.counter.toString());
    }
    
    generateUserId() {
        this.counter++;
        this.saveCounter();
        return this.counter.toString();
    }
    
    assignIdToUser(address) {
        if (this.userIds.has(address)) {
            return this.userIds.get(address);
        }
        
        const userId = this.generateUserId();
        this.userIds.set(address, userId);
        
        // Сохранение в localStorage
        const savedIds = JSON.parse(localStorage.getItem('globalway_user_ids') || '{}');
        savedIds[address] = userId;
        localStorage.setItem('globalway_user_ids', JSON.stringify(savedIds));
        
        return userId;
    }
    
    getUserId(address) {
        if (this.userIds.has(address)) {
            return this.userIds.get(address);
        }
        
        // Попытка загрузить из localStorage
        const savedIds = JSON.parse(localStorage.getItem('globalway_user_ids') || '{}');
        if (savedIds[address]) {
            this.userIds.set(address, savedIds[address]);
            return savedIds[address];
        }
        
        return null;
    }
    
    generateReferralLink(userId) {
        if (!userId) return null;
        
        const baseUrl = window.location.origin;
        return `${baseUrl}?ref=${userId}`;
    }
    
    parseReferralLink() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref');
    }
    
    getSponsorByReferralId(referralId) {
        // В реальном приложении здесь была бы база данных
        // Пока возвращаем null
        return null;
    }
}

// Экспорт для глобального использования
window.UserIdManager = UserIdManager;
window.userIdManager = new UserIdManager();
