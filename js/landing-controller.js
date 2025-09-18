class LandingController {
    constructor() {
        this.planets = [];
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        this.setupPlanets();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Landing Controller initialized');
    }
    
    setupPlanets() {
        const planetElements = document.querySelectorAll('.planet-wrapper');
        
        planetElements.forEach((planet, index) => {
            const planetData = {
                element: planet,
                originalX: Math.random() * window.innerWidth,
                originalY: Math.random() * window.innerHeight,
                speedX: (Math.random() - 0.5) * 2,
                speedY: (Math.random() - 0.5) * 2,
                rotationSpeed: (Math.random() - 0.5) * 4
            };
            
            planet.style.left = planetData.originalX + 'px';
            planet.style.top = planetData.originalY + 'px';
            
            this.planets.push(planetData);
        });
        
        this.startPlanetAnimation();
    }
    
    startPlanetAnimation() {
        setInterval(() => {
            this.planets.forEach(planet => {
                let x = parseFloat(planet.element.style.left);
                let y = parseFloat(planet.element.style.top);
                
                x += planet.speedX;
                y += planet.speedY;
                
                // Bounce off edges
                if (x <= 0 || x >= window.innerWidth - 120) {
                    planet.speedX *= -1;
                }
                if (y <= 0 || y >= window.innerHeight - 120) {
                    planet.speedY *= -1;
                }
                
                planet.element.style.left = Math.max(0, Math.min(window.innerWidth - 120, x)) + 'px';
                planet.element.style.top = Math.max(0, Math.min(window.innerHeight - 120, y)) + 'px';
            });
        }, 50);
    }
    
    setupEventListeners() {
        // Planet hover effects
        document.querySelectorAll('.planet-wrapper').forEach(planet => {
            planet.addEventListener('mouseenter', () => {
                planet.querySelector('.planet-info').style.opacity = '1';
            });
            
            planet.addEventListener('mouseleave', () => {
                planet.querySelector('.planet-info').style.opacity = '0';
            });
        });
    }
}

// Export for global use
window.LandingController = LandingController;
