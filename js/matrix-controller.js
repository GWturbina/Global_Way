class MatrixController {
    constructor(app) {
        this.app = app;
        this.contractManager = app.getContractManager();
        this.errorHandler = app.getErrorHandler();
        this.i18n = app.getI18n();
        
        this.currentMatrixLevel = 1;
        this.matrixData = {};
        this.centerUserId = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadMatrixData();
        console.log('Matrix Controller initialized');
    }
    
    setupEventListeners() {
        // Matrix level tabs
        document.querySelectorAll('.matrix-level-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const level = parseInt(e.currentTarget.dataset.matrixLevel);
                this.selectMatrixLevel(level);
            });
        });
        
        // Matrix search
        const searchInput = document.getElementById('matrix-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchInMatrix(e.target.value);
            });
        }
        
        // Center user button
        document.getElementById('center-user-btn')?.addEventListener('click', () => {
            this.centerOnUser();
        });
        
        // Team level selector
        document.getElementById('team-level-select')?.addEventListener('change', (e) => {
            this.loadTeamStructure(parseInt(e.target.value));
        });
        
        // Position click handlers
        this.setupMatrixPositionHandlers();
        
        // Modal close
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
    }
    
    setupMatrixPositionHandlers() {
        document.querySelectorAll('.matrix-position').forEach(position => {
            position.addEventListener('click', (e) => {
                const positionData = {
                    position: e.currentTarget.dataset.position,
                    level: e.currentTarget.closest('.matrix-level')?.dataset.level || 0
                };
                this.showPositionDetails(positionData);
            });
        });
    }
    
    selectMatrixLevel(level) {
        this.currentMatrixLevel = level;
        
        // Update tab appearance
        document.querySelectorAll('.matrix-level-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-matrix-level="${level}"]`).classList.add('active');
        
        // Load matrix for this level
        this.renderMatrix(level);
        this.updateMatrixStats(level);
    }
    
    async loadMatrixData() {
        if (!this.contractManager || !this.app.getCurrentUser()) {
            console.warn('Contract manager or user not available');
            return;
        }
        
        try {
            this.errorHandler.showLoading('Загрузка матрицы...');
            
            const userAddress = this.app.getCurrentUser();
            
            // Load matrix data for all levels
            for (let level = 1; level <= 12; level++) {
                const matrixStats = await this.contractManager.getMatrixStats(userAddress, level);
                this.matrixData[level] = {
                    level: level,
                    positions: this.generateMatrixPositions(matrixStats, level),
                    stats: matrixStats || {
                        activePositions: 0,
                        partners: 0,
                        charityPlaces: 0,
                        techPlaces: 0,
                        earnings: 0,
                        cycles: 0
                    }
                };
            }
            
            // Set current user ID for centering
            this.centerUserId = this.app.getUserProfile()?.userId || 'YOU';
            
            // Load level 1 by default
            this.selectMatrixLevel(1);
            
        } catch (error) {
            console.error('Failed to load matrix data:', error);
            this.errorHandler.showError('Ошибка загрузки матрицы');
            
            // Generate demo data
            this.generateDemoMatrixData();
            this.selectMatrixLevel(1);
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    generateMatrixPositions(matrixStats, level) {
        // Generate 15 positions for binary matrix (1+2+4+8 = 15)
        const positions = [];
        
        // Root position (user)
        positions[0] = {
            id: this.centerUserId,
            level: level,
            type: 'user',
            status: 'active',
            earnings: 0
        };
        
        // Generate other positions based on matrix stats or demo data
        for (let i = 1; i < 15; i++) {
            const positionType = this.determinePositionType(i, matrixStats);
            positions[i] = {
                id: positionType === 'active' ? `U${(i + 1000000).toString().slice(-7)}` : null,
                level: positionType === 'active' ? Math.floor(Math.random() * level) + 1 : 0,
                type: positionType,
                status: positionType,
                earnings: positionType === 'active' ? Math.random() * 0.1 : 0
            };
        }
        
        return positions;
    }
    
    determinePositionType(position, matrixStats) {
        // Determine position type based on matrix rules
        if (position === 1 || position === 2) {
            // First level - more likely to have partners
            return Math.random() > 0.3 ? 'active' : 'available';
        } else if (position >= 3 && position <= 6) {
            // Second level - mix of types
            const rand = Math.random();
            if (rand > 0.7) return 'active';
            if (rand > 0.5) return 'charity';
            if (rand > 0.3) return 'tech';
            if (rand > 0.1) return 'blocked';
            return 'available';
        } else {
            // Third level - mostly available
            return Math.random() > 0.8 ? 'active' : 'available';
        }
    }
    
    renderMatrix(level) {
        const matrixData = this.matrixData[level];
        if (!matrixData) return;
        
        const matrixTree = document.getElementById('matrix-tree');
        if (!matrixTree) return;
        
        // Clear existing matrix
        matrixTree.innerHTML = '';
        
        // Generate matrix levels
        this.renderMatrixLevel(matrixTree, 0, 1, matrixData.positions); // Root
        this.renderMatrixLevel(matrixTree, 1, 2, matrixData.positions); // Level 2
        this.renderMatrixLevel(matrixTree, 2, 4, matrixData.positions); // Level 3
        this.renderMatrixLevel(matrixTree, 3, 8, matrixData.positions); // Level 4
    }
    
    renderMatrixLevel(container, levelIndex, positionsCount, positionsData) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'matrix-level';
        levelDiv.dataset.level = levelIndex;
        
        const startIndex = levelIndex === 0 ? 0 : Math.pow(2, levelIndex) - 1;
        
        for (let i = 0; i < positionsCount; i++) {
            const positionIndex = startIndex + i;
            const positionData = positionsData[positionIndex] || { type: 'available', id: null, level: 0 };
            
            const positionDiv = document.createElement('div');
            positionDiv.className = `matrix-position ${positionData.type}`;
            positionDiv.dataset.position = positionIndex + 1;
            
            let displayId = '+';
            let displayLevel = '-';
            
            if (positionData.type === 'user') {
                displayId = 'YOU';
                displayLevel = this.currentMatrixLevel;
            } else if (positionData.type === 'active' && positionData.id) {
                displayId = positionData.id;
                displayLevel = positionData.level;
            } else if (positionData.type === 'charity') {
                displayId = `C${String(i + 1).padStart(3, '0')}`;
                displayLevel = Math.floor(Math.random() * this.currentMatrixLevel) + 1;
            } else if (positionData.type === 'tech') {
                displayId = `T${String(i + 1).padStart(3, '0')}`;
                displayLevel = Math.floor(Math.random() * this.currentMatrixLevel) + 1;
            } else if (positionData.type === 'blocked') {
                displayId = '×';
                displayLevel = '-';
            }
            
            positionDiv.innerHTML = `
                <div class="position-content">
                    <div class="position-id">${displayId}</div>
                    <div class="position-level">${displayLevel}</div>
                </div>
            `;
            
            // Add click handler
            positionDiv.addEventListener('click', () => {
                this.showPositionDetails({
                    position: positionIndex + 1,
                    level: levelIndex,
                    data: positionData,
                    displayId: displayId,
                    displayLevel: displayLevel
                });
            });
            
            levelDiv.appendChild(positionDiv);
        }
        
        container.appendChild(levelDiv);
    }
    
    updateMatrixStats(level) {
        const stats = this.matrixData[level]?.stats || {};
        
        document.getElementById('total-active-positions').textContent = stats.activePositions || 0;
        document.getElementById('matrix-partners').textContent = stats.partners || 0;
        document.getElementById('charity-places').textContent = stats.charityPlaces || 0;
        document.getElementById('tech-places').textContent = stats.techPlaces || 0;
        document.getElementById('matrix-earnings').textContent = 
            `${(stats.earnings || 0).toFixed(6)} BNB`;
        document.getElementById('cycle-count').textContent = stats.cycles || 0;
    }
    
    searchInMatrix(query) {
        if (!query.trim()) {
            // Reset highlights
            document.querySelectorAll('.matrix-position').forEach(pos => {
                pos.classList.remove('highlighted');
            });
            return;
        }
        
        const positions = document.querySelectorAll('.matrix-position');
        let found = false;
        
        positions.forEach(position => {
            const idElement = position.querySelector('.position-id');
            if (idElement && idElement.textContent.toLowerCase().includes(query.toLowerCase())) {
                position.classList.add('highlighted');
                found = true;
            } else {
                position.classList.remove('highlighted');
            }
        });
        
        if (!found) {
            this.errorHandler.showWarning('Пользователь не найден в матрице');
        }
    }
    
    centerOnUser() {
        const userPosition = document.querySelector('.matrix-position.user-position');
        if (userPosition) {
            userPosition.scrollIntoView({ behavior: 'smooth', block: 'center' });
            userPosition.classList.add('pulse');
            setTimeout(() => userPosition.classList.remove('pulse'), 2000);
        }
    }
    
    async loadTeamStructure(level) {
        try {
            // Load team data for specific level
            const tableBody = document.getElementById('matrix-team-body');
            if (!tableBody) return;
            
            tableBody.innerHTML = `
                <tr class="loading">
                    <td colspan="7">Загрузка команды уровня ${level}...</td>
                </tr>
            `;
            
            // Simulate loading team data
            setTimeout(() => {
                const demoTeamData = this.generateDemoTeamData(level);
                this.renderTeamTable(demoTeamData);
            }, 1000);
            
        } catch (error) {
            console.error('Failed to load team structure:', error);
            this.errorHandler.showError('Ошибка загрузки команды');
        }
    }
    
    generateDemoTeamData(level) {
        const teamSize = Math.floor(Math.random() * 10) + 5;
        const team = [];
        
        for (let i = 0; i < teamSize; i++) {
            team.push({
                id: i + 1,
                userId: `U${(i + 2000000).toString().slice(-7)}`,
                address: `0x${Math.random().toString(16).substr(2, 40)}`,
                sponsorId: `U${(i + 1000000).toString().slice(-7)}`,
                activationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                level: Math.floor(Math.random() * level) + 1,
                qualification: ['Новичок', 'Бронза', 'Серебро', 'Золото'][Math.floor(Math.random() * 4)]
            });
        }
        
        return team;
    }
    
    renderTeamTable(teamData) {
        const tableBody = document.getElementById('matrix-team-body');
        if (!tableBody) return;
        
        if (teamData.length === 0) {
            tableBody.innerHTML = `
                <tr class="no-data">
                    <td colspan="7" data-i18n="noTeamData">Нет данных о команде</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = teamData.map(member => `
            <tr class="team-member-row">
                <td>${member.id}</td>
                <td class="user-id">${member.userId}</td>
                <td class="address">${this.formatAddress(member.address)}</td>
                <td class="sponsor-id">${member.sponsorId}</td>
                <td class="activation-date">${member.activationDate.toLocaleDateString()}</td>
                <td class="level">${member.level}</td>
                <td class="qualification">
                    <span class="qualification-badge ${member.qualification.toLowerCase()}">${member.qualification}</span>
                </td>
            </tr>
        `).join('');
    }
    
    showPositionDetails(positionInfo) {
        const modal = document.getElementById('position-modal');
        const content = document.getElementById('position-details');
        
        if (!modal || !content) return;
        
        content.innerHTML = `
            <div class="position-detail-card">
                <div class="position-header">
                    <h3>Позиция ${positionInfo.position}</h3>
                    <span class="position-status ${positionInfo.data?.type || 'available'}">${this.getStatusText(positionInfo.data?.type)}</span>
                </div>
                
                <div class="position-info">
                    <div class="info-row">
                        <span class="info-label">ID пользователя:</span>
                        <span class="info-value">${positionInfo.displayId || '-'}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Уровень:</span>
                        <span class="info-value">${positionInfo.displayLevel || '-'}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Позиция в матрице:</span>
                        <span class="info-value">Уровень ${parseInt(positionInfo.level) + 1}, позиция ${positionInfo.position}</span>
                    </div>
                    
                    ${positionInfo.data?.type === 'active' ? `
                        <div class="info-row">
                            <span class="info-label">Заработано:</span>
                            <span class="info-value">${(positionInfo.data.earnings || 0).toFixed(6)} BNB</span>
                        </div>
                    ` : ''}
                    
                    ${positionInfo.data?.type === 'charity' ? `
                        <div class="charity-info">
                            <p>Это место предназначено для благотворительных целей. Средства направляются на социальные проекты.</p>
                        </div>
                    ` : ''}
                    
                    ${positionInfo.data?.type === 'tech' ? `
                        <div class="tech-info">
                            <p>Техническое место для обеспечения стабильности матрицы и развития платформы.</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    getStatusText(type) {
        const statusMap = {
            'user': 'Вы',
            'active': 'Активный',
            'available': 'Доступно',
            'blocked': 'Заблокировано',
            'charity': 'Благотворительность',
            'tech': 'Техническое'
        };
        
        return statusMap[type] || 'Неизвестно';
    }
    
    generateDemoMatrixData() {
        // Generate demo data when contract is not available
        for (let level = 1; level <= 12; level++) {
            this.matrixData[level] = {
                level: level,
                positions: this.generateMatrixPositions(null, level),
                stats: {
                    activePositions: Math.floor(Math.random() * 10) + 1,
                    partners: Math.floor(Math.random() * 5) + 1,
                    charityPlaces: Math.floor(Math.random() * 3),
                    techPlaces: Math.floor(Math.random() * 2),
                    earnings: Math.random() * 0.5,
                    cycles: Math.floor(Math.random() * 3)
                }
            };
        }
    }
    
    formatAddress(address) {
        if (!address) return '-';
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }
    
    // Update method called by main app
    async update() {
        await this.loadMatrixData();
    }
}

// Export for global use
window.MatrixController = MatrixController;
