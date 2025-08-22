/**
 * 渐进式加载系统
 * 实现关键资源优先加载，非关键资源延迟加载
 */

class ProgressiveLoader {
    constructor(options = {}) {
        this.options = {
            // 加载优先级配置
            priorities: {
                critical: 0,      // 关键CSS、首屏图片
                high: 1000,       // 可见区域内容
                normal: 3000,     // 次要内容
                low: 5000         // 非关键资源
            },
            
            // 性能配置
            maxConcurrent: 4,
            loadTimeout: 8000,
            enablePrefetch: true,
            
            // 自适应配置
            respectUserPrefs: true,
            adaptToConnection: true,
            
            ...options
        };

        this.loadQueue = new Map();
        this.loadingResources = new Set();
        this.loadedResources = new Set();
        this.performanceMetrics = {
            startTime: performance.now(),
            firstContentfulPaint: null,
            largestContentfulPaint: null,
            totalResourcesLoaded: 0
        };

        this.init();
    }

    async init() {
        // 检测用户偏好
        this.detectUserPreferences();
        
        // 监听性能指标
        this.setupPerformanceMonitoring();
        
        // 设置资源加载策略
        this.setupLoadingStrategy();
        
        // 开始渐进式加载
        this.startProgressiveLoading();
        
        console.log('🚀 ProgressiveLoader 初始化完成', this.options);
    }

    detectUserPreferences() {
        // 检测用户的数据保存偏好
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.userPrefs = {
                saveData: connection.saveData || false,
                effectiveType: connection.effectiveType || '4g',
                downlink: connection.downlink || 10
            };
        } else {
            this.userPrefs = { saveData: false, effectiveType: '4g', downlink: 10 };
        }

        // 根据用户偏好调整策略
        if (this.userPrefs.saveData || this.userPrefs.effectiveType === '2g') {
            this.options.enablePrefetch = false;
            this.options.maxConcurrent = 2;
        }

