class DashboardController {
    constructor(app) {
        this.app = app;
        this.web3Manager = app.getWeb3Manager();
        this.contractManager = app.getContractManager();
        this.userIdManager = app.getUserIdManager();
        this.errorHandler = app.getErrorHandler();
        this.i18n = app.getI18n();
        
        this.currentUser = null;
        this.userProfile = null;
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadUserData();
        
        console.log('Dashboard Controller initialized');
    }
    
    setupEventListeners() {
        // Copy buttons
        document.getElementById('copy-address-btn')?.addEventListener('click', () => {
            this.copyToClipboard(this.currentUser, 'Адрес скопирован');
        });
        
        document.getElementById('copy-id-btn')?.addEventListener('click', () => {
            const userId = document.getElementById('user-id').textContent;
            this.copyToClipboard(userId, 'ID скопирован');
        });
        
        document.getElementById('copy-link-btn')?.addEventListener('click', () => {
            const link = document.getElementById('referral-link').textContent;
            this.copyToClipboard(link, 'Ссылка скопирована');
        });
        
        // Activity payment
        document.getElementById('pay-activity-btn')?.addEventListener('click', () => {
            this.payQuarterlyActivity();
        });
        
        // Level buttons
        for (let i = 1; i <= 12; i++) {
            const btn = document.getElementById(`level-${i}-btn`);
            if (btn) {
                btn.addEventListener('click', () => this.buyLevel(i));
            }
        }
        
        // Package buttons
        [3, 4, 7, 10, 12].forEach(maxLevel => {
            const btn = document.getElementById(`bulk-${maxLevel}-btn`);
            if (btn) {
                btn.addEventListener('click', () => this.buyLevelsBulk(maxLevel));
            }
        });
        
        // Registration modal
        document.getElementById('register-btn')?.addEventListener('click', () => {
            this.registerUser();
        });
        
        // Modal close handlers
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
        
        // Navigation handlers
        this.setupNavigationHandlers();
    }
    
    setupNavigationHandlers() {
        document.querySelectorAll('.nav-item').forEach(navItem => {
            navItem.addEventListener('click', () => {
                const page = navItem.dataset.page;
                if (page && page !== 'dashboard') {
                    this.app.navigateToPage(page);
                }
            });
        });
    }
    
    async loadUserData() {
        try {
            this.currentUser = this.app.getCurrentUser();
            
            if (!this.currentUser) {
                this.showConnectWalletPrompt();
                return;
            }
            
            // Load user profile
            this.userProfile = this.app.getUserProfile();
            
            // Update UI with user data
            this.updateUserProfile();
            
            // Check if user is registered
            const isRegistered = await this.checkUserRegistration();
            
            if (!isRegistered) {
                this.showRegistrationModal();
            } else {
                // Load full user data from contracts
                await this.loadContractData();
            }
            
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.errorHandler.showError('Ошибка загрузки данных пользователя');
        }
    }
    
    updateUserProfile() {
        if (!this.currentUser) return;
        
        // Wallet address
        document.getElementById('wallet-address').textContent = 
            this.formatAddress(this.currentUser);
        
        // opBNB balance
        if (this.userProfile?.balance) {
            document.getElementById('opbnb-balance').textContent = 
                `${parseFloat(this.userProfile.balance).toFixed(4)} opBNB`;
        }
        
        // User ID
        if (this.userProfile?.userId) {
            document.getElementById('user-id').textContent = this.userProfile.userId;
            document.getElementById('referral-link').textContent = 
                this.userProfile.referralLink || '-';
        }
        
        // Show admin navigation if user has access
        if (this.hasAdminAccess()) {
            document.getElementById('admin-nav-item').style.display = 'flex';
        }
    }
    
    async checkUserRegistration() {
        if (!this.contractManager || !this.contractManager.isInitialized) {
            return false;
        }
        
        try {
            return await this.contractManager.isUserRegistered(this.currentUser);
        } catch (error) {
            console.error('Failed to check registration:', error);
            return false;
        }
    }
    
