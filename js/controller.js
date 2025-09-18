class LandingController {
    constructor() {
        this.modal = document.getElementById('planet-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalText = document.getElementById('modal-text');
        this.modalClose = document.querySelector('.modal-close');
        this.openDappBtn = document.getElementById('open-dapp-btn');
        
        this.init();
    }
    
    init() {
        this.setupPlanetClickHandlers();
        this.setupModalHandlers();
        this.setupDappEntryHandler();
        this.setupKeyboardHandlers();
        this.optimizePlanetMovement();
        
        // Handle referral links
        this.handleReferralDetection();
        
        console.log('Landing controller initialized');
    }
    
    setupPlanetClickHandlers() {
        const planets = document.querySelectorAll('.planet-wrapper');
        
        planets.forEach(planet => {
            planet.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPlanetModal(planet);
            });
            
            // Add keyboard accessibility
            planet.setAttribute('tabindex', '0');
            planet.setAttribute('role', 'button');
            
            planet.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showPlanetModal(planet);
                }
            });
            
            // Add hover sound effect (optional)
            planet.addEventListener('mouseenter', () => {
                this.playHoverSound();
            });
        });
    }
    
    showPlanetModal(planetElement) {
        const planetType = planetElement.getAttribute('data-planet');
        
        if (!planetType) {
            console.error('Planet type not found');
            return;
        }
        
        // Get translations
        const title = window.i18n ? window.i18n.t(`${planetType}.title`) : planetType;
        const text = window.i18n ? window.i18n.t(`${planetType}.text`) : '';
        
        this.modalTitle.textContent = title;
        this.modalText.textContent = text;
        
        // Show modal with animation
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        
        // Focus management for accessibility
        this.modalClose.focus();
        
        // Analytics tracking (optional)
        this.trackPlanetView(planetType);
    }
    
    setupModalHandlers() {
        // Close button
        this.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.closeModal();
            }
        });
    }
    
    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scroll
        
        // Return focus to previously focused element
        const focusedPlanet = document.activeElement;
        if (focusedPlanet && focusedPlanet.classList.contains('planet-wrapper')) {
            focusedPlanet.focus();
        }
    }
    
    setupDappEntryHandler() {
        this.openDappBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                // Show loading state
                this.showLoadingOnButton();
                
                // Initialize wallet connection and navigate to dashboard
                await this.enterDapp();
                
            } catch (error) {
                console.error('Failed to enter DApp:', error);
                this.showErrorOnButton('Connection Failed');
                
                // Reset button after delay
                setTimeout(() => {
                    this.resetButton();
                }, 3000);
            }
        });
        
        // Add keyboard accessibility
        this.openDappBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.openDappBtn.click();
            }
        });
    }
    
    async enterDapp() {
        try {
            // Check if wallet connection is available
            if (typeof window.ethereum !== 'undefined' || typeof window.safePal !== 'undefined') {
                // Proceed to dashboard
                await this.navigateToDashboard();
            } else {
                // Show wallet installation prompt
                this.showWalletInstallPrompt();
            }
            
        } catch (error) {
            throw new Error('Failed to initialize DApp entry: ' + error.message);
        }
    }
    
    async navigateToDashboard() {
        // Create fade-out effect
        document.body.classList.add('page-transition');
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate to dashboard (will be implemented in main app)
        window.location.href = '#dashboard';
        
        // Or trigger app initialization
        if (window.globalWayApp) {
            await window.globalWayApp.initializeDashboard();
        }
    }
    
    showLoadingOnButton() {
        const coinLabel = this.openDappBtn.querySelector('.coin-label');
        coinLabel.textContent = 'Connecting...';
        this.openDappBtn.classList.add('loading');
        this.openDappBtn.disabled = true;
    }
    
    showErrorOnButton(message) {
        const coinLabel = this.openDappBtn.querySelector('.coin-label');
        coinLabel.textContent = message;
        this.openDappBtn.classList.add('error');
        this.openDappBtn.classList.remove('loading');
    }
    
    resetButton() {
        const coinLabel = this.openDappBtn.querySelector('.coin-label');
        coinLabel.textContent = window.i18n ? window.i18n.t('enterDapp') : 'Enter DApp';
        this.openDappBtn.classList.remove('loading', 'error');
        this.openDappBtn.disabled = false;
    }
    
    setupKeyboardHandlers() {
        // Tab navigation optimization
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    }
    
    optimizePlanetMovement() {
        // Pause animations when page is not visible
        document.addEventListener('visibilitychange', () => {
            const planets = document.querySelectorAll('.planet-wrapper');
            
            if (document.hidden) {
                planets.forEach(planet => {
                    planet.style.animationPlayState = 'paused';
                });
            } else {
                planets.forEach(planet => {
                    planet.style.animationPlayState = 'running';
                });
            }
        });
        
        // Optimize for performance
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const planets = document.querySelectorAll('.planet-wrapper');
            planets.forEach(planet => {
                planet.style.animation = 'none';
            });
        }
    }
    
    handleReferralDetection() {
        // Check for referral in URL
        const referralMatch = window.location.pathname.match(/\/ref(\d{7})/);
        
        if (referralMatch) {
            const referralId = referralMatch[1];
            
            // Store referral ID
            sessionStorage.setItem('referral_id', referralId);
            
            // Clean URL
            const cleanUrl = window.location.origin + window.location.pathname.replace(/\/ref\d{7}/, '');
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Show referral notification
            this.showReferralNotification(referralId);
            
            console.log('Referral detected:', referralId);
        }
    }
    
    showReferralNotification(referralId) {
        const notification = document.createElement('div');
        notification.className = 'referral-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🎁</span>
                <span class="notification-text">Welcome! You were invited by user ${referralId}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    showWalletInstallPrompt() {
        const promptModal = document.createElement('div');
        promptModal.className = 'wallet-install-modal modal';
        promptModal.innerHTML = `
            <div class="modal-content cosmic-modal">
                <span class="modal-close">&times;</span>
                <h2 class="modal-title">Wallet Required</h2>
                <p class="modal-text">To use GlobalWay, you need to install SafePal wallet.</p>
                <div class="wallet-install-buttons">
                    <a href="https://safepal.com/download" target="_blank" class="install-btn primary">
                        Install SafePal
                    </a>
                    <button class="install-btn secondary" onclick="this.closest('.modal').remove()">
                        Maybe Later
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(promptModal);
        promptModal.style.display = 'block';
        
        // Close handler
        promptModal.querySelector('.modal-close').addEventListener('click', () => {
            promptModal.remove();
        });
    }
    
    // Analytics and tracking methods
    trackPlanetView(planetType) {
        // Integration point for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'planet_view', {
                planet_type: planetType,
                page_title: document.title
            });
        }
        
        console.log('Planet viewed:', planetType);
    }
    
    playHoverSound() {
        // Optional: Add subtle sound effects
        // Implement only if user hasn't disabled sounds
        if (!localStorage.getItem('sounds_disabled')) {
            // Play subtle hover sound
        }
    }
}

// Additional CSS for new elements
const additionalStyles = `
.page-transition {
    opacity: 0;
    transition: opacity 0.5s ease-out;
}

.referral-notification {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    animation: slideInFromTop 0.5s ease-out;
}

.notification-content {
    background: var(--color-bg-modal);
    border: 1px solid var(--color-border-gold);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md) var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text-primary);
    box-shadow: var(--shadow-lg);
}

.notification-icon {
    font-size: var(--font-size-lg);
}

.notification-close {
    background: none;
    border: none;
    color: var(--color-text-gold);
    cursor: pointer;
    font-size: var(--font-size-lg);
    padding: 0;
    margin-left: var(--spacing-sm);
}

.wallet-install-buttons {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
    justify-content: center;
}

.install-btn {
    padding: var(--spacing-md) var(--spacing-lg);
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.install-btn.primary {
    background: var(--color-primary-gold);
    color: var(--color-primary-navy);
}

.install-btn.secondary {
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-inactive);
}

.install-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

@keyframes slideInFromTop {
    from {
        opacity: 0;
        transform: translate(-50%, -100%);
    }
    to {
        opacity: 1;
        transform: translate(-50%, 0);
    }
}

.keyboard-nav .planet-wrapper:focus,
.keyboard-nav .gwt-coin-button:focus {
    outline: 2px solid var(--color-primary-gold);
    outline-offset: 4px;
}

.loading .gwt-coin-image {
    animation: spin 1s linear infinite, coinPulse 2s ease-in-out infinite;
}

.error .coin-label {
    color: var(--color-status-error);
    background: rgba(220, 53, 69, 0.1);
    border-color: var(--color-status-error);
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
