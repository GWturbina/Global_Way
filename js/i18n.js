class I18nManager {
    constructor() {
        this.currentLang = localStorage.getItem('globalway_language') || 'en';
        this.translations = {};
        this.loadedLanguages = new Set();
        
        this.init();
    }
    
    async init() {
        try {
            // Load current language
            await this.loadLanguage(this.currentLang);
            
            // Apply translations to current page
            this.applyTranslations();
            
            // Setup language switcher
            this.setupLanguageSwitcher();
            
            // Update HTML lang attribute
            document.documentElement.lang = this.currentLang;
            
            console.log(`I18n initialized with language: ${this.currentLang}`);
        } catch (error) {
            console.error('Failed to initialize I18n:', error);
            // Fallback to English
            if (this.currentLang !== 'en') {
                this.currentLang = 'en';
                await this.loadLanguage('en');
                this.applyTranslations();
            }
        }
    }
    
    async loadLanguage(lang) {
        if (this.loadedLanguages.has(lang)) {
            return this.translations[lang];
        }
        
        try {
            const response = await fetch(`translations/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${lang}`);
            }
            
            const translations = await response.json();
            this.translations[lang] = translations;
            this.loadedLanguages.add(lang);
            
            return translations;
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);
            throw error;
        }
    }
    
    async switchLanguage(newLang) {
        if (newLang === this.currentLang) return;
        
        try {
            // Load new language if not already loaded
            await this.loadLanguage(newLang);
            
            // Update current language
            this.currentLang = newLang;
            
            // Save to localStorage
            localStorage.setItem('globalway_language', newLang);
            
            // Update HTML lang attribute
            document.documentElement.lang = newLang;
            
            // Apply new translations
            this.applyTranslations();
            
            // Update language switcher
            this.updateLanguageSwitcher();
            
            // Emit language changed event
            this.emitLanguageChangeEvent();
            
            console.log(`Language switched to: ${newLang}`);
        } catch (error) {
            console.error(`Failed to switch language to ${newLang}:`, error);
        }
    }
    
    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        const currentTranslations = this.translations[this.currentLang];
        
        if (!currentTranslations) {
            console.warn(`No translations found for language: ${this.currentLang}`);
            return;
        }
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key, currentTranslations);
            
            if (translation) {
                element.textContent = translation;
            } else {
                console.warn(`Translation not found for key: ${key} in language: ${this.currentLang}`);
            }
        });
    }
    
    getTranslation(key, translations = null) {
        const trans = translations || this.translations[this.currentLang];
        if (!trans) return null;
        
        // Support nested keys like "club.title"
        const keys = key.split('.');
        let result = trans;
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return null;
            }
        }
        
        return typeof result === 'string' ? result : null;
    }
    
    setupLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');
        
        langButtons.forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            
            // Set active state
            if (lang === this.currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            // Add click handler
            btn.addEventListener('click', async () => {
                if (lang !== this.currentLang) {
                    await this.switchLanguage(lang);
                }
            });
        });
    }
    
    updateLanguageSwitcher() {
        const langButtons = document.querySelectorAll('.lang-btn');
        
        langButtons.forEach(btn => {
            const lang = btn.getAttribute('data-lang');
            
            if (lang === this.currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    emitLanguageChangeEvent() {
        const event = new CustomEvent('languageChanged', {
            detail: {
                language: this.currentLang,
                translations: this.translations[this.currentLang]
            }
        });
        
        document.dispatchEvent(event);
    }
    
    // Helper method to get translation in JavaScript
    t(key, params = {}) {
        let translation = this.getTranslation(key);
        
        if (!translation) {
            console.warn(`Translation not found for key: ${key}`);
            return key; // Return key as fallback
        }
        
        // Simple parameter replacement
        Object.keys(params).forEach(param => {
            const placeholder = `{{${param}}}`;
            translation = translation.replace(new RegExp(placeholder, 'g'), params[param]);
        });
        
        return translation;
    }
    
    getCurrentLanguage() {
        return this.currentLang;
    }
    
    getSupportedLanguages() {
        return ['en', 'ru', 'uk'];
    }
    
    isRTL() {
        // For future RTL language support
        const rtlLanguages = ['ar', 'he', 'fa'];
        return rtlLanguages.includes(this.currentLang);
    }
}

// Global instance
window.i18n = null;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18nManager();
});