    async loadContractData() {
        if (!this.contractManager || !this.contractManager.isInitialized) {
            console.warn('Contract manager not initialized');
            return;
        }
        
        try {
            // Get user data from contract
            const userData = await this.contractManager.getUserData(this.currentUser);
            
            if (userData) {
                // Update activity status
                this.updateActivityStatus(userData);
                
                // Update levels status
                this.updateLevelsStatus(userData.activeLevels);
                
                // Update earnings
                this.updateEarnings(userData.totalEarned);
                
                // Load transaction history
                this.loadTransactionHistory();
                
                // Update token info
                this.updateTokenInfo();
            }
            
        } catch (error) {
            console.error('Failed to load contract data:', error);
            this.errorHandler.showError('Ошибка загрузки данных из блокчейна');
        }
    }
    
    updateActivityStatus(userData) {
        const statusEl = document.getElementById('activity-status');
        const btnEl = document.getElementById('pay-activity-btn');
        const lastActivityEl = document.getElementById('last-activity');
        const nextActivityEl = document.getElementById('next-activity');
        
        if (!statusEl || !btnEl) return;
        
        const now = Math.floor(Date.now() / 1000);
        const lastActivity = parseInt(userData.lastActivity);
        const daysSince = Math.floor((now - lastActivity) / 86400);
        
        if (daysSince >= 90) {
            statusEl.textContent = 'НЕАКТИВЕН';
            statusEl.className = 'status inactive';
            btnEl.disabled = false;
            btnEl.innerHTML = '<span class="btn-text">Оплатить активность (0.075 opBNB)</span>';
        } else {
            statusEl.textContent = 'АКТИВЕН';
            statusEl.className = 'status active';
            btnEl.disabled = true;
            btnEl.innerHTML = `<span class="btn-text">Следующая оплата через ${90 - daysSince} дней</span>`;
        }
        
        // Update activity dates
        if (lastActivityEl && lastActivity > 0) {
            lastActivityEl.textContent = new Date(lastActivity * 1000).toLocaleDateString();
        }
        
        if (nextActivityEl) {
            const nextActivity = new Date((lastActivity + 90 * 86400) * 1000);
            nextActivityEl.textContent = nextActivity.toLocaleDateString();
        }
    }
    
    updateLevelsStatus(activeLevels) {
        // Update individual level buttons
        for (let i = 1; i <= 12; i++) {
            const btn = document.getElementById(`level-${i}-btn`);
            if (btn) {
                const isActive = activeLevels.includes(i);
                
                if (isActive) {
                    btn.disabled = true;
                    btn.classList.add('active');
                    btn.innerHTML = `
                        <div class="level-number">${i}</div>
                        <div class="level-price">✓ Активен</div>
                    `;
                } else {
                    btn.disabled = false;
                    btn.classList.remove('active');
                    // Keep original price display
                }
            }
        }
        
        // Update package buttons
        this.updatePackageButtons(activeLevels);
    }
    
    async updatePackageButtons(activeLevels) {
        const packages = [
            {maxLevel: 3, btnId: 'bulk-3-btn'},
            {maxLevel: 4, btnId: 'bulk-4-btn'},
            {maxLevel: 7, btnId: 'bulk-7-btn'},
            {maxLevel: 10, btnId: 'bulk-10-btn'},
            {maxLevel: 12, btnId: 'bulk-12-btn'}
        ];
        
        for (const pkg of packages) {
            const btn = document.getElementById(pkg.btnId);
            if (!btn) continue;
            
            const neededLevels = [];
            for (let i = 1; i <= pkg.maxLevel; i++) {
                if (!activeLevels.includes(i)) {
                    neededLevels.push(i);
                }
            }
            
            const priceEl = btn.querySelector('.package-price');
            
            if (neededLevels.length === 0) {
                btn.disabled = true;
                priceEl.textContent = '✓ Все активны';
                btn.classList.add('active');
            } else {
                btn.disabled = false;
                btn.classList.remove('active');
                
                try {
                    if (this.contractManager) {
                        const price = await this.contractManager.calculateBulkPrice(this.currentUser, pkg.maxLevel);
                        priceEl.textContent = `${this.contractManager.formatEther(price)} opBNB`;
                    }
                } catch (error) {
                    priceEl.textContent = 'Расчет...';
                }
            }
        }
    }
    
