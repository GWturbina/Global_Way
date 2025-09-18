// Web3 Integration for GlobalWay DApp
class SafePalIntegration {
    constructor() {
        this.provider = null;
        this.web3 = null;
        this.currentAccount = null;
        this.chainId = null;
        this.isConnected = false;
        
        // opBNB network configuration
        this.opBNBConfig = {
            chainId: '0xCC', // 204 in hex
            chainName: 'opBNB Mainnet',
            rpcUrls: ['https://opbnb-mainnet-rpc.bnbchain.org'],
            nativeCurrency: {
                name: 'opBNB',
                symbol: 'BNB',
                decimals: 18
            },
            blockExplorerUrls: ['https://opbnb.bscscan.com']
        };
        
        this.init();
    }
    
    init() {
        this.detectProvider();
        this.setupEventListeners();
        
        // Check if previously connected
        this.checkPreviousConnection();
    }
    
    detectProvider() {
        // КРИТИЧНО: SafePal ВСЕГДА приоритет над MetaMask
        if (typeof window.safePal !== 'undefined' && window.safePal.ethereum) {
            this.provider = window.safePal.ethereum;
            console.log('SafePal detected (Priority)');
        } else if (typeof window.ethereum !== 'undefined') {
            // Проверяем, что это не MetaMask в приоритете
            if (window.ethereum.isSafePal) {
                this.provider = window.ethereum;
                console.log('SafePal detected via ethereum provider');
            } else if (window.ethereum.providers) {
                // Ищем SafePal среди провайдеров
                const safePalProvider = window.ethereum.providers.find(p => p.isSafePal);
                if (safePalProvider) {
                    this.provider = safePalProvider;
                    console.log('SafePal found among providers');
                } else {
                    this.provider = window.ethereum;
                    console.warn('SafePal not found, using default provider');
                }
            } else {
                this.provider = window.ethereum;
                console.warn('SafePal not detected, using fallback provider');
            }
        } else {
            console.error('No Web3 provider detected');
            this.provider = null;
        }
        
        if (this.provider && typeof Web3 !== 'undefined') {
            this.web3 = new Web3(this.provider);
        }
    }
    
    async detectAndConnect() {
        try {
            // Проверка мобильного устройства
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile && !this.provider) {
                // Попытка открыть SafePal через deep link
                this.openSafePalApp();
                throw new Error('Please install SafePal wallet');
            }
            
            if (!this.provider) {
                throw new Error('SafePal wallet not detected. Please install SafePal.');
            }
            
            // Запрос подключения к кошельку
            const accounts = await this.provider.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }
            
            this.currentAccount = accounts[0];
            this.isConnected = true;
            
            // Проверка и переключение на opBNB сеть
            await this.ensureOpBNBNetwork();
            
            // Сохранение состояния подключения
            localStorage.setItem('wallet_connected', 'true');
            localStorage.setItem('wallet_provider', 'safepal');
            
