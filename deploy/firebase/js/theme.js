/**
 * Theme Manager
 * Handles dark/light/auto theme switching with smooth transitions
 */

class ThemeManager {
    constructor() {
        this.isInitialized = false;
        this.currentTheme = 'auto';
        this.systemPreference = 'light';
        this.themeToggleButton = null;
        
        this.init();
    }
    
    /**
     * Initialize theme manager
     */
    async init() {
        try {
            console.log('[Theme] Initializing theme manager...');
            
            // Get theme toggle button
            this.themeToggleButton = document.getElementById('theme-toggle');
            
            // Detect system preference
            this.detectSystemPreference();
            
            // Load saved theme preference
            await this.loadThemePreference();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Apply initial theme
            this.applyTheme(this.currentTheme);
            
            this.isInitialized = true;
            console.log('[Theme] Theme manager initialized');
            
        } catch (error) {
            console.error('[Theme] Failed to initialize:', error);
        }
    }
    
    /**
     * Detect system color scheme preference
     */
    detectSystemPreference() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.systemPreference = darkModeQuery.matches ? 'dark' : 'light';
            
            // Listen for system preference changes
            darkModeQuery.addEventListener('change', (e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';
                
                // If using auto theme, update display
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }
    
    /**
     * Load saved theme preference
     */
    async loadThemePreference() {
        try {
            let savedTheme = null;
            
            // Try secure storage first
            if (window.storageManager) {
                savedTheme = await window.storageManager.getPreference('theme');
            }
            
            // Fallback to localStorage
            if (!savedTheme) {
                savedTheme = localStorage.getItem(THEME_CONFIG.storageKey);
            }
            
            // Use saved theme or default
            this.currentTheme = savedTheme || THEME_CONFIG.default;
            
            console.log(`[Theme] Loaded theme preference: ${this.currentTheme}`);
            
        } catch (error) {
            console.error('[Theme] Failed to load theme preference:', error);
            this.currentTheme = THEME_CONFIG.default;
        }
    }
    
    /**
     * Save theme preference
     */
    async saveThemePreference(theme) {
        try {
            // Save to secure storage
            if (window.storageManager) {
                await window.storageManager.setPreference('theme', theme);
            }
            
            // Save to localStorage as backup
            localStorage.setItem(THEME_CONFIG.storageKey, theme);
            
        } catch (error) {
            console.error('[Theme] Failed to save theme preference:', error);
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Theme toggle button
        if (this.themeToggleButton) {
            this.themeToggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Keyboard shortcut (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
        
        // Page visibility change (for theme transitions)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Refresh theme in case system preference changed
                if (this.currentTheme === 'auto') {
                    this.detectSystemPreference();
                    this.applyTheme('auto');
                }
            }
        });
    }
    
    /**
     * Toggle between themes
     */
    toggleTheme() {
        const themes = ['auto', 'light', 'dark'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        this.setTheme(nextTheme);
        
        // Add toggle animation
        if (this.themeToggleButton) {
            this.themeToggleButton.classList.add('force-spin');
            setTimeout(() => {
                this.themeToggleButton.classList.remove('force-spin');
            }, 500);
        }
    }
    
    /**
     * Set specific theme
     */
    async setTheme(theme) {
        if (!['auto', 'light', 'dark'].includes(theme)) {
            console.warn('[Theme] Invalid theme:', theme);
            return;
        }
        
        this.currentTheme = theme;
        
        // Save preference
        await this.saveThemePreference(theme);
        
        // Apply theme
        this.applyTheme(theme);
        
        // Update UI
        this.updateThemeToggleButton();
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent(theme);
        
        console.log(`[Theme] Theme changed to: ${theme}`);
    }
    
    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const root = document.documentElement;
        
        // Add transition class for smooth theme changes
        if (!root.classList.contains('theme-transitioning')) {
            root.classList.add('theme-transitioning');
            
            // Remove transition class after animation completes
            setTimeout(() => {
                root.classList.remove('theme-transitioning');
            }, 300);
        }
        
        // Determine actual theme to apply
        let actualTheme;
        if (theme === 'auto') {
            actualTheme = this.systemPreference;
        } else {
            actualTheme = theme;
        }
        
        // Set data-theme attribute
        root.setAttribute('data-theme', actualTheme);
        
        // Apply CSS custom properties
        this.applyCSSProperties(actualTheme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(actualTheme);
        
        console.log(`[Theme] Applied theme: ${actualTheme} (from ${theme})`);
    }
    
    /**
     * Apply CSS custom properties for theme
     */
    applyCSSProperties(theme) {
        const root = document.documentElement;
        const themeProperties = THEME_CONFIG.themes[theme];
        
        if (!themeProperties) {
            console.warn('[Theme] Theme properties not found:', theme);
            return;
        }
        
        // Apply each property
        Object.entries(themeProperties).forEach(([property, value]) => {
            root.style.setProperty(`--${property}`, value);
        });
    }
    
    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor(theme) {
        const metaThemeColor = document.getElementById('theme-color');
        if (metaThemeColor) {
            const color = theme === 'dark' ? '#1A1A1A' : '#2C3E50';
            metaThemeColor.setAttribute('content', color);
        }
    }
    
    /**
     * Update theme toggle button icon and tooltip
     */
    updateThemeToggleButton() {
        if (!this.themeToggleButton) return;
        
        const icon = this.themeToggleButton.querySelector('.material-icons');
        if (!icon) return;
        
        // Update icon based on current theme
        switch (this.currentTheme) {
            case 'light':
                icon.textContent = 'light_mode';
                this.themeToggleButton.title = 'Switch to Dark Mode';
                break;
            case 'dark':
                icon.textContent = 'dark_mode';
                this.themeToggleButton.title = 'Switch to Auto Mode';
                break;
            case 'auto':
            default:
                icon.textContent = 'brightness_auto';
                this.themeToggleButton.title = 'Switch to Light Mode';
                break;
        }
        
        // Add visual feedback
        this.themeToggleButton.classList.add('force-pulse');
        setTimeout(() => {
            this.themeToggleButton.classList.remove('force-pulse');
        }, 1000);
    }
    
    /**
     * Get effective theme (resolves 'auto' to actual theme)
     */
    getEffectiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemPreference;
        }
        return this.currentTheme;
    }
    
