class ContractManager {
    constructor() {
        // Адреса контрактов в opBNB сети
        this.addresses = {
            globalWay: '0x64De05a0c818a925711EA0874FD972Bdc2edb2aA',
            globalWayStats: '0xEa4F7F9e1c21Ad766B64D07dC9CB137C1b06Dfa4',
            gwtToken: '0x5Bf1b9edD3914f546AC02cf35CC285E640Cb68Fc'
        };
        
        this.contracts = {};
        this.web3 = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Получение Web3 instance
            if (window.globalWayApp && window.globalWayApp.getWeb3Manager()) {
                this.web3 = window.globalWayApp.getWeb3Manager().getWeb3();
            }
            
            if (!this.web3) {
                throw new Error('Web3 not available');
            }
            
            // Загрузка ABI файлов
            await this.loadContracts();
            
            this.isInitialized = true;
            console.log('Contract Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Contract Manager:', error);
            throw error;
        }
    }
    
    async loadContracts() {
        try {
            // Загрузка ABI файлов
            const [globalWayABI, globalWayStatsABI, gwtTokenABI] = await Promise.all([
                this.loadABI('GlobalWay'),
                this.loadABI('GlobalWayStats'),
                this.loadABI('GWTToken')
            ]);
            
            // Создание экземпляров контрактов
            this.contracts.globalWay = new this.web3.eth.Contract(
                globalWayABI, 
                this.addresses.globalWay
            );
            
            this.contracts.globalWayStats = new this.web3.eth.Contract(
                globalWayStatsABI, 
                this.addresses.globalWayStats
            );
            
            this.contracts.gwtToken = new this.web3.eth.Contract(
                gwtTokenABI, 
                this.addresses.gwtToken
            );
            
            console.log('Contracts loaded successfully');
            
        } catch (error) {
            console.error('Failed to load contracts:', error);
            throw error;
        }
    }
    
    async loadABI(contractName) {
        try {
            const response = await fetch(`contracts/${contractName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${contractName} ABI`);
            }
            
            const contractData = await response.json();
            return contractData.abi || contractData;
            
        } catch (error) {
            console.error(`Error loading ${contractName} ABI:`, error);
            throw error;
        }
    }
    
    // GlobalWay Contract Methods
    async isUserRegistered(userAddress) {
        try {
            return await this.contracts.globalWay.methods.isUserRegistered(userAddress).call();
        } catch (error) {
            console.error('Error checking user registration:', error);
            return false;
        }
    }
    
    async isUserActive(userAddress) {
        try {
            return await this.contracts.globalWay.methods.isUserActive(userAddress).call();
        } catch (error) {
            console.error('Error checking user activity:', error);
            return false;
        }
    }
    
    async isLevelActive(userAddress, level) {
        try {
            return await this.contracts.globalWay.methods.isLevelActive(userAddress, level).call();
        } catch (error) {
            console.error('Error checking level activity:', error);
            return false;
        }
    }
    
    async getUserData(userAddress) {
        try {
            const userData = await this.contracts.globalWay.methods.users(userAddress).call();
            
            // Получение активных уровней
            const activeLevels = [];
            for (let i = 1; i <= 12; i++) {
                const isActive = await this.isLevelActive(userAddress, i);
                if (isActive) activeLevels.push(i);
            }
            
            return {
                isRegistered: userData.isRegistered,
                sponsor: userData.sponsor,
                registrationTime: userData.registrationTime,
                lastActivity: userData.lastActivity,
                personalInvites: userData.personalInvites,
                totalEarned: userData.totalEarned,
                leaderRank: userData.leaderRank,
                quarterlyCounter: userData.quarterlyCounter,
                activeLevels: activeLevels
            };
            
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }
    
    async getLevelPrices() {
        try {
            const prices = {};
            for (let i = 1; i <= 12; i++) {
                prices[i] = await this.contracts.globalWay.methods.levelPrices(i).call();
            }
            return prices;
        } catch (error) {
            console.error('Error getting level prices:', error);
            return {};
        }
    }
    
    async getQuarterlyFee() {
        try {
            return await this.contracts.globalWay.methods.QUARTERLY_FEE().call();
        } catch (error) {
            console.error('Error getting quarterly fee:', error);
            return null;
        }
    }
    
    async calculateBulkPrice(userAddress, maxLevel) {
        try {
            return await this.contracts.globalWay.methods.calculateBulkPrice(maxLevel).call();
        } catch (error) {
            console.error('Error calculating bulk price:', error);
            return null;
        }
    }
    
    // Transaction Methods
    async registerUser(userAddress, sponsorAddress) {
        try {
            const gasEstimate = await this.contracts.globalWay.methods
                .register(sponsorAddress)
                .estimateGas({ from: userAddress });
            
            return await this.contracts.globalWay.methods
                .register(sponsorAddress)
                .send({ 
                    from: userAddress,
                    gas: Math.floor(gasEstimate * 1.2)
                });
                
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }
    
    async buyLevel(userAddress, level) {
        try {
            const price = await this.contracts.globalWay.methods.levelPrices(level).call();
            const gasEstimate = await this.contracts.globalWay.methods
                .buyLevel(level)
                .estimateGas({ from: userAddress, value: price });
            
            return await this.contracts.globalWay.methods
                .buyLevel(level)
                .send({ 
                    from: userAddress,
                    value: price,
                    gas: Math.floor(gasEstimate * 1.2)
                });
                
        } catch (error) {
            console.error('Error buying level:', error);
            throw error;
        }
    }
    
    async buyLevelsBulk(userAddress, maxLevel) {
        try {
            const price = await this.calculateBulkPrice(userAddress, maxLevel);
            const gasEstimate = await this.contracts.globalWay.methods
                .buyLevelsBulk(maxLevel)
                .estimateGas({ from: userAddress, value: price });
            
            return await this.contracts.globalWay.methods
                .buyLevelsBulk(maxLevel)
                .send({ 
                    from: userAddress,
                    value: price,
                    gas: Math.floor(gasEstimate * 1.2)
                });
                
        } catch (error) {
            console.error('Error buying levels bulk:', error);
            throw error;
        }
    }
    
    async payQuarterlyActivity(userAddress) {
        try {
            const fee = await this.getQuarterlyFee();
            const gasEstimate = await this.contracts.globalWay.methods
                .payQuarterlyActivity()
                .estimateGas({ from: userAddress, value: fee });
            
            return await this.contracts.globalWay.methods
                .payQuarterlyActivity()
                .send({ 
                    from: userAddress,
                    value: fee,
                    gas: Math.floor(gasEstimate * 1.2)
                });
                
        } catch (error) {
            console.error('Error paying quarterly activity:', error);
            throw error;
        }
    }
    
    // GWT Token Methods
    async getTokenBalance(userAddress) {
        try {
            return await this.contracts.gwtToken.methods.balanceOf(userAddress).call();
        } catch (error) {
            console.error('Error getting token balance:', error);
            return '0';
        }
    }
    
    async getTokenPrice() {
        try {
            return await this.contracts.gwtToken.methods.getCurrentPrice().call();
        } catch (error) {
            console.error('Error getting token price:', error);
            return '0';
        }
    }
    
    async isTradingEnabled() {
        try {
            return await this.contracts.gwtToken.methods.tradingEnabled().call();
        } catch (error) {
            console.error('Error checking trading status:', error);
            return false;
        }
    }
    
    async buyTokens(userAddress, tokenAmount) {
        try {
            const cost = await this.contracts.gwtToken.methods
                .calculatePurchaseCostWithCommission(tokenAmount)
                .call();
                
            const gasEstimate = await this.contracts.gwtToken.methods
                .buyTokens(tokenAmount)
                .estimateGas({ from: userAddress, value: cost });
            
            return await this.contracts.gwtToken.methods
                .buyTokens(tokenAmount)
                .send({ 
                    from: userAddress,
                    value: cost,
                    gas: Math.floor(gasEstimate * 1.2)
                });
                
        } catch (error) {
            console.error('Error buying tokens:', error);
            throw error;
        }
    }
    
    async sellTokens(userAddress, tokenAmount) {
        try {
            const gasEstimate = await this.contracts.gwtToken.methods
                .sellTokens(tokenAmount)
                .estimateGas({ from: userAddress });
            
            return await this.contracts.gwtToken.methods
                .sellTokens(tokenAmount)
                .send({ 
                    from: userAddress,
                    gas: Math.floor(gasEstimate * 1.2)
                });
                
        } catch (error) {
            console.error('Error selling tokens:', error);
            throw error;
        }
    }
    
    // GlobalWayStats Methods
    async getUserFullInfo(userAddress) {
        try {
            return await this.contracts.globalWayStats.methods.getUserFullInfo(userAddress).call();
        } catch (error) {
            console.error('Error getting user full info:', error);
            return null;
        }
    }
    
    async getMatrixStats(userAddress, level) {
        try {
            return await this.contracts.globalWayStats.methods.getMatrixStats(userAddress, level).call();
        } catch (error) {
            console.error('Error getting matrix stats:', error);
            return null;
        }
    }
    
    async getContractOverview() {
        try {
            return await this.contracts.globalWayStats.methods.getContractOverview().call();
        } catch (error) {
            console.error('Error getting contract overview:', error);
            return null;
        }
    }
    
    // Event Methods
    async getPastEvents(contractName, eventName, options = {}) {
        try {
            const contract = this.contracts[contractName];
            if (!contract) {
                throw new Error(`Contract ${contractName} not found`);
            }
            
            const defaultOptions = {
                fromBlock: 0,
                toBlock: 'latest'
            };
            
            const eventOptions = { ...defaultOptions, ...options };
            
            return await contract.getPastEvents(eventName, eventOptions);
            
        } catch (error) {
            console.error('Error getting past events:', error);
            return [];
        }
    }
    
    async getUserRegistrationEvents(userAddress) {
        return await this.getPastEvents('globalWay', 'UserRegistered', {
            filter: { user: userAddress }
        });
    }
    
    async getUserReferrals(userAddress) {
        return await this.getPastEvents('globalWay', 'UserRegistered', {
            filter: { sponsor: userAddress }
        });
    }
    
    // Utility Methods
    formatEther(value) {
        return this.web3.utils.fromWei(value.toString(), 'ether');
    }
    
    toWei(value) {
        return this.web3.utils.toWei(value.toString(), 'ether');
    }
    
    isAddress(address) {
        return this.web3.utils.isAddress(address);
    }
    
    getContract(contractName) {
        return this.contracts[contractName];
    }
    
    getAddress(contractName) {
        return this.addresses[contractName];
    }
    
    isInitialized() {
        return this.isInitialized;
    }
}

// Global instance
window.ContractManager = ContractManager;
window.contractManager = null;

// Initialize when Web3 is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for web3Manager to be initialized
    setTimeout(async () => {
        if (window.web3Manager && window.web3Manager.web3) {
            try {
                window.contractManager = new ContractManager();
            } catch (error) {
                console.error('Failed to initialize ContractManager:', error);
            }
        }
    }, 1000);
});
