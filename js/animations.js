/* Planet Movement Animations */
@keyframes float-horizontal {
    0% { transform: translateX(0px) rotate(0deg); }
    33% { transform: translateX(100px) rotate(120deg); }
    66% { transform: translateX(-50px) rotate(240deg); }
    100% { transform: translateX(0px) rotate(360deg); }
}

@keyframes float-vertical {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-80px) rotate(180deg); }
    100% { transform: translateY(0px) rotate(360deg); }
}

@keyframes float-diagonal {
    0% { transform: translate(0px, 0px) rotate(0deg); }
    25% { transform: translate(60px, -40px) rotate(90deg); }
    50% { transform: translate(-30px, -80px) rotate(180deg); }
    75% { transform: translate(-60px, 40px) rotate(270deg); }
    100% { transform: translate(0px, 0px) rotate(360deg); }
}

@keyframes float-circular {
    0% { transform: rotate(0deg) translateX(50px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
}

@keyframes float-random {
    0% { transform: translate(0px, 0px) scale(1) rotate(0deg); }
    20% { transform: translate(40px, -30px) scale(1.1) rotate(72deg); }
    40% { transform: translate(-20px, -60px) scale(0.9) rotate(144deg); }
    60% { transform: translate(-50px, 20px) scale(1.05) rotate(216deg); }
    80% { transform: translate(30px, 50px) scale(0.95) rotate(288deg); }
    100% { transform: translate(0px, 0px) scale(1) rotate(360deg); }
}

/* Planet specific animations */
.planet-club .planet-image { animation: float-horizontal 15s ease-in-out infinite; }
.planet-mission .planet-image { animation: float-vertical 18s ease-in-out infinite; }
.planet-goals .planet-image { animation: float-diagonal 12s ease-in-out infinite; }
.planet-roadmap .planet-image { animation: float-circular 20s linear infinite; }
.planet-projects .planet-image { animation: float-random 16s ease-in-out infinite; }

/* GWT Coin Animation */
.gwt-coin-image {
    animation: 
        float-vertical 8s ease-in-out infinite,
        spin 12s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