    /**
     * Get current theme preference
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Check if dark mode is active
     */
    isDarkMode() {
        return this.getEffectiveTheme() === 'dark';
    }
    
    /**
     * Check if light mode is active
     */
    isLightMode() {
        return this.getEffectiveTheme() === 'light';
    }
    
    /**
     * Get theme colors for dynamic styling
     */
    getThemeColors() {
        const effectiveTheme = this.getEffectiveTheme();
        return THEME_CONFIG.themes[effectiveTheme] || THEME_CONFIG.themes.light;
    }
    
    /**
     * Apply theme-specific animations
     */
    applyThemeAnimations(theme) {
        const root = document.documentElement;
        
        // Adjust animation speeds based on theme and device
        if (theme === 'dark') {
            // Slightly faster animations in dark mode for better perceived performance
            const speedMultiplier = CONFIG_UTILS.isS23Ultra() ? 0.8 : 0.9;
            root.style.setProperty('--animation-speed-multiplier', speedMultiplier.toString());
        } else {
            root.style.setProperty('--animation-speed-multiplier', '1');
        }
    }
    
    /**
     * Handle system theme changes
     */
    handleSystemThemeChange(isDark) {
        this.systemPreference = isDark ? 'dark' : 'light';
        
        // Only update if using auto theme
        if (this.currentTheme === 'auto') {
            this.applyTheme('auto');
            this.dispatchThemeChangeEvent('auto');
        }
        
        console.log(`[Theme] System theme changed to: ${this.systemPreference}`);
    }
    
