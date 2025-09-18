class TokensController {
    constructor(app) {
        this.app = app;
        this.contractManager = app.getContractManager();
        this.errorHandler = app.getErrorHandler();
        this.i18n = app.getI18n();
        
        this.currentTab = 'buy';
        this.tokenBalance = 0;
        this.tokenPrice = 0.001;
        this.tradingEnabled = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTokenData();
        console.log('Tokens Controller initialized');
    }
    
    setupEventListeners() {
        // Trading tabs
        document.querySelectorAll('.trading-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Balance actions
        document.getElementById('add-token-btn')?.addEventListener('click', () => {
            this.addTokenToWallet();
        });
        
        document.getElementById('refresh-balance-btn')?.addEventListener('click', () => {
            this.refreshBalance();
        });
        
        // Buy tab
        document.getElementById('calculate-buy-btn')?.addEventListener('click', () => {
            this.calculateBuyPrice();
        });
        
        document.getElementById('buy-tokens-btn')?.addEventListener('click', () => {
            this.buyTokens();
        });
        
        // Sell tab
        document.getElementById('max-sell-btn')?.addEventListener('click', () => {
            this.setMaxSellAmount();
        });
        
        document.getElementById('calculate-sell-btn')?.addEventListener('click', () => {
            this.calculateSellPrice();
        });
        
        document.getElementById('sell-tokens-btn')?.addEventListener('click', () => {
            this.sellTokens();
        });
        
        // Amount inputs
        document.getElementById('buy-amount')?.addEventListener('input', () => {
            this.calculateBuyPrice();
        });
        
        document.getElementById('sell-amount')?.addEventListener('input', () => {
            this.calculateSellPrice();
        });
        
        // Contract actions
        document.getElementById('view-explorer-btn')?.addEventListener('click', () => {
            this.viewOnExplorer();
        });
        
        document.getElementById('add-to-wallet-btn')?.addEventListener('click', () => {
            this.addTokenToWallet();
        });
        
        // History filters
        document.getElementById('history-type')?.addEventListener('change', () => {
            this.filterHistory();
        });
        
        document.getElementById('history-period')?.addEventListener('change', () => {
            this.filterHistory();
        });
        
        // Modal handlers
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
        
        // Copy buttons
        document.querySelectorAll('[data-copy]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.copyToClipboard(e.currentTarget.dataset.copy);
            });
        });
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab appearance
        document.querySelectorAll('.trading-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.trading-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Clear calculations
        this.clearCalculations();
    }
    
    async loadTokenData() {
        try {
            this.errorHandler.showLoading('Загрузка данных токенов...');
            
            if (this.contractManager && this.app.getCurrentUser()) {
                // Load real data from contract
                await this.loadContractTokenData();
            } else {
                // Load demo data
                this.loadDemoTokenData();
            }
            
            // Update UI
            this.updateTokenDisplay();
            this.updateTokenStatistics();
            this.loadTokenHistory();
            
        } catch (error) {
            console.error('Failed to load token data:', error);
            this.errorHandler.showError('Ошибка загрузки токенов');
            this.loadDemoTokenData();
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async loadContractTokenData() {
        const userAddress = this.app.getCurrentUser();
        
        // Get token balance
        const balance = await this.contractManager.getTokenBalance(userAddress);
        this.tokenBalance = parseFloat(this.contractManager.formatEther(balance));
        
        // Get token price
        const price = await this.contractManager.getTokenPrice();
        this.tokenPrice = parseFloat(this.contractManager.formatEther(price));
        
        // Check trading status
        this.tradingEnabled = await this.contractManager.isTradingEnabled();
    }
    
    loadDemoTokenData() {
        // Demo data when contracts are not available
        this.tokenBalance = Math.random() * 1000;
        this.tokenPrice = 0.001 + Math.random() * 0.009;
        this.tradingEnabled = true;
    }
    
    updateTokenDisplay() {
        // Update balance display
        document.getElementById('token-balance-display').textContent = 
            this.tokenBalance.toFixed(6);
        
        document.getElementById('token-value-display').textContent = 
            (this.tokenBalance * this.tokenPrice).toFixed(6);
        
        // Update price display
        document.getElementById('current-token-price').textContent = 
            this.tokenPrice.toFixed(6);
        
        // Update trading status
        const statusEl = document.getElementById('trading-status');
        if (statusEl) {
            statusEl.textContent = this.tradingEnabled ? 'Активна' : 'Отключена';
            statusEl.className = `status-value ${this.tradingEnabled ? 'active' : 'inactive'}`;
        }
        
        // Update button states
        this.updateButtonStates();
    }
    
    updateButtonStates() {
        const buyBtn = document.getElementById('buy-tokens-btn');
        const sellBtn = document.getElementById('sell-tokens-btn');
        
        if (buyBtn) {
            buyBtn.disabled = !this.tradingEnabled || this.tokenPrice < 0.01; // 0.01¢ minimum
        }
        
        if (sellBtn) {
            sellBtn.disabled = !this.tradingEnabled || this.tokenBalance === 0;
        }
        
        // Update max sell button
        const maxSellBtn = document.getElementById('max-sell-btn');
        if (maxSellBtn) {
            maxSellBtn.disabled = this.tokenBalance === 0;
        }
    }
    
    calculateBuyPrice() {
        const amountInput = document.getElementById('buy-amount');
        const amount = parseFloat(amountInput.value) || 0;
        
        if (amount <= 0) {
            this.clearBuyCalculations();
            return;
        }
        
        const basePrice = amount * this.tokenPrice;
        const commission = basePrice * 0.1; // 10% commission
        const gasReserve = 0.0001; // Gas reserve
        const total = basePrice + commission + gasReserve;
        
        document.getElementById('buy-price').textContent = `${basePrice.toFixed(6)} opBNB`;
        document.getElementById('buy-commission').textContent = `${commission.toFixed(6)} opBNB`;
        document.getElementById('buy-total').textContent = `${total.toFixed(6)} opBNB`;
        
        // Enable buy button if amount is valid
        const buyBtn = document.getElementById('buy-tokens-btn');
        if (buyBtn) {
            buyBtn.disabled = !this.tradingEnabled || amount <= 0;
        }
    }
    
    calculateSellPrice() {
        const amountInput = document.getElementById('sell-amount');
        const amount = parseFloat(amountInput.value) || 0;
        
        if (amount <= 0 || amount > this.tokenBalance) {
            this.clearSellCalculations();
            return;
        }
        
        const basePrice = amount * this.tokenPrice;
        const commission = basePrice * 0.1; // 10% commission
        const gasReserve = 0.0001; // Gas reserve
        const total = Math.max(0, basePrice - commission - gasReserve);
        
        document.getElementById('sell-price').textContent = `${basePrice.toFixed(6)} opBNB`;
        document.getElementById('sell-commission').textContent = `${commission.toFixed(6)} opBNB`;
        document.getElementById('sell-total').textContent = `${total.toFixed(6)} opBNB`;
        
        // Enable sell button if amount is valid
        const sellBtn = document.getElementById('sell-tokens-btn');
        if (sellBtn) {
            sellBtn.disabled = !this.tradingEnabled || amount <= 0 || amount > this.tokenBalance;
        }
    }
    
    clearCalculations() {
        this.clearBuyCalculations();
        this.clearSellCalculations();
    }
    
    clearBuyCalculations() {
        document.getElementById('buy-price').textContent = '0 opBNB';
        document.getElementById('buy-commission').textContent = '0 opBNB';
        document.getElementById('buy-total').textContent = '0 opBNB';
        
        const buyBtn = document.getElementById('buy-tokens-btn');
        if (buyBtn) buyBtn.disabled = true;
    }
    
    clearSellCalculations() {
        document.getElementById('sell-price').textContent = '0 opBNB';
        document.getElementById('sell-commission').textContent = '0 opBNB';
        document.getElementById('sell-total').textContent = '0 opBNB';
        
        const sellBtn = document.getElementById('sell-tokens-btn');
        if (sellBtn) sellBtn.disabled = true;
    }
    
    setMaxSellAmount() {
        const sellAmountInput = document.getElementById('sell-amount');
        if (sellAmountInput) {
            sellAmountInput.value = this.tokenBalance.toFixed(6);
            this.calculateSellPrice();
        }
    }
    
    async buyTokens() {
        const amountInput = document.getElementById('buy-amount');
        const amount = parseFloat(amountInput.value);
        
        if (!amount || amount <= 0) {
            this.errorHandler.showError('Введите корректное количество токенов');
            return;
        }
        
        if (!this.tradingEnabled) {
            this.errorHandler.showError('Торговля токенами отключена');
            return;
        }
        
        try {
            this.errorHandler.showLoading('Покупка токенов...');
            
            if (this.contractManager) {
                const userAddress = this.app.getCurrentUser();
                const amountWei = this.contractManager.toWei(amount.toString());
                
                const tx = await this.contractManager.buyTokens(userAddress, amountWei);
                this.errorHandler.showSuccess('Токены успешно куплены!');
                
                // Refresh balance
                setTimeout(() => {
                    this.refreshBalance();
                }, 2000);
            } else {
                // Demo mode
                await this.simulateTransaction();
                this.tokenBalance += amount;
                this.updateTokenDisplay();
                this.errorHandler.showSuccess('Токены успешно куплены! (демо режим)');
            }
            
            // Clear form
            amountInput.value = '';
            this.clearBuyCalculations();
            
        } catch (error) {
            console.error('Failed to buy tokens:', error);
            this.errorHandler.showError('Ошибка покупки токенов: ' + error.message);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async sellTokens() {
        const amountInput = document.getElementById('sell-amount');
        const amount = parseFloat(amountInput.value);
        
        if (!amount || amount <= 0) {
            this.errorHandler.showError('Введите корректное количество токенов');
            return;
        }
        
        if (amount > this.tokenBalance) {
            this.errorHandler.showError('Недостаточно токенов для продажи');
            return;
        }
        
        if (!this.tradingEnabled) {
            this.errorHandler.showError('Торговля токенами отключена');
            return;
        }
        
        try {
            this.errorHandler.showLoading('Продажа токенов...');
            
            if (this.contractManager) {
                const userAddress = this.app.getCurrentUser();
                const amountWei = this.contractManager.toWei(amount.toString());
                
                const tx = await this.contractManager.sellTokens(userAddress, amountWei);
                this.errorHandler.showSuccess('Токены успешно проданы!');
                
                // Refresh balance
                setTimeout(() => {
                    this.refreshBalance();
                }, 2000);
            } else {
                // Demo mode
                await this.simulateTransaction();
                this.tokenBalance -= amount;
                this.updateTokenDisplay();
                this.errorHandler.showSuccess('Токены успешно проданы! (демо режим)');
            }
            
            // Clear form
            amountInput.value = '';
            this.clearSellCalculations();
            
        } catch (error) {
            console.error('Failed to sell tokens:', error);
            this.errorHandler.showError('Ошибка продажи токенов: ' + error.message);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async simulateTransaction() {
        // Simulate transaction delay
        return new Promise(resolve => {
            setTimeout(resolve, 1500);
        });
    }
    
    async refreshBalance() {
        try {
            this.errorHandler.showLoading('Обновление баланса...');
            await this.loadTokenData();
            this.errorHandler.showSuccess('Баланс обновлен');
        } catch (error) {
            this.errorHandler.showError('Ошибка обновления баланса');
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async addTokenToWallet() {
        try {
            const tokenAddress = '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc';
            const tokenSymbol = 'GWT';
            const tokenDecimals = 18;
            const tokenImage = 'https://globalway.club/assets/icons/gwt-token.png';

            if (window.ethereum) {
                await window.ethereum.request({
                    method: 'wallet_watchAsset',
                    params: {
                        type: 'ERC20',
                        options: {
                            address: tokenAddress,
                            symbol: tokenSymbol,
                            decimals: tokenDecimals,
                            image: tokenImage,
                        },
                    },
                });
                this.errorHandler.showSuccess('Токен добавлен в кошелек');
            } else {
                this.errorHandler.showError('Кошелек не найден');
            }
        } catch (error) {
            console.error('Failed to add token to wallet:', error);
            this.errorHandler.showError('Ошибка добавления токена в кошелек');
        }
    }
    
    viewOnExplorer() {
        const contractAddress = '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc';
        const explorerUrl = `https://opbnbscan.com/token/${contractAddress}`;
        window.open(explorerUrl, '_blank');
    }
    
    updateTokenStatistics() {
        // Update token statistics (demo data)
        const totalSupply = 1000000000;
        const circulatingSupply = Math.floor(Math.random() * totalSupply * 0.1);
        const burnedTokens = Math.floor(Math.random() * totalSupply * 0.01);
        const marketCap = circulatingSupply * this.tokenPrice * 300; // Approximate USD conversion
        const tradingVolume = Math.random() * 100;
        const holdersCount = Math.floor(Math.random() * 1000) + 100;
        
        document.getElementById('total-supply').textContent = `${totalSupply.toLocaleString()} GWT`;
        document.getElementById('circulating-supply').textContent = `${circulatingSupply.toLocaleString()} GWT`;
        document.getElementById('burned-tokens').textContent = `${burnedTokens.toLocaleString()} GWT`;
        document.getElementById('market-cap').textContent = `$${marketCap.toFixed(0)}`;
        document.getElementById('trading-volume').textContent = `${tradingVolume.toFixed(2)} opBNB`;
        document.getElementById('holders-count').textContent = holdersCount.toString();
    }
    
    loadTokenHistory() {
        const historyBody = document.getElementById('token-history-body');
        if (!historyBody) return;
        
        // Generate demo history data
        const historyData = this.generateDemoHistory();
        this.renderTokenHistory(historyData);
    }
    
    generateDemoHistory() {
        const types = ['received', 'purchased', 'sold'];
        const history = [];
        
        for (let i = 0; i < 10; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const amount = Math.random() * 100;
            const level = Math.floor(Math.random() * 12) + 1;
            const date = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            
            history.push({
                id: i + 1,
                date: date,
                type: type,
                level: type === 'received' ? level : null,
                amount: amount,
                status: 'completed'
            });
        }
        
        return history.sort((a, b) => b.date - a.date);
    }
    
    renderTokenHistory(historyData) {
        const historyBody = document.getElementById('token-history-body');
        if (!historyBody) return;
        
        if (historyData.length === 0) {
            historyBody.innerHTML = `
                <tr class="no-data">
                    <td colspan="5" data-i18n="noHistory">История пуста</td>
                </tr>
            `;
            return;
        }
        
        historyBody.innerHTML = historyData.map(item => `
            <tr class="history-row">
                <td class="history-date">${item.date.toLocaleDateString()}</td>
                <td class="history-type">
                    <span class="type-badge ${item.type}">${this.getTypeText(item.type)}</span>
                </td>
                <td class="history-level">${item.level || '-'}</td>
                <td class="history-amount">${item.amount.toFixed(3)} GWT</td>
                <td class="history-status">
                    <span class="status-badge ${item.status}">${this.getStatusText(item.status)}</span>
                </td>
            </tr>
        `).join('');
    }
    
    getTypeText(type) {
        const typeMap = {
            'received': 'Получено',
            'purchased': 'Куплено',
            'sold': 'Продано'
        };
        return typeMap[type] || type;
    }
    
    getStatusText(status) {
        const statusMap = {
            'completed': 'Завершено',
            'pending': 'В ожидании',
            'failed': 'Неудачно'
        };
        return statusMap[status] || status;
    }
    
    filterHistory() {
        const typeFilter = document.getElementById('history-type').value;
        const periodFilter = document.getElementById('history-period').value;
        
        // Apply filters and re-render history
        console.log('Filtering history:', typeFilter, periodFilter);
        // Implementation would filter the history data and re-render
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.errorHandler.showSuccess('Скопировано в буфер обмена');
        } catch (error) {
            this.errorHandler.showError('Ошибка копирования');
        }
    }
    
    // Update method called by main app
    async update() {
        await this.loadTokenData();
    }
}

// Export for global use
window.TokensController = TokensController;
