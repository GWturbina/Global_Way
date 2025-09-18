class AdminController {
    constructor(app) {
        this.app = app;
        this.contractManager = app.getContractManager();
        this.errorHandler = app.getErrorHandler();
        this.i18n = app.getI18n();
        
        this.currentAnalyticsTab = 'daily';
        this.systemStats = {};
        this.usersData = [];
        this.logsData = [];
        
        this.init();
    }
    
    init() {
        // Check admin access
        if (!this.hasAdminAccess()) {
            this.errorHandler.showError('Доступ запрещен');
            this.app.navigateToPage('dashboard');
            return;
        }
        
        this.setupEventListeners();
        this.loadAdminData();
        console.log('Admin Controller initialized');
    }
    
    hasAdminAccess() {
        const currentUser = this.app.getCurrentUser();
        if (!currentUser) return false;
        
        const adminAddresses = [
            '0x7261b8aeaee2f806f64001596a67d68f2055acd2',
            '0x03284a899147f5a07f82c622f34df92198671635',
            '0x9b49bd9c9458615e11c051afd1ebe983563b67ee',
            '0xc2b58114cbc873cf360f7a673e4d8ee25d1431e7'
        ];
        
        return adminAddresses.includes(currentUser.toLowerCase());
    }
    
    setupEventListeners() {
        // User management
        document.getElementById('search-user-btn')?.addEventListener('click', () => {
            this.searchUsers();
        });
        
        document.getElementById('admin-user-search')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUsers();
            }
        });
        
        // Token management
        document.getElementById('distribute-tokens-btn')?.addEventListener('click', () => {
            this.distributeTokens();
        });
        
        document.getElementById('enable-trading-btn')?.addEventListener('click', () => {
            this.enableTrading();
        });
        
        document.getElementById('disable-trading-btn')?.addEventListener('click', () => {
            this.disableTrading();
        });
        
        // Emergency functions
        document.getElementById('pause-contract-btn')?.addEventListener('click', () => {
            this.pauseContract();
        });
        
        document.getElementById('unpause-contract-btn')?.addEventListener('click', () => {
            this.unpauseContract();
        });
        
        // Logs management
        document.getElementById('refresh-logs-btn')?.addEventListener('click', () => {
            this.refreshLogs();
        });
        
        document.getElementById('export-logs-btn')?.addEventListener('click', () => {
            this.exportLogs();
        });
        
        document.getElementById('log-type')?.addEventListener('change', () => {
            this.filterLogs();
        });
        
        // Analytics tabs
        document.querySelectorAll('.analytics-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchAnalyticsTab(tabName);
            });
        });
    }
    
    async loadAdminData() {
        try {
            this.errorHandler.showLoading('Загрузка административных данных...');
            
            // Load system statistics
            await this.loadSystemStatistics();
            
            // Load users data
            await this.loadUsersData();
            
            // Load logs
            await this.loadSystemLogs();
            
            // Load analytics
            await this.loadAnalytics();
            
        } catch (error) {
            console.error('Failed to load admin data:', error);
            this.errorHandler.showError('Ошибка загрузки административных данных');
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async loadSystemStatistics() {
        try {
            if (this.contractManager) {
                // Load real data from contract
                const overview = await this.contractManager.getContractOverview();
                
                this.systemStats = {
                    totalUsers: overview?.totalUsers || 0,
                    activeUsers: overview?.activeUsers || 0,
                    totalVolume: overview?.totalVolume || 0,
                    circulatingTokens: overview?.circulatingTokens || 0
                };
            } else {
                // Demo data
                this.systemStats = {
                    totalUsers: Math.floor(Math.random() * 10000) + 1000,
                    activeUsers: Math.floor(Math.random() * 5000) + 500,
                    totalVolume: Math.random() * 10000,
                    circulatingTokens: Math.floor(Math.random() * 100000000)
                };
            }
            
            // Update UI
            document.getElementById('total-users').textContent = this.systemStats.totalUsers.toLocaleString();
            document.getElementById('active-users').textContent = this.systemStats.activeUsers.toLocaleString();
            document.getElementById('total-volume').textContent = `${this.systemStats.totalVolume.toFixed(2)} BNB`;
            document.getElementById('circulating-tokens').textContent = `${this.systemStats.circulatingTokens.toLocaleString()} GWT`;
            
        } catch (error) {
            console.error('Failed to load system statistics:', error);
        }
    }
    
    async loadUsersData() {
        try {
            // Generate demo users data
            this.usersData = this.generateDemoUsers();
            this.renderUsersTable(this.usersData);
            
        } catch (error) {
            console.error('Failed to load users data:', error);
        }
    }
    
    generateDemoUsers() {
        const users = [];
        const qualifications = ['Новичок', 'Бронза', 'Серебро', 'Золото', 'Платина'];
        
        for (let i = 0; i < 20; i++) {
            users.push({
                id: `U${(i + 1000000).toString().slice(-7)}`,
                address: `0x${Math.random().toString(16).substr(2, 40)}`,
                registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                maxLevel: Math.floor(Math.random() * 12) + 1,
                totalEarned: Math.random() * 10,
                activity: Math.random() > 0.3 ? 'active' : 'inactive',
                qualification: qualifications[Math.floor(Math.random() * qualifications.length)]
            });
        }
        
        return users.sort((a, b) => b.registrationDate - a.registrationDate);
    }
    
    renderUsersTable(users) {
        const tableBody = document.getElementById('admin-users-body');
        if (!tableBody) return;
        
        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr class="no-data">
                    <td colspan="7">Пользователи не найдены</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = users.map(user => `
            <tr class="admin-user-row">
                <td class="user-id">${user.id}</td>
                <td class="user-address">${this.formatAddress(user.address)}</td>
                <td class="registration-date">${user.registrationDate.toLocaleDateString()}</td>
                <td class="max-level">${user.maxLevel}</td>
                <td class="total-earned">${user.totalEarned.toFixed(4)} BNB</td>
                <td class="activity">
                    <span class="activity-badge ${user.activity}">${user.activity === 'active' ? 'Активен' : 'Неактивен'}</span>
                </td>
                <td class="actions">
                    <button class="action-btn-small primary" onclick="window.adminController.viewUserDetails('${user.address}')">
                        Подробнее
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    searchUsers() {
        const searchQuery = document.getElementById('admin-user-search')?.value?.trim().toLowerCase();
        
        if (!searchQuery) {
            this.renderUsersTable(this.usersData);
            return;
        }
        
        const filteredUsers = this.usersData.filter(user => 
            user.id.toLowerCase().includes(searchQuery) ||
            user.address.toLowerCase().includes(searchQuery)
        );
        
        this.renderUsersTable(filteredUsers);
        
        if (filteredUsers.length === 0) {
            this.errorHandler.showWarning('Пользователи не найдены');
        }
    }
    
    viewUserDetails(address) {
        const user = this.usersData.find(u => u.address === address);
        if (!user) return;
        
        // Simple alert for now - can be expanded to detailed modal
        alert(`
Детали пользователя:
ID: ${user.id}
Адрес: ${user.address}
Дата регистрации: ${user.registrationDate.toLocaleDateString()}
Максимальный уровень: ${user.maxLevel}
Всего заработано: ${user.totalEarned.toFixed(4)} BNB
Статус активности: ${user.activity === 'active' ? 'Активен' : 'Неактивен'}
Квалификация: ${user.qualification}
        `);
    }
    
    async distributeTokens() {
        const addressInput = document.getElementById('distribution-address');
        const amountInput = document.getElementById('distribution-amount');
        
        const address = addressInput?.value?.trim();
        const amount = parseFloat(amountInput?.value) || 0;
        
        if (!address || !this.isValidAddress(address)) {
            this.errorHandler.showError('Введите корректный адрес получателя');
            return;
        }
        
        if (amount <= 0) {
            this.errorHandler.showError('Введите корректное количество токенов');
            return;
        }
        
        const confirmed = confirm(`Распределить ${amount} GWT токенов на адрес ${address}?`);
        if (!confirmed) return;
        
        try {
            this.errorHandler.showLoading('Распределение токенов...');
            
            // Simulate token distribution
            await this.simulateAdminTransaction();
            
            this.errorHandler.showSuccess(`${amount} GWT токенов успешно отправлено на ${this.formatAddress(address)}`);
            
            // Clear form
            addressInput.value = '';
            amountInput.value = '';
            
            // Add to logs
            this.addLog('success', `Distributed ${amount} GWT to ${this.formatAddress(address)}`);
            
        } catch (error) {
            this.errorHandler.showError('Ошибка распределения токенов: ' + error.message);
            this.addLog('error', `Failed to distribute tokens: ${error.message}`);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async enableTrading() {
        const confirmed = confirm('Включить торговлю токенами?');
        if (!confirmed) return;
        
        try {
            this.errorHandler.showLoading('Включение торговли...');
            await this.simulateAdminTransaction();
            
            this.errorHandler.showSuccess('Торговля токенами включена');
            this.addLog('info', 'Token trading enabled');
            
        } catch (error) {
            this.errorHandler.showError('Ошибка включения торговли: ' + error.message);
            this.addLog('error', `Failed to enable trading: ${error.message}`);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async disableTrading() {
        const confirmed = confirm('Отключить торговлю токенами?');
        if (!confirmed) return;
        
        try {
            this.errorHandler.showLoading('Отключение торговли...');
            await this.simulateAdminTransaction();
            
            this.errorHandler.showSuccess('Торговля токенами отключена');
            this.addLog('warning', 'Token trading disabled');
            
        } catch (error) {
            this.errorHandler.showError('Ошибка отключения торговли: ' + error.message);
            this.addLog('error', `Failed to disable trading: ${error.message}`);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async pauseContract() {
        const confirmed = confirm('ВНИМАНИЕ! Это приостановит работу контракта. Продолжить?');
        if (!confirmed) return;
        
        const doubleConfirmed = confirm('Вы уверены? Это критическая операция!');
        if (!doubleConfirmed) return;
        
        try {
            this.errorHandler.showLoading('Приостановка контракта...');
            await this.simulateAdminTransaction();
            
            this.errorHandler.showWarning('Контракт приостановлен');
            this.addLog('warning', 'Contract paused by admin');
            
        } catch (error) {
            this.errorHandler.showError('Ошибка приостановки контракта: ' + error.message);
            this.addLog('error', `Failed to pause contract: ${error.message}`);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async unpauseContract() {
        const confirmed = confirm('Возобновить работу контракта?');
        if (!confirmed) return;
        
        try {
            this.errorHandler.showLoading('Возобновление контракта...');
            await this.simulateAdminTransaction();
            
            this.errorHandler.showSuccess('Контракт возобновлен');
            this.addLog('success', 'Contract unpaused by admin');
            
        } catch (error) {
            this.errorHandler.showError('Ошибка возобновления контракта: ' + error.message);
            this.addLog('error', `Failed to unpause contract: ${error.message}`);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    async loadSystemLogs() {
        // Generate demo logs
        this.logsData = this.generateDemoLogs();
        this.renderLogs(this.logsData);
    }
    
    generateDemoLogs() {
        const logTypes = ['info', 'success', 'warning', 'error'];
        const messages = [
            'User registered successfully',
            'Level purchased by user',
            'Token trading executed',
            'Quarterly activity payment received',
            'Matrix position filled',
            'System backup completed',
            'High gas price detected',
            'Connection timeout error',
            'Database optimization completed',
            'Security scan passed'
        ];
        
        const logs = [];
        for (let i = 0; i < 50; i++) {
            logs.push({
                id: i + 1,
                time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                type: logTypes[Math.floor(Math.random() * logTypes.length)],
                message: messages[Math.floor(Math.random() * messages.length)]
            });
        }
        
        return logs.sort((a, b) => b.time - a.time);
    }
    
    renderLogs(logs) {
        const logsContent = document.getElementById('logs-content');
        if (!logsContent) return;
        
        if (logs.length === 0) {
            logsContent.innerHTML = '<div class="no-logs">Логи не найдены</div>';
            return;
        }
        
        logsContent.innerHTML = logs.slice(0, 100).map(log => `
            <div class="log-entry">
                <span class="log-time">${log.time.toLocaleString()}</span>
                <span class="log-type ${log.type}">${log.type.toUpperCase()}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }
    
    addLog(type, message) {
        const newLog = {
            id: this.logsData.length + 1,
            time: new Date(),
            type: type,
            message: message
        };
        
        this.logsData.unshift(newLog);
        this.renderLogs(this.logsData);
    }
    
    refreshLogs() {
        this.errorHandler.showLoading('Обновление логов...');
        
        setTimeout(() => {
            this.loadSystemLogs();
            this.errorHandler.hideLoading();
            this.errorHandler.showSuccess('Логи обновлены');
        }, 1000);
    }
    
    filterLogs() {
        const logType = document.getElementById('log-type')?.value;
        
        if (logType === 'all') {
            this.renderLogs(this.logsData);
        } else {
            const filteredLogs = this.logsData.filter(log => log.type === logType);
            this.renderLogs(filteredLogs);
        }
    }
    
    exportLogs() {
        const logType = document.getElementById('log-type')?.value || 'all';
        const logsToExport = logType === 'all' ? this.logsData : 
            this.logsData.filter(log => log.type === logType);
        
        if (logsToExport.length === 0) {
            this.errorHandler.showWarning('Нет логов для экспорта');
            return;
        }
        
        const csvContent = this.generateLogsCSV(logsToExport);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        link.href = URL.createObjectURL(blob);
        link.download = `globalway_logs_${logType}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        this.errorHandler.showSuccess('Логи экспортированы успешно');
    }
    
    generateLogsCSV(logs) {
        const headers = ['Время', 'Тип', 'Сообщение'];
        const rows = logs.map(log => [
            log.time.toLocaleString(),
            log.type,
            log.message.replace(/,/g, ';') // Replace commas to avoid CSV conflicts
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    switchAnalyticsTab(tabName) {
        this.currentAnalyticsTab = tabName;
        
        // Update tab appearance
        document.querySelectorAll('.analytics-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Load analytics for selected period
        this.loadAnalytics();
    }
    
    async loadAnalytics() {
        try {
            // Generate demo analytics data
            const analyticsData = this.generateAnalyticsData(this.currentAnalyticsTab);
            
            // Update metrics
            document.getElementById('new-registrations').textContent = analyticsData.newRegistrations;
            document.getElementById('levels-purchased').textContent = analyticsData.levelsPurchased;
            document.getElementById('volume-generated').textContent = `${analyticsData.volumeGenerated.toFixed(2)} BNB`;
            document.getElementById('tokens-traded').textContent = `${analyticsData.tokensTraded.toFixed(0)} GWT`;
            
            // Update change indicators
            this.updateChangeIndicators(analyticsData);
            
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    }
    
    generateAnalyticsData(period) {
        const multiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
        
        return {
            newRegistrations: Math.floor(Math.random() * 50 * multiplier),
            levelsPurchased: Math.floor(Math.random() * 100 * multiplier),
            volumeGenerated: Math.random() * 1000 * multiplier,
            tokensTraded: Math.random() * 10000 * multiplier,
            changes: {
                registrations: (Math.random() - 0.5) * 100,
                levels: (Math.random() - 0.5) * 100,
                volume: (Math.random() - 0.5) * 100,
                tokens: (Math.random() - 0.5) * 100
            }
        };
    }
    
    updateChangeIndicators(data) {
        const indicators = [
            { id: 'new-registrations', change: data.changes.registrations },
            { id: 'levels-purchased', change: data.changes.levels },
            { id: 'volume-generated', change: data.changes.volume },
            { id: 'tokens-traded', change: data.changes.tokens }
        ];
        
        indicators.forEach(indicator => {
            const element = document.querySelector(`#${indicator.id}`).closest('.metric-item');
            const changeElement = element?.querySelector('.metric-change');
            
            if (changeElement) {
                const changeText = `${indicator.change > 0 ? '+' : ''}${indicator.change.toFixed(1)}%`;
                changeElement.textContent = changeText;
                
                changeElement.className = 'metric-change';
                if (indicator.change > 0) {
                    changeElement.classList.add('positive');
                } else if (indicator.change < 0) {
                    changeElement.classList.add('negative');
                } else {
                    changeElement.classList.add('neutral');
                }
            }
        });
    }
    
    // Utility methods
    async simulateAdminTransaction() {
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }
    
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    
    formatAddress(address) {
        if (!address) return '-';
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }
    
    // Update method called by main app
    async update() {
        if (!this.hasAdminAccess()) {
            this.app.navigateToPage('dashboard');
            return;
        }
        await this.loadAdminData();
    }
}

// Export for global use
window.AdminController = AdminController;

// Global function for user details (called from HTML)
window.adminController = null;