        // 检测减少动画偏好
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            this.userPrefs.reduceMotion = true;
        }
    }

    setupPerformanceMonitoring() {
        // 监听Core Web Vitals
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                switch (entry.entryType) {
                    case 'paint':
                        if (entry.name === 'first-contentful-paint') {
                            this.performanceMetrics.firstContentfulPaint = entry.startTime;
                            console.log(`🎨 FCP: ${entry.startTime.toFixed(1)}ms`);
                        }
                        break;
                    
                    case 'largest-contentful-paint':
                        this.performanceMetrics.largestContentfulPaint = entry.startTime;
                        console.log(`🖼️ LCP: ${entry.startTime.toFixed(1)}ms`);
                        break;
                        
                    case 'layout-shift':
                        if (!entry.hadRecentInput) {
                            console.log(`📏 CLS: ${entry.value.toFixed(3)}`);
                        }
                        break;
                }
            }
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
    }

    setupLoadingStrategy() {
        // 定义资源加载策略
        this.loadingStrategies = [
            {
                name: 'critical-css',
                priority: this.options.priorities.critical,
                resources: ['css/critical.css'],
                strategy: 'inline'
            },
            {
                name: 'hero-content',
                priority: this.options.priorities.critical,
                resources: this.getHeroResources(),
                strategy: 'immediate'
            },
            {
                name: 'above-fold-images',
                priority: this.options.priorities.high,
                resources: this.getAboveFoldImages(),
                strategy: 'lazy'
            },
            {
                name: 'non-critical-css',
                priority: this.options.priorities.normal,
                resources: ['css/main.css'],
                strategy: 'async'
            },
            {
                name: 'below-fold-content',
                priority: this.options.priorities.low,
                resources: this.getBelowFoldResources(),
                strategy: 'intersection'
            }
        ];
    }

    getHeroResources() {
        const heroResources = [];
        
        // Hero区域的关键图片
        const heroImages = document.querySelectorAll('.hero-section img[data-src]');
        heroImages.forEach(img => {
            if (this.isInViewport(img, 0.1)) {
                heroResources.push({
                    element: img,
                    type: 'image',
                    priority: 'critical'
                });
            }
        });

        return heroResources;
    }

    getAboveFoldImages() {
        const images = [];
        const viewportHeight = window.innerHeight;
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            const rect = img.getBoundingClientRect();
            // 检查是否在首屏或接近首屏
            if (rect.top < viewportHeight * 1.5) {
                images.push({
                    element: img,
                    type: 'image',
                    priority: 'high'
                });
            }
        });

        return images;
    }

    getBelowFoldResources() {
        const resources = [];
        
        // 获取首屏以下的所有图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (!this.isInViewport(img, 1.5)) {
                resources.push({
                    element: img,
                    type: 'image',
                    priority: 'low'
                });
            }
        });

        // 添加视频资源
        document.querySelectorAll('video[data-src]').forEach(video => {
            resources.push({
                element: video,
                type: 'video',
                priority: 'low'
            });
        });

        return resources;
    }

    isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        return rect.top < viewportHeight * (1 + threshold);
    }

    async startProgressiveLoading() {
        console.log('🎯 开始渐进式加载...');
        
        // 按优先级排序所有策略
        const sortedStrategies = this.loadingStrategies.sort(
            (a, b) => a.priority - b.priority
        );

        // 依次执行加载策略
        for (const strategy of sortedStrategies) {
            await this.executeStrategy(strategy);
        }

        console.log('✅ 渐进式加载完成');
        this.reportPerformanceMetrics();
    }

    async executeStrategy(strategy) {
        console.log(`📦 执行策略: ${strategy.name}`);
        
        switch (strategy.strategy) {
            case 'inline':
                await this.loadInlineResources(strategy.resources);
                break;
                
            case 'immediate':
                await this.loadImmediateResources(strategy.resources);
                break;
                
            case 'async':
                this.loadAsyncResources(strategy.resources);
                break;
                
            case 'lazy':
                this.setupLazyLoading(strategy.resources);
                break;
                
            case 'intersection':
                this.setupIntersectionLoading(strategy.resources);
                break;
        }
    }

    async loadInlineResources(resources) {
        // 内联关键CSS
        for (const resource of resources) {
            if (typeof resource === 'string' && resource.endsWith('.css')) {
                await this.inlineCSS(resource);
            }
        }
    }

    async inlineCSS(cssPath) {
        try {
            const response = await fetch(cssPath);
            const css = await response.text();
            
            const style = document.createElement('style');
            style.textContent = css;
            style.setAttribute('data-critical', 'true');
            
            document.head.appendChild(style);
            console.log(`✅ 内联CSS: ${cssPath}`);
            
        } catch (error) {
            console.warn(`❌ 内联CSS失败: ${cssPath}`, error);
        }
    }

    async loadImmediateResources(resources) {
        // 立即加载关键资源
        const promises = resources.map(resource => {
            if (resource.type === 'image') {
                return this.loadImage(resource.element, 'critical');
            }
            return Promise.resolve();
        });

        await Promise.all(promises);
    }

    loadAsyncResources(resources) {
        // 异步加载非关键CSS
        resources.forEach(resource => {
            if (typeof resource === 'string' && resource.endsWith('.css')) {
                this.loadAsyncCSS(resource);
            }
        });
    }

    loadAsyncCSS(cssPath) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = cssPath;
        link.as = 'style';
        link.onload = function() {
            this.onload = null;
            this.rel = 'stylesheet';
        };
        
        document.head.appendChild(link);
        console.log(`🔄 异步加载CSS: ${cssPath}`);
    }

    setupLazyLoading(resources) {
        // 设置懒加载观察器
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const resource = resources.find(r => r.element === entry.target);
                        if (resource) {
                            this.loadResource(resource);
                            observer.unobserve(entry.target);
                        }
                    }
                });
            },
            { rootMargin: '50px' }
        );

        resources.forEach(resource => {
            if (resource.element) {
                observer.observe(resource.element);
            }
        });
    }

    setupIntersectionLoading(resources) {
        // 设置更大范围的预加载
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const resource = resources.find(r => r.element === entry.target);
                        if (resource && this.options.enablePrefetch) {
                            this.prefetchResource(resource);
                            observer.unobserve(entry.target);
                        }
                    }
                });
            },
            { rootMargin: '200px' }
        );

        resources.forEach(resource => {
            if (resource.element) {
                observer.observe(resource.element);
            }
        });
    }

    async loadResource(resource) {
        if (this.loadedResources.has(resource.element)) return;
        
        this.loadingResources.add(resource.element);
        
        try {
            switch (resource.type) {
                case 'image':
                    await this.loadImage(resource.element, resource.priority);
                    break;
                case 'video':
                    await this.loadVideo(resource.element);
                    break;
            }
            
            this.loadedResources.add(resource.element);
            this.performanceMetrics.totalResourcesLoaded++;
            
        } catch (error) {
            console.warn('资源加载失败:', error);
        } finally {
            this.loadingResources.delete(resource.element);
        }
    }

    async loadImage(img, priority = 'normal') {
        if (!img.dataset.src) return;
        
        return new Promise((resolve, reject) => {
            const tempImg = new Image();
            
            tempImg.onload = () => {
                img.src = tempImg.src;
                img.classList.add('loaded');
                img.removeAttribute('data-src');
                resolve();
            };
            
            tempImg.onerror = reject;
            tempImg.src = img.dataset.src;
            
            // 设置加载超时
            setTimeout(() => reject(new Error('Image load timeout')), this.options.loadTimeout);
        });
    }

    async loadVideo(video) {
        if (!video.dataset.src) return;
        
        return new Promise((resolve) => {
            video.src = video.dataset.src;
            video.load();
            video.addEventListener('loadeddata', resolve, { once: true });
        });
    }

    async prefetchResource(resource) {
        // 预取资源到浏览器缓存
        if (resource.type === 'image' && resource.element.dataset.src) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource.element.dataset.src;
            document.head.appendChild(link);
        }
    }

    reportPerformanceMetrics() {
        const endTime = performance.now();
        const totalTime = endTime - this.performanceMetrics.startTime;
        
        console.log('📊 性能指标报告:');
        console.log(`   总加载时间: ${totalTime.toFixed(1)}ms`);
        console.log(`   FCP: ${this.performanceMetrics.firstContentfulPaint?.toFixed(1) || 'N/A'}ms`);
        console.log(`   LCP: ${this.performanceMetrics.largestContentfulPaint?.toFixed(1) || 'N/A'}ms`);
        console.log(`   已加载资源: ${this.performanceMetrics.totalResourcesLoaded}`);
        console.log(`   用户偏好: ${JSON.stringify(this.userPrefs)}`);
    }
}

// 全局初始化
window.ProgressiveLoader = ProgressiveLoader;

// 页面加载完成后启动
document.addEventListener('DOMContentLoaded', () => {
    window.progressiveLoader = new ProgressiveLoader();
});