    updateEarnings(totalEarned) {
        // Update total earnings
        const totalEl = document.getElementById('total-earnings');
        if (totalEl && this.contractManager) {
            totalEl.textContent = `${this.contractManager.formatEther(totalEarned)} BNB`;
        }
        
        // Update individual rank earnings (placeholder for now)
        for (let i = 1; i <= 12; i++) {
            const rankEarningsEl = document.getElementById(`rank-${i}-earnings`);
            if (rankEarningsEl) {
                rankEarningsEl.textContent = '0 BNB'; // Will be updated with real data
            }
        }
    }
    
    async updateTokenInfo() {
        if (!this.contractManager) return;
        
        try {
            const tokenBalance = await this.contractManager.getTokenBalance(this.currentUser);
            const tokenPrice = await this.contractManager.getTokenPrice();
            
            document.getElementById('token-balance').textContent = 
                `${this.contractManager.formatEther(tokenBalance)} GWT`;
            
            document.getElementById('token-price').textContent = 
                `${this.contractManager.formatEther(tokenPrice)} opBNB`;
            
            // Calculate total value
            const totalValue = parseFloat(this.contractManager.formatEther(tokenBalance)) * 
                              parseFloat(this.contractManager.formatEther(tokenPrice));
            
            document.getElementById('token-total-value').textContent = 
                `${totalValue.toFixed(6)} opBNB`;
                
        } catch (error) {
            console.error('Failed to update token info:', error);
        }
    }
    