            console.log('SafePal connected:', this.currentAccount);
            return this.currentAccount;
            
        } catch (error) {
            console.error('SafePal connection failed:', error);
            throw error;
        }
    }
    
    async ensureOpBNBNetwork() {
        try {
            const currentChainId = await this.provider.request({ method: 'eth_chainId' });
            
            if (currentChainId !== this.opBNBConfig.chainId) {
                try {
                    // Попытка переключиться на opBNB
                    await this.provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: this.opBNBConfig.chainId }]
                    });
                } catch (switchError) {
                    // Если сеть не добавлена, добавляем её
                    if (switchError.code === 4902) {
                        await this.provider.request({
                            method: 'wallet_addEthereumChain',
                            params: [this.opBNBConfig]
                        });
                    } else {
                        throw switchError;
                    }
                }
            }
            
            this.chainId = this.opBNBConfig.chainId;
            console.log('Connected to opBNB network');
            
        } catch (error) {
            console.error('Failed to switch to opBNB network:', error);
            throw new Error('Please switch to opBNB network in your wallet');
        }
    }
    
    setupEventListeners() {
        if (!this.provider) return;
        
        // Account changed
        this.provider.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.currentAccount = accounts[0];
                this.emitAccountChanged();
            }
        });
        
        // Chain changed
        this.provider.on('chainChanged', (chainId) => {
            this.chainId = chainId;
            this.emitChainChanged();
            
            // Проверка, что мы на opBNB
            if (chainId !== this.opBNBConfig.chainId) {
                console.warn('Wrong network detected. Please switch to opBNB.');
                this.showNetworkWarning();
            }
        });
        
        // Connection status
        this.provider.on('connect', (connectInfo) => {
            console.log('SafePal connected:', connectInfo);
        });
        
        this.provider.on('disconnect', (error) => {
            console.log('SafePal disconnected:', error);
            this.disconnect();
        });
    }
    
    async checkPreviousConnection() {
        const wasConnected = localStorage.getItem('wallet_connected') === 'true';
        const provider = localStorage.getItem('wallet_provider');
        
        if (wasConnected && provider === 'safepal' && this.provider) {
            try {
                const accounts = await this.provider.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.isConnected = true;
                    await this.ensureOpBNBNetwork();
                    console.log('Auto-connected to SafePal');
                    return true;
                }
            } catch (error) {
                console.log('Auto-connection failed:', error);
            }
        }
        
        return false;
    }
    
    disconnect() {
        this.currentAccount = null;
        this.isConnected = false;
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_provider');
        
        this.emitDisconnected();
        console.log('SafePal disconnected');
    }
    
    openSafePalApp() {
        // Deep link для открытия SafePal на мобильных
        const deepLink = 'safepal://';
        const downloadLink = 'https://safepal.com/download';
        
        // Попытка открыть приложение
        window.location.href = deepLink;
        
        // Fallback на страницу загрузки через 2 секунды
        setTimeout(() => {
            window.open(downloadLink, '_blank');
        }, 2000);
    }
    
    showNetworkWarning() {
        // Показать предупреждение о неправильной сети
        const warning = document.createElement('div');
        warning.className = 'network-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span>Please switch to opBNB network</span>
                <button class="switch-network-btn">Switch Network</button>
                <button class="close-warning-btn">&times;</button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Обработчики кнопок
        warning.querySelector('.switch-network-btn').addEventListener('click', () => {
            this.ensureOpBNBNetwork();
            warning.remove();
        });
        
        warning.querySelector('.close-warning-btn').addEventListener('click', () => {
            warning.remove();
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 10000);
    }
    
    // Event emitters
    emitAccountChanged() {
        const event = new CustomEvent('accountChanged', {
            detail: { account: this.currentAccount }
        });
        document.dispatchEvent(event);
    }
    
    emitChainChanged() {
        const event = new CustomEvent('chainChanged', {
            detail: { chainId: this.chainId }
        });
        document.dispatchEvent(event);
    }
    
    emitDisconnected() {
        const event = new CustomEvent('walletDisconnected', {
            detail: {}
        });
        document.dispatchEvent(event);
    }
    
    // Utility methods
    getCurrentAccount() {
        return this.currentAccount;
    }
    
    getProvider() {
        return this.provider;
    }
    
    getWeb3() {
        return this.web3;
    }
    
    isConnectedToOpBNB() {
        return this.chainId === this.opBNBConfig.chainId;
    }
    
    async getBalance(address = null) {
        if (!this.web3) return '0';
        
        try {
            const addr = address || this.currentAccount;
            if (!addr) return '0';
            
            const balance = await this.web3.eth.getBalance(addr);
            return this.web3.utils.fromWei(balance, 'ether');
        } catch (error) {
            console.error('Failed to get balance:', error);
            return '0';
        }
    }
    
    async signMessage(message) {
        if (!this.provider || !this.currentAccount) {
            throw new Error('Wallet not connected');
        }
        
        return await this.provider.request({
            method: 'personal_sign',
            params: [message, this.currentAccount]
        });
    }
}

// Export for global use
window.SafePalIntegration = SafePalIntegration;

// Global Web3 Manager instance
window.web3Manager = null;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.web3Manager = new SafePalIntegration();
});
