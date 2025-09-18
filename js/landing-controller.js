class LandingController {
    constructor() {
        this.planets = [];
        this.isInitialized = false;
        this.boundaries = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };
        this.init();
    }
    
    init() {
        setTimeout(() => {
            this.calculateBoundaries();
            this.setupPlanets();
            this.setupEventListeners();
            this.startAnimation();
            this.isInitialized = true;
            console.log('Landing Controller initialized');
        }, 100);
    }
    
    calculateBoundaries() {
        // Устанавливаем границы движения планет (2/3 центра экрана)
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Отступы от краев (1/6 с каждой стороны)
        const marginX = screenWidth / 6;
        const marginY = screenHeight / 6;
        
        this.boundaries = {
            minX: marginX,
            maxX: screenWidth - marginX - 120, // 120px - размер планеты
            minY: marginY,
            maxY: screenHeight - marginY - 120
        };
        
        console.log('Planet boundaries:', this.boundaries);
    }
    
    setupPlanets() {
        const planetElements = document.querySelectorAll('.planet-wrapper');
        console.log('Found planets:', planetElements.length);
        
        planetElements.forEach((planet, index) => {
            // Случайные начальные позиции в допустимых границах
            const startX = Math.random() * (this.boundaries.maxX - this.boundaries.minX) + this.boundaries.minX;
            const startY = Math.random() * (this.boundaries.maxY - this.boundaries.minY) + this.boundaries.minY;
            
            const planetData = {
                element: planet,
                x: startX,
                y: startY,
                speedX: (Math.random() - 0.5) * 0.5, // УМЕНЬШИЛ СКОРОСТЬ
                speedY: (Math.random() - 0.5) * 0.5, // УМЕНЬШИЛ СКОРОСТЬ
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.5 // УМЕНЬШИЛ СКОРОСТЬ
            };
            
            // Позиционирование
            planet.style.position = 'fixed';
            planet.style.left = planetData.x + 'px';
            planet.style.top = planetData.y + 'px';
            planet.style.zIndex = '10';
            planet.style.pointerEvents = 'auto';
            planet.style.cursor = 'pointer';
            
            this.planets.push(planetData);
        });
    }
    
    startAnimation() {
        const animate = () => {
            this.planets.forEach(planet => {
                // Обновляем позицию
                planet.x += planet.speedX;
                planet.y += planet.speedY;
                
                // Проверяем границы и отражаем
                if (planet.x <= this.boundaries.minX || planet.x >= this.boundaries.maxX) {
                    planet.speedX *= -1;
                    planet.x = Math.max(this.boundaries.minX, Math.min(this.boundaries.maxX, planet.x));
                }
                
                if (planet.y <= this.boundaries.minY || planet.y >= this.boundaries.maxY) {
                    planet.speedY *= -1;
                    planet.y = Math.max(this.boundaries.minY, Math.min(this.boundaries.maxY, planet.y));
                }
                
                // Обновляем вращение
                planet.rotation += planet.rotationSpeed;
                
                // Применяем трансформации
                planet.element.style.left = planet.x + 'px';
                planet.element.style.top = planet.y + 'px';
                planet.element.style.transform = `rotate(${planet.rotation}deg)`;
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    setupEventListeners() {
        // Пересчет границ при изменении размера окна
        window.addEventListener('resize', () => {
            this.calculateBoundaries();
        });
        
        // Planet click handlers with modal
        document.querySelectorAll('.planet-wrapper').forEach((planet) => {
            planet.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showPlanetModal(planet);
            });
            
            // Hover effects
            planet.addEventListener('mouseenter', () => {
                const info = planet.querySelector('.planet-info');
                if (info) {
                    info.style.opacity = '1';
                    info.style.transform = 'scale(1)';
                }
                planet.style.transform += ' scale(1.1)';
            });
            
            planet.addEventListener('mouseleave', () => {
                const info = planet.querySelector('.planet-info');
                if (info) {
                    info.style.opacity = '0';
                    info.style.transform = 'scale(0.8)';
                }
                planet.style.transform = planet.style.transform.replace(' scale(1.1)', '');
            });
        });
    }
    
    showPlanetModal(planetElement) {
        const planetClass = planetElement.className.match(/planet-(\w+)/)?.[1];
        if (!planetClass) {
            console.log('No planet class found');
            return;
        }
        
        console.log('Planet clicked:', planetClass);
        
        const i18n = window.i18n;
        if (!i18n) {
            console.log('i18n not available');
            return;
        }
        
        const planetData = i18n.translations?.[planetClass];
        if (!planetData || !planetData.title) {
            console.log('Planet data not found for:', planetClass, i18n.translations);
            return;
        }
        
        console.log('Showing modal for:', planetData.title);
        
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
