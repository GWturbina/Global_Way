class LandingController {
    constructor() {
        this.planets = [];
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        // Ждем загрузки DOM
        setTimeout(() => {
            this.setupPlanets();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Landing Controller initialized');
        }, 100);
    }
    
    setupPlanets() {
        const planetElements = document.querySelectorAll('.planet-wrapper');
        console.log('Found planets:', planetElements.length);
        
        planetElements.forEach((planet, index) => {
            // Позиционирование планет
            const positions = [
                { left: '15%', top: '20%' }, // Club
                { left: '70%', top: '15%' }, // Mission
                { left: '10%', top: '60%' }, // Goals
                { left: '75%', top: '70%' }, // Roadmap
                { left: '45%', top: '10%' }  // Projects
            ];
            
            if (positions[index]) {
                planet.style.position = 'fixed';
                planet.style.left = positions[index].left;
                planet.style.top = positions[index].top;
                planet.style.zIndex = '10';
            }
        });
    }
    
    setupEventListeners() {
        // Planet click handlers with modal
        document.querySelectorAll('.planet-wrapper').forEach((planet) => {
            planet.addEventListener('click', () => {
                this.showPlanetModal(planet);
            });
            
            // Hover effects
            planet.addEventListener('mouseenter', () => {
                const info = planet.querySelector('.planet-info');
                if (info) {
                    info.style.opacity = '1';
                    info.style.transform = 'scale(1)';
                }
            });
            
            planet.addEventListener('mouseleave', () => {
                const info = planet.querySelector('.planet-info');
                if (info) {
                    info.style.opacity = '0';
                    info.style.transform = 'scale(0.8)';
                }
            });
        });
    }
    
    showPlanetModal(planetElement) {
        const planetClass = planetElement.className.match(/planet-(\w+)/)?.[1];
        if (!planetClass) return;
        
        const i18n = window.i18n;
        if (!i18n || !i18n.translations) return;
        
        const planetData = i18n.translations[planetClass];
        if (!planetData || !planetData.title) return;
        
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'planet-modal';
        modal.innerHTML = `
            <div class="planet-modal-content">
                <span class="planet-modal-close">&times;</span>
                <h2 class="planet-modal-title">${planetData.title}</h2>
                <p class="planet-modal-text">${planetData.text}</p>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Обработчик закрытия
        modal.querySelector('.planet-modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

window.LandingController = LandingController;
