class ProjectsController {
    constructor(app) {
        this.app = app;
        this.errorHandler = app.getErrorHandler();
        this.i18n = app.getI18n();
        
        this.projects = [];
        this.userLevel = 0;
        this.isActive = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadProjectsData();
        console.log('Projects Controller initialized');
    }
    
    setupEventListeners() {
        // Project details buttons
        document.querySelectorAll('.project-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.project;
                this.showProjectDetails(projectId);
            });
        });
        
        // Project open buttons
        document.querySelectorAll('.project-open-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.project;
                this.openProject(projectId);
            });
        });
        
        // Proposal form
        document.getElementById('submit-proposal-btn')?.addEventListener('click', () => {
            this.submitProposal();
        });
        
        document.getElementById('clear-form-btn')?.addEventListener('click', () => {
            this.clearProposalForm();
        });
        
        // Modal handlers
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                closeBtn.closest('.modal').style.display = 'none';
            });
        });
    }
    
    async loadProjectsData() {
        try {
            this.errorHandler.showLoading('Загрузка проектов...');
            
            // Get user data
            const userProfile = this.app.getUserProfile();
            if (userProfile) {
                this.userLevel = this.getUserMaxLevel();
                this.isActive = this.checkUserActivity();
            }
            
            // Load projects configuration
            this.projects = this.getProjectsConfig();
            
            // Update project availability
            this.updateProjectsAvailability();
            
            // Update statistics
            this.updateProjectStatistics();
            
        } catch (error) {
            console.error('Failed to load projects data:', error);
            this.errorHandler.showError('Ошибка загрузки проектов');
        } finally {
            this.errorHandler.hideLoading();
        }
    }
    
    getUserMaxLevel() {
        const userProfile = this.app.getUserProfile();
        if (userProfile?.activeLevels) {
            return Math.max(...userProfile.activeLevels);
        }
        return 0;
    }
    
    checkUserActivity() {
        // Check if user is active (paid quarterly fee)
        // This would normally come from contract data
        return true; // Demo: assume user is active
    }
    
    getProjectsConfig() {
        return [
            {
                id: 'cardgift',
                name: 'CardGift',
                icon: '🎁',
                description: 'Создание персонализированных открыток и видео-приглашений',
                requiredLevel: 1,
                status: 'available',
                url: 'https://cardgift.globalway.club',
                features: [
                    'Создание персональных открыток',
                    'Видео-приглашения',
                    'Шаблоны для праздников',
                    'Интеграция с социальными сетями'
                ]
            },
            {
                id: 'globaltub',
                name: 'GlobalTub',
                icon: '📺',
                description: 'Видеоплатформа с монетизацией через GWT токены',
                requiredLevel: 2,
                status: 'development',
                url: null,
                features: [
                    'Загрузка и просмотр видео',
                    'Монетизация через GWT',
                    'Стриминг в реальном времени',
                    'Система рейтингов'
                ]
            },
            {
                id: 'globalmarket',
                name: 'GlobalMarket',
                icon: '🛍️',
                description: 'Маркетплейс товаров и услуг с интеграцией GWT',
                requiredLevel: 3,
                status: 'planning',
                url: null,
                features: [
                    'Покупка/продажа товаров',
                    'Оплата токенами GWT',
                    'Система отзывов',
                    'Защита сделок'
                ]
            },
            {
                id: 'globalgame',
                name: 'GlobalGame',
                icon: '🎮',
                description: 'Игровой модуль с внутренней экономикой на GWT',
                requiredLevel: 4,
                status: 'concept',
                url: null,
                features: [
                    'Мини-игры',
                    'Заработок GWT токенов',
                    'Турниры и соревнования',
                    'NFT предметы'
                ]
            },
            {
                id: 'globaledu',
                name: 'GlobalEdu',
                icon: '🎓',
                description: 'Образовательная платформа с сертификацией',
                requiredLevel: 5,
                status: 'planning',
                url: null,
                features: [
                    'Онлайн курсы',
                    'Сертификация блокчейн',
                    'Вебинары и мастер-классы',
                    'Менторская программа'
                ]
            },
            {
                id: 'globalbank',
                name: 'GlobalBank',
                icon: '🏦',
                description: 'DeFi банковские услуги и кредитование',
                requiredLevel: 7,
                status: 'future',
                url: null,
                features: [
                    'Стейкинг токенов',
                    'Кредитование',
                    'Депозитные программы',
                    'DeFi интеграции'
                ]
            }
        ];
    }
    
    updateProjectsAvailability() {
        this.projects.forEach(project => {
            const projectCard = document.querySelector(`[data-project="${project.id}"]`);
            if (!projectCard) return;
            
            const statusBadge = projectCard.querySelector('.status-badge');
            const openBtn = projectCard.querySelector('.project-open-btn');
            
            // Check if user meets requirements
            const hasRequiredLevel = this.userLevel >= project.requiredLevel;
            const meetsRequirements = hasRequiredLevel && this.isActive;
            
            // Update status badge
            if (statusBadge) {
                statusBadge.className = `status-badge ${project.status}`;
                statusBadge.textContent = this.getStatusText(project.status);
            }
            
            // Update open button
            if (openBtn) {
                if (project.status === 'available' && meetsRequirements) {
                    openBtn.disabled = false;
                    openBtn.innerHTML = '<span data-i18n="openProject">Открыть проект</span>';
                } else if (!hasRequiredLevel) {
                    openBtn.disabled = true;
                    openBtn.innerHTML = `<span>Требуется уровень ${project.requiredLevel}+</span>`;
                } else if (!this.isActive) {
                    openBtn.disabled = true;
                    openBtn.innerHTML = '<span>Требуется активность</span>';
                } else {
                    openBtn.disabled = true;
                    openBtn.innerHTML = '<span data-i18n="comingSoon">Скоро</span>';
                }
            }
            
            // Update card appearance
            if (meetsRequirements && project.status === 'available') {
                projectCard.classList.add('accessible');
            } else {
                projectCard.classList.remove('accessible');
            }
        });
    }
    
    getStatusText(status) {
        const statusMap = {
            'available': 'Доступен',
            'development': 'В разработке',
            'planning': 'Планирование',
            'concept': 'Концепция',
            'future': 'Будущее'
        };
        return statusMap[status] || status;
    }
    
    showProjectDetails(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const modal = document.getElementById('project-details-modal');
        const modalTitle = document.getElementById('project-modal-title');
        const modalContent = document.getElementById('project-modal-content');
        
        if (!modal || !modalTitle || !modalContent) return;
        
        modalTitle.textContent = project.name;
        modalContent.innerHTML = `
            <div class="project-detail-content">
                <div class="project-detail-header">
                    <div class="project-detail-icon">${project.icon}</div>
                    <div class="project-detail-info">
                        <h3>${project.name}</h3>
                        <p>${project.description}</p>
                    </div>
                </div>
                
                <div class="project-requirements-detail">
                    <h4>Требования для доступа:</h4>
                    <ul>
                        <li>Минимальный уровень: ${project.requiredLevel}+</li>
                        <li>Квартальная активность: обязательна</li>
                        <li>Статус разработки: ${this.getStatusText(project.status)}</li>
                    </ul>
                </div>
                
                <div class="project-features">
                    <h4>Основные возможности:</h4>
                    <ul>
                        ${project.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="project-access-status">
                    ${this.getAccessStatusHTML(project)}
                </div>
                
                ${project.url ? `
                    <div class="project-actions-detail">
                        <button class="action-btn primary" onclick="window.open('${project.url}', '_blank')">
                            Открыть проект
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    getAccessStatusHTML(project) {
        const hasRequiredLevel = this.userLevel >= project.requiredLevel;
        const meetsRequirements = hasRequiredLevel && this.isActive;
        
        if (project.status !== 'available') {
            return `
                <div class="access-status development">
                    <div class="status-icon">🔧</div>
                    <div class="status-text">
                        <strong>Проект находится в стадии: ${this.getStatusText(project.status)}</strong>
                        <p>Следите за обновлениями в дорожной карте</p>
                    </div>
                </div>
            `;
        }
        
        if (meetsRequirements) {
            return `
                <div class="access-status available">
                    <div class="status-icon">✅</div>
                    <div class="status-text">
                        <strong>У вас есть доступ к этому проекту</strong>
                        <p>Вы можете использовать все функции проекта</p>
                    </div>
                </div>
            `;
        }
        
        if (!hasRequiredLevel) {
            return `
                <div class="access-status blocked">
                    <div class="status-icon">🔒</div>
                    <div class="status-text">
                        <strong>Недостаточный уровень</strong>
                        <p>Активируйте уровень ${project.requiredLevel} для доступа к проекту</p>
                    </div>
                </div>
            `;
        }
        
        if (!this.isActive) {
            return `
                <div class="access-status inactive">
                    <div class="status-icon">⏰</div>
                    <div class="status-text">
                        <strong>Требуется активность</strong>
                        <p>Оплатите квартальную активность для доступа</p>
                    </div>
                </div>
            `;
        }
        
        return '';
    }
    
    openProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const hasRequiredLevel = this.userLevel >= project.requiredLevel;
        const meetsRequirements = hasRequiredLevel && this.isActive;
        
        if (project.status !== 'available') {
            this.errorHandler.showWarning('Проект пока недоступен');
            return;
        }
        
        if (!meetsRequirements) {
            if (!hasRequiredLevel) {
                this.errorHandler.showError(`Требуется уровень ${project.requiredLevel}+`);
            } else if (!this.isActive) {
                this.errorHandler.showError('Требуется квартальная активность');
            }
            return;
        }
        
        if (project.url) {
            window.open(project.url, '_blank');
        } else {
            this.errorHandler.showWarning('Проект скоро будет доступен');
        }
    }
    
    submitProposal() {
        const form = this.getProposalFormData();
        
        if (!this.validateProposalForm(form)) {
            return;
        }
        
        try {
            this.errorHandler.showLoading('Отправка предложения...');
            
            // Simulate sending proposal
            setTimeout(() => {
                this.errorHandler.hideLoading();
                this.errorHandler.showSuccess('Предложение отправлено на рассмотрение');
                this.clearProposalForm();
            }, 2000);
            
        } catch (error) {
            this.errorHandler.showError('Ошибка отправки предложения');
        }
    }
    
    getProposalFormData() {
        return {
            authorName: document.getElementById('author-name')?.value?.trim() || '',
            authorContact: document.getElementById('author-contact')?.value?.trim() || '',
            projectSphere: document.getElementById('project-sphere')?.value || '',
            projectIdea: document.getElementById('project-idea')?.value?.trim() || '',
            projectDescription: document.getElementById('project-description')?.value?.trim() || ''
        };
    }
    
    validateProposalForm(form) {
        if (!form.authorName) {
            this.errorHandler.showError('Укажите ваше имя');
            return false;
        }
        
        if (!form.authorContact) {
            this.errorHandler.showError('Укажите контактную информацию');
            return false;
        }
        
        if (!form.projectSphere) {
            this.errorHandler.showError('Выберите сферу деятельности');
            return false;
        }
        
        if (!form.projectIdea) {
            this.errorHandler.showError('Укажите идею проекта');
            return false;
        }
        
        if (!form.projectDescription) {
            this.errorHandler.showError('Опишите проект подробнее');
            return false;
        }
        
        if (form.projectDescription.length < 50) {
            this.errorHandler.showError('Описание проекта должно быть не менее 50 символов');
            return false;
        }
        
        return true;
    }
    
    clearProposalForm() {
        document.getElementById('author-name').value = '';
        document.getElementById('author-contact').value = '';
        document.getElementById('project-sphere').value = '';
        document.getElementById('project-idea').value = '';
        document.getElementById('project-description').value = '';
    }
    
    updateProjectStatistics() {
        const totalProjects = this.projects.length;
        const activeProjects = this.projects.filter(p => p.status === 'available').length;
        const developmentProjects = this.projects.filter(p => p.status === 'development').length;
        const comingSoonProjects = this.projects.filter(p => 
            ['planning', 'concept', 'future'].includes(p.status)
        ).length;
        
        document.getElementById('total-projects').textContent = totalProjects;
        document.getElementById('active-projects').textContent = activeProjects;
        document.getElementById('development-projects').textContent = developmentProjects;
        document.getElementById('coming-soon-projects').textContent = comingSoonProjects;
        document.getElementById('review-projects').textContent = '0'; // No proposals yet
        document.getElementById('total-project-users').textContent = '0'; // Will be updated with real data
    }
    
    // Update method called by main app
    async update() {
        await this.loadProjectsData();
    }
}

// Export for global use
window.ProjectsController = ProjectsController;