    async loadTransactionHistory() {
        // Placeholder for transaction history
        const tableBody = document.getElementById('transactions-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr class="no-transactions">
                    <td colspan="5">История загружается...</td>
                </tr>
            `;
        }
    }
    
    showConnectWalletPrompt() {
        const connectPrompt = document.createElement('div');
        connectPrompt.className = 'connect-prompt';
        connectPrompt.innerHTML = `
            <div class="prompt-content">
                <h3>Подключите кошелек</h3>
                <p>Для использования GlobalWay необходимо подключить SafePal кошелек</p>
                <button id="connect-wallet-prompt-btn" class="action-btn primary">
                    Подключить SafePal
                </button>
            </div>
        `;
        
        document.querySelector('.dashboard-main').prepend(connectPrompt);
        
        document.getElementById('connect-wallet-prompt-btn').addEventListener('click', async () => {
            try {
                await this.app.connectWallet();
                connectPrompt.remove();
                this.loadUserData();
            } catch (error) {
                console.error('Failed to connect wallet:', error);
            }
        });
    }
    
    showRegistrationModal() {
        const modal = document.getElementById('registration-modal');
        const sponsorInput = document.getElementById('sponsor-address');
        
        // Try to get sponsor from referral
        const referralId = sessionStorage.getItem('referral_id');
        if (referralId) {
            const sponsorAddress = this.userIdManager.getSponsorByReferralId(referralId);
            if (sponsorAddress) {
                sponsorInput.value = sponsorAddress;
            }
        }
        
        modal.style.display = 'block';
    }
    
    async registerUser() {
        if (!this.contractManager) {
            this.errorHandler.showError('Контракты не инициализированы');
            return;
        }
        
        const sponsorInput = document.getElementById('sponsor-address');
        const sponsorAddress = sponsorInput.value.trim();
        
        if (!sponsorAddress || !this.contractManager.isAddress(sponsorAddress)) {
            this.errorHandler.showError('Введите корректный адрес спонсора');
            return;
        }
        
        try {
            this.errorHandler.showLoading('Регистрация пользователя...');
            
            const tx = await this.contractManager.registerUser(this.currentUser, sponsorAddress);
            
            this.errorHandler.showSuccess('Регистрация успешна!');
            document.getElementById('registration-modal').style.display = 'none';
            
            // Reload contract data
            setTimeout(() => {
                this.loadContractData();
            }, 2000);
            
        } catch (error) {
            console.error('Registration failed:', error);
            this.errorHandler.showError('Ошибка регистрации: ' + error.message);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async buyLevel(level) {
        if (!this.contractManager) {
            this.errorHandler.showError('Контракты не инициализированы');
            return;
        }
        
        try {
            this.errorHandler.showLoading(`Покупка уровня ${level}...`);
            
            const tx = await this.contractManager.buyLevel(this.currentUser, level);
            
            this.errorHandler.showSuccess(`Уровень ${level} успешно активирован!`);
            
            // Reload data
            setTimeout(() => {
                this.loadContractData();
            }, 2000);
            
        } catch (error) {
            console.error('Level purchase failed:', error);
            this.errorHandler.showError('Ошибка покупки уровня: ' + error.message);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async buyLevelsBulk(maxLevel) {
        if (!this.contractManager) {
            this.errorHandler.showError('Контракты не инициализированы');
            return;
        }
        
        try {
            // Calculate price first
            const totalPrice = await this.contractManager.calculateBulkPrice(this.currentUser, maxLevel);
            const priceInBNB = this.contractManager.formatEther(totalPrice);
            
            // Confirm with user
            const confirmed = confirm(`Купить уровни 1-${maxLevel} за ${priceInBNB} opBNB?`);
            if (!confirmed) return;
            
            this.errorHandler.showLoading(`Покупка уровней 1-${maxLevel}...`);
            
            const tx = await this.contractManager.buyLevelsBulk(this.currentUser, maxLevel);
            
            this.errorHandler.showSuccess(`Уровни 1-${maxLevel} успешно активированы!`);
            
            // Reload data
            setTimeout(() => {
                this.loadContractData();
            }, 2000);
            
        } catch (error) {
            console.error('Bulk level purchase failed:', error);
            this.errorHandler.showError('Ошибка пакетной покупки: ' + error.message);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async payQuarterlyActivity() {
        if (!this.contractManager) {
            this.errorHandler.showError('Контракты не инициализированы');
            return;
        }
        
        try {
            this.errorHandler.showLoading('Оплата квартальной активности...');
            
            const tx = await this.contractManager.payQuarterlyActivity(this.currentUser);
            
            this.errorHandler.showSuccess('Квартальная активность успешно оплачена!');
            
            // Reload data
            setTimeout(() => {
                this.loadContractData();
            }, 2000);
            
        } catch (error) {
            console.error('Quarterly activity payment failed:', error);
            this.errorHandler.showError('Ошибка оплаты активности: ' + error.message);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    // Utility methods
    formatAddress(address) {
        if (!address) return '-';
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }
    
    async copyToClipboard(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            this.errorHandler.showSuccess(successMessage);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.errorHandler.showError('Ошибка копирования');
        }
    }
    
    hasAdminAccess() {
        if (!this.currentUser) return false;
        
        const adminAddresses = [
            '0x7261b8aeaee2f806f64001596a67d68f2055acd2',
            '0x03284a899147f5a07f82c622f34df92198671635',
            '0x9b49bd9c9458615e11c051afd1ebe983563b67ee',
            '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'
        ];
        
        return adminAddresses.includes(this.currentUser.toLowerCase());
    }
    
    // Update method called by main app
    async update() {
        await this.loadUserData();
    }
}

// Export for global use
window.DashboardController = DashboardController;
