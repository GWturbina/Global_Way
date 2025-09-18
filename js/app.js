class GlobalWayApp {
    constructor() {
        // Основные компоненты
        this.web3Manager = null;
        this.contractManager = null;
        this.userIdManager = null;
        this.i18n = null;
        this.landingController = null;
        this.navigationController = null;
        
        // Состояние приложения
        this.currentUser = null;
        this.userProfile = null;
        this.isInitialized = false;
        this.currentPage = 'landing';
        
        // Обработка ошибок
        this.errorHandler = new ErrorHandler();
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing GlobalWay DApp...');
            
            // 1. Инициализация основных компонентов
            await this.initializeComponents();
            
            // 2. Проверка и обработка реферальной ссылки
            this.handleReferralLink();
            
            // 3. Настройка глобальных обработчиков событий
            this.setupGlobalEventListeners();
            
            // 4. Инициализация PWA
            this.initializePWA();
            
            // 5. Проверка сохраненного состояния
            await this.restoreSession();
            
            // 6. Запуск соответствующего контроллера
            await this.startAppropriateController();
            
            this.isInitialized = true;
            console.log('GlobalWay DApp initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize GlobalWay DApp:', error);
            this.errorHandler.showError('Ошибка инициализации приложения');
        }
    }
    
    async initializeComponents() {
        // Web3 и кошелек
        this.web3Manager = window.web3Manager || new SafePalIntegration();
        
        // Мультиязычность
        this.i18n = window.i18n;
        if (!this.i18n) {
            this.i18n = new I18nManager();
            await this.i18n.init();
        }
        
        // ID менеджер
        this.userIdManager = window.userIdManager || new UserIdManager();
        
        // Контракты (будут инициализированы позже)
        if (window.ContractManager) {
            this.contractManager = new ContractManager();
        }
        
        console.log('Core components initialized');
    }
    
    handleReferralLink() {
        const referralId = this.userIdManager.parseReferralLink();
        if (referralId) {
            sessionStorage.setItem('referral_id', referralId);
            console.log('Referral ID detected and saved:', referralId);
            
            // Очистка URL
            const cleanUrl = window.location.origin;
            window.history.replaceState({}, '', cleanUrl);
            
            // Показ уведомления о реферале
            this.showReferralWelcome(referralId);
        }
    }
    
    setupGlobalEventListeners() {
        // Изменение аккаунта кошелька
        document.addEventListener('accountChanged', (e) => {
            this.handleAccountChange(e.detail.account);
        });
        
        // Изменение сети
        document.addEventListener('chainChanged', (e) => {
            this.handleChainChange(e.detail.chainId);
        });
        
        // Отключение кошелька
        document.addEventListener('walletDisconnected', () => {
            this.handleWalletDisconnection();
        });
        
        // Изменение языка
        document.addEventListener('languageChanged', (e) => {
            this.handleLanguageChange(e.detail.language);
        });
        
        // Обработка ошибок соединения
        window.addEventListener('online', () => {
            this.handleConnectionRestore();
        });
        
        window.addEventListener('offline', () => {
            this.handleConnectionLoss();
        });
        
        // Управление видимостью страницы
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    initializePWA() {
        // Регистрация Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                    
                    // Проверка обновлений
                    registration.addEventListener('updatefound', () => {
                        this.handleServiceWorkerUpdate(registration);
                    });
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        }
        
        // Обработка установки PWA
        this.setupPWAInstallPrompt();
        
        // Настройка Background Sync (если поддерживается)
        this.setupBackgroundSync();
    }
    
    setupPWAInstallPrompt() {
        let deferredPrompt = null;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Показ кнопки установки
            this.showInstallButton(deferredPrompt);
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallButton();
            deferredPrompt = null;
        });
    }
    
    async restoreSession() {
        try {
            // Попытка автоподключения кошелька
            const wasConnected = localStorage.getItem('wallet_connected') === 'true';
            if (wasConnected && this.web3Manager) {
                const connected = await this.web3Manager.checkPreviousConnection();
                if (connected) {
                    this.currentUser = this.web3Manager.getCurrentAccount();
                    await this.loadUserProfile();
                    console.log('Session restored for:', this.currentUser);
                }
            }
            
            // Восстановление языка
            const savedLang = localStorage.getItem('globalway_language');
            if (savedLang && this.i18n && savedLang !== this.i18n.getCurrentLanguage()) {
                await this.i18n.switchLanguage(savedLang);
            }
            
        } catch (error) {
            console.warn('Failed to restore session:', error);
            // Не критично, продолжаем без восстановления
        }
    }
    
    async startAppropriateController() {
        const hash = window.location.hash.substring(1);
        
        if (hash && hash !== 'landing') {
            // Попытка перехода к конкретной странице
            await this.navigateToPage(hash);
        } else {
            // Запуск landing page
            this.startLanding();
        }
    }
    
    startLanding() {
        this.currentPage = 'landing';
        this.landingController = window.landingController || new LandingController();
        
        // Установка обработчика входа в DApp
        const openDappBtn = document.getElementById('open-dapp-btn');
        if (openDappBtn) {
            openDappBtn.addEventListener('click', () => {
                this.enterDashboard();
            });
        }
    }
    
    async enterDashboard() {
        try {
            // Попытка подключения кошелька
            if (!this.currentUser) {
                await this.connectWallet();
            }
            
            // Переход к dashboard
            await this.navigateToPage('dashboard');
            
        } catch (error) {
            console.error('Failed to enter dashboard:', error);
            this.errorHandler.showError('Не удалось войти в приложение');
        }
    }
    
    async connectWallet() {
        try {
            this.errorHandler.showLoading('Подключение кошелька...');
            
            const account = await this.web3Manager.detectAndConnect();
            if (account) {
                this.currentUser = account;
                
                // Получение или создание ID пользователя
                const userId = await this.userIdManager.assignIdToUser(account);
                
                // Загрузка профиля
                await this.loadUserProfile();
                
                this.errorHandler.showSuccess('Кошелек подключен успешно!');
                return account;
            } else {
                throw new Error('Не удалось получить аккаунт');
            }
        } catch (error) {
            this.errorHandler.showError('Ошибка подключения кошелька: ' + error.message);
            throw error;
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async loadUserProfile() {
        if (!this.currentUser) return null;
        
        try {
            // Базовые данные из кошелька
            const balance = await this.web3Manager.getBalance();
            const userId = this.userIdManager.getUserId(this.currentUser);
            
            this.userProfile = {
                address: this.currentUser,
                balance: balance,
                userId: userId,
                referralLink: userId ? this.userIdManager.generateReferralLink(userId) : null
            };
            
            // Если контракты доступны, загружаем данные из блокчейна
            if (this.contractManager) {
                const blockchainData = await this.contractManager.getUserData(this.currentUser);
                this.userProfile = { ...this.userProfile, ...blockchainData };
            }
            
            console.log('User profile loaded:', this.userProfile);
            return this.userProfile;
            
        } catch (error) {
            console.error('Failed to load user profile:', error);
            return null;
        }
    }
    
    async navigateToPage(page) {
        try {
            // Скрытие текущего контента
            this.hideCurrentPage();
            
            // Обновление URL
            window.history.pushState({ page }, '', `#${page}`);
            this.currentPage = page;
            
            // Загрузка и показ новой страницы
            await this.showPage(page);
            
            console.log('Navigated to:', page);
            
        } catch (error) {
            console.error('Navigation failed:', error);
            this.errorHandler.showError('Ошибка навигации');
        }
    }
    
    hideCurrentPage() {
        // Скрытие landing page
        const landingContainer = document.getElementById('landing-container');
        if (landingContainer) {
            landingContainer.style.display = 'none';
        }
        
        // Скрытие других страниц
        const pages = document.querySelectorAll('.page-content');
        pages.forEach(page => {
            page.style.display = 'none';
        });
    }
    
    async showPage(page) {
        if (page === 'landing') {
            const landingContainer = document.getElementById('landing-container');
            if (landingContainer) {
                landingContainer.style.display = 'flex';
            }
            return;
        }
        
        // Для других страниц будет загрузка HTML компонентов
        await this.loadPageComponent(page);
    }
    
    async loadPageComponent(page) {
        try {
            // Загрузка HTML компонента
            const response = await fetch(`components/${page}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load ${page} component`);
            }
            
            const html = await response.text();
            
            // Создание контейнера для страницы
            let pageContainer = document.getElementById(`${page}-page`);
            if (!pageContainer) {
                pageContainer = document.createElement('div');
                pageContainer.id = `${page}-page`;
                pageContainer.className = 'page-content';
                document.body.appendChild(pageContainer);
            }
            
            pageContainer.innerHTML = html;
            pageContainer.style.display = 'block';
            
            // Инициализация контроллера страницы
            await this.initializePageController(page);
            
        } catch (error) {
            console.error(`Failed to load ${page} page:`, error);
            this.errorHandler.showError(`Не удалось загрузить страницу ${page}`);
        }
    }
    
    async initializePageController(page) {
        switch (page) {
            case 'dashboard':
                if (window.DashboardController) {
                    this.dashboardController = new DashboardController(this);
                }
                break;
            case 'partners':
                if (window.PartnersController) {
                    this.partnersController = new PartnersController(this);
                }
                break;
            case 'matrix':
                if (window.MatrixController) {
                    this.matrixController = new MatrixController(this);
                }
                break;
            case 'tokens':
                if (window.TokenController) {
                    this.tokenController = new TokenController(this);
                }
                break;
            case 'projects':
                if (window.ProjectsController) {
                    this.projectsController = new ProjectsController(this);
                }
                break;
            case 'admin':
                if (window.AdminController && this.hasAdminAccess()) {
                    this.adminController = new AdminController(this);
                }
                break;
        }
    }
    
    // Event Handlers
    async handleAccountChange(newAccount) {
        console.log('Account changed to:', newAccount);
        
        if (newAccount !== this.currentUser) {
            this.currentUser = newAccount;
            
            if (newAccount) {
                await this.loadUserProfile();
                this.updateAllPages();
            } else {
                this.handleWalletDisconnection();
            }
        }
    }
    
    handleChainChange(chainId) {
        console.log('Chain changed to:', chainId);
        
        if (chainId !== '0xCC') { // opBNB chainId
            this.errorHandler.showError('Пожалуйста, переключитесь на сеть opBNB');
        }
    }
    
    handleWalletDisconnection() {
        console.log('Wallet disconnected');
        
        this.currentUser = null;
        this.userProfile = null;
        
        // Возврат на landing page
        this.navigateToPage('landing');
        
        this.errorHandler.showError('Кошелек отключен');
    }
    
    handleLanguageChange(language) {
        console.log('Language changed to:', language);
        
        // Обновление всех страниц с новыми переводами
        this.updateAllPages();
    }
    
    handleConnectionRestore() {
        console.log('Connection restored');
        this.errorHandler.showSuccess('Соединение восстановлено');
    }
    
    handleConnectionLoss() {
        console.log('Connection lost');
        this.errorHandler.showError('Соединение потеряно. Работаем в офлайн режиме.');
    }
    
    handleVisibilityChange() {
        if (document.hidden) {
            // Пауза анимаций для экономии батареи
            document.body.classList.add('page-hidden');
        } else {
            document.body.classList.remove('page-hidden');
        }
    }
    
    // Utility Methods
    updateAllPages() {
        // Обновление текущей активной страницы
        if (this.currentPage && this[`${this.currentPage}Controller`]) {
            const controller = this[`${this.currentPage}Controller`];
            if (controller.update) {
                controller.update();
            }
        }
    }
    
    hasAdminAccess() {
        if (!this.currentUser) return false;
        
        const adminAddresses = [
            '0x7261b8aeaee2f806f64001596a67d68f2055acd2', // Owner
            '0x03284a899147f5a07f82c622f34df92198671635', // F1
            '0x9b49bd9c9458615e11c051afd1ebe983563b67ee', // F2
            '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'  // F3
        ];
        
        return adminAddresses.includes(this.currentUser.toLowerCase());
    }
    
    showReferralWelcome(referralId) {
        const welcome = document.createElement('div');
        welcome.className = 'referral-welcome';
        welcome.innerHTML = `
            <div class="welcome-content">
                <h3>Добро пожаловать в GlobalWay!</h3>
                <p>Вас пригласил пользователь ${referralId}</p>
                <button class="welcome-close">Понятно</button>
            </div>
        `;
        
        document.body.appendChild(welcome);
        
        welcome.querySelector('.welcome-close').addEventListener('click', () => {
            welcome.remove();
        });
        
        setTimeout(() => {
            if (welcome.parentNode) {
                welcome.remove();
            }
        }, 5000);
    }
    
    showInstallButton(deferredPrompt) {
        // Реализация кнопки установки PWA
        console.log('PWA installation available');
    }
    
    hideInstallButton() {
        console.log('PWA installation completed');
    }
    
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            console.log('Background Sync supported');
            // Настройка Background Sync для офлайн операций
        }
    }
    
    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        if (newWorker) {
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Показ уведомления об обновлении
                    this.showUpdateAvailable();
                }
            });
        }
    }
    
    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>Доступно обновление приложения</span>
                <button class="update-btn">Обновить</button>
                <button class="update-dismiss">Позже</button>
            </div>
        `;
        
        document.body.appendChild(updateBanner);
        
        updateBanner.querySelector('.update-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        updateBanner.querySelector('.update-dismiss').addEventListener('click', () => {
            updateBanner.remove();
        });
    }
    
    // Публичные методы для контроллеров
    getCurrentUser() {
        return this.currentUser;
    }
    
    getUserProfile() {
        return this.userProfile;
    }
    
    getWeb3Manager() {
        return this.web3Manager;
    }
    
    getContractManager() {
        return this.contractManager;
    }
    
    getUserIdManager() {
        return this.userIdManager;
    }
    
    getI18n() {
        return this.i18n;
    }
    
    getErrorHandler() {
        return this.errorHandler;
    }
}

// Класс для обработки ошибок
class ErrorHandler {
    constructor() {
        this.createErrorContainers();
    }
    
    createErrorContainers() {
        // Контейнер для уведомлений
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Глобальный лоадер
        const loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'global-loader hidden';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loading-spinner"></div>
                <div id="loader-text" class="loader-text">Загрузка...</div>
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }
    
    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }
    
    showWarning(message, duration = 4000) {
        this.showNotification(message, 'warning', duration);
    }
    
    showNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        const container = document.getElementById('notification-container');
        container.appendChild(notification);
        
        // Auto-remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    showLoading(message = 'Загрузка...') {
        const loader = document.getElementById('global-loader');
        const loaderText = document.getElementById('loader-text');
        
        loaderText.textContent = message;
        loader.classList.remove('hidden');
    }
    
    hideLoading() {
        const loader = document.getElementById('global-loader');
        loader.classList.add('hidden');
    }
}

// Глобальная инициализация
window.globalWayApp = null;

document.addEventListener('DOMContentLoaded', () => {
    window.globalWayApp = new GlobalWayApp();
});