    /**
     * Create theme transition effect
     */
    createTransitionEffect() {
        // Create a temporary overlay for smooth transition
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-primary);
            opacity: 0;
            pointer-events: none;
            z-index: 9999;
            transition: opacity 0.15s ease-in-out;
        `;
        
        document.body.appendChild(overlay);
        
        // Fade in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        // Fade out after theme change
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 150);
        }, 150);
    }
    
    /**
     * Dispatch theme change event
     */
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('theme-changed', {
            detail: {
                theme: theme,
                effectiveTheme: this.getEffectiveTheme(),
                isDark: this.isDarkMode(),
                colors: this.getThemeColors()
            },
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Export theme settings
     */
    exportThemeSettings() {
        return {
            currentTheme: this.currentTheme,
            systemPreference: this.systemPreference,
            effectiveTheme: this.getEffectiveTheme(),
            isDark: this.isDarkMode(),
            colors: this.getThemeColors()
        };
    }
    
    /**
     * Import theme settings
     */
    async importThemeSettings(settings) {
        try {
            if (settings.currentTheme) {
                await this.setTheme(settings.currentTheme);
            }
        } catch (error) {
            console.error('[Theme] Failed to import theme settings:', error);
        }
    }
    
    /**
     * Reset to default theme
     */
    async resetToDefault() {
        await this.setTheme(THEME_CONFIG.default);
    }
    
    /**
     * Get theme statistics
     */
    getThemeStats() {
        return {
            currentTheme: this.currentTheme,
            effectiveTheme: this.getEffectiveTheme(),
            systemPreference: this.systemPreference,
            supportsSystemPreference: window.matchMedia ? true : false,
            availableThemes: ['auto', 'light', 'dark'],
            isInitialized: this.isInitialized
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        if (this.themeToggleButton) {
            this.themeToggleButton.removeEventListener('click', () => {});
        }
        
        document.removeEventListener('keydown', () => {});
        document.removeEventListener('visibilitychange', () => {});
        
        // Clear any pending transitions
        const root = document.documentElement;
        root.classList.remove('theme-transitioning');
    }
}

// Utility functions for theme management
const ThemeUtils = {
    /**
     * Get CSS variable value
     */
    getCSSVariable(name) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(`--${name}`).trim();
    },
    
    /**
     * Set CSS variable value
     */
    setCSSVariable(name, value) {
        document.documentElement.style.setProperty(`--${name}`, value);
    },
    
    /**
     * Check if reduced motion is preferred
     */
    prefersReducedMotion() {
        return window.matchMedia && 
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    
    /**
     * Get appropriate animation duration based on preferences
     */
    getAnimationDuration(baseMs = 300) {
        if (this.prefersReducedMotion()) {
            return Math.min(baseMs * 0.1, 50); // Very short animations
        }
        
        // Adjust for high refresh rate displays
        if (CONFIG_UTILS.isS23Ultra()) {
            return Math.round(baseMs * 0.7); // Faster for 120Hz
        }
        
        return baseMs;
    },
    
    /**
     * Apply smooth color transition
     */
    animateColorChange(element, property, fromColor, toColor, duration = 300) {
        if (!element || this.prefersReducedMotion()) {
            element.style[property] = toColor;
            return;
        }
        
        element.style.transition = `${property} ${duration}ms ease-in-out`;
        element.style[property] = toColor;
        
        // Clean up transition after completion
        setTimeout(() => {
            element.style.transition = '';
        }, duration);
    }
};

// Initialize Theme Manager
let themeManager;

document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
    window.themeManager = themeManager;
    window.ThemeUtils = ThemeUtils;
});

// Handle system color scheme changes
if (window.matchMedia) {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
        if (themeManager) {
            themeManager.handleSystemThemeChange(e.matches);
        }
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (themeManager) {
        themeManager.cleanup();
    }
});