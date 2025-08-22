/**
 * 智能懒加载系统
 * 支持现代图片格式 (AVIF/WebP) + 智能预加载
 */

class SmartLazyLoader {
    constructor(options = {}) {
        this.options = {
            // 基础配置
            threshold: 0.1,              // 提前加载阈值
            rootMargin: '50px',          // 预加载边距
            enablePreload: true,         // 启用智能预加载
            
            // 格式支持检测
            supportsAvif: null,
            supportsWebp: null,
            
            // 预加载策略
            preloadDistance: 2,          // 预加载距离（屏幕数）
            adaptiveLoading: true,       // 自适应加载
            
            // 性能配置
            maxConcurrent: 3,           // 最大并发加载数
            loadTimeout: 10000,         // 加载超时时间
            
            ...options
        };

        this.loadingQueue = [];
        this.loadingCount = 0;
        this.observer = null;
        this.intersectionObserver = null;
        this.prefetchObserver = null;
        
        this.init();
    }

    async init() {
        // 检测浏览器格式支持
        await this.detectFormatSupport();
        
        // 初始化观察器
        this.setupObservers();
        
        // 检测网络状况
        this.setupNetworkAdaptation();
        
        console.log('🚀 SmartLazyLoader 初始化完成', {
            avif: this.options.supportsAvif,
            webp: this.options.supportsWebp,
            connection: this.getConnectionType()
        });
    }

    // 检测现代图片格式支持
    async detectFormatSupport() {
        // 检测 AVIF 支持
        this.options.supportsAvif = await this.checkImageSupport(
            'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
        );

        // 检测 WebP 支持  
        this.options.supportsWebp = await this.checkImageSupport(
            'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
        );
    }

    checkImageSupport(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = src;
        });
    }

    // 设置观察器
    setupObservers() {
        // 主要的懒加载观察器
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                threshold: this.options.threshold,
                rootMargin: this.options.rootMargin
            }
        );

        // 预加载观察器（更大的检测范围）
        if (this.options.enablePreload) {
            this.prefetchObserver = new IntersectionObserver(
                this.handlePrefetch.bind(this),
                {
                    threshold: 0,
                    rootMargin: `${this.options.preloadDistance * window.innerHeight}px`
                }
            );
        }
    }

    // 网络自适应
    setupNetworkAdaptation() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // 根据网络状况调整策略
            const updateStrategy = () => {
                const effectiveType = connection.effectiveType;
                
                if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                    this.options.enablePreload = false;
                    this.options.maxConcurrent = 1;
                } else if (effectiveType === '3g') {
                    this.options.enablePreload = true;
                    this.options.maxConcurrent = 2;
                } else {
                    this.options.enablePreload = true;
                    this.options.maxConcurrent = 3;
                }
            };

            connection.addEventListener('change', updateStrategy);
            updateStrategy();
        }
    }

    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType;
        }
        return 'unknown';
    }

    // 处理元素进入视口
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target, 'visible');
                this.observer.unobserve(entry.target);
            }
        });
    }

    // 处理预加载
    handlePrefetch(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadImage(entry.target, 'prefetch');
                this.prefetchObserver.unobserve(entry.target);
            }
        });
    }

    // 智能图片加载
    async loadImage(img, priority = 'normal') {
        if (img.dataset.loaded === 'true') return;
        
        // 控制并发加载数量
        if (this.loadingCount >= this.options.maxConcurrent && priority !== 'visible') {
            this.loadingQueue.push({ img, priority });
            return;
        }

        this.loadingCount++;
        img.dataset.loading = 'true';

        try {
            const src = this.getBestImageSrc(img);
            
            // 预加载图片
            await this.preloadImage(src);
            
            // 应用图片
            this.applyImage(img, src);
            
            img.dataset.loaded = 'true';
            img.dataset.loading = 'false';
            
            // 触发加载完成事件
            img.dispatchEvent(new CustomEvent('imageLoaded', {
                detail: { src, priority }
            }));

        } catch (error) {
            console.warn('图片加载失败:', error);
            this.handleImageError(img);
        } finally {
            this.loadingCount--;
            this.processQueue();
        }
    }

    // 获取最佳图片源
    getBestImageSrc(img) {
        const sources = this.parseImageSources(img);
        
        // 根据设备和网络选择最佳格式
        const devicePixelRatio = window.devicePixelRatio || 1;
        const viewportWidth = window.innerWidth;
        const connectionType = this.getConnectionType();
        
        // 格式优先级：AVIF > WebP > JPEG/PNG
        let formatPriority = ['jpeg', 'png'];
        if (this.options.supportsWebp) formatPriority.unshift('webp');
        if (this.options.supportsAvif) formatPriority.unshift('avif');
        
        // 尺寸选择逻辑
        let targetWidth = viewportWidth;
        if (connectionType === '2g' || connectionType === 'slow-2g') {
            targetWidth = Math.min(viewportWidth, 640); // 低速网络使用小图
        } else if (devicePixelRatio > 1) {
            targetWidth = viewportWidth * Math.min(devicePixelRatio, 2); // 高分屏
        }

        // 选择最佳源
        for (const format of formatPriority) {
            const formatSources = sources[format] || {};
            const sizes = Object.keys(formatSources).map(Number).sort((a, b) => a - b);
            
            for (const size of sizes) {
                if (size >= targetWidth) {
                    return formatSources[size];
                }
            }
            
            // 如果没找到合适尺寸，使用最大的
            if (sizes.length > 0) {
                return formatSources[sizes[sizes.length - 1]];
            }
        }

        // 回退到原始src
        return img.dataset.src || img.src;
    }

    // 解析图片源数据
    parseImageSources(img) {
        const sources = {};
        
        // 解析 data-sources 属性
        if (img.dataset.sources) {
            try {
                return JSON.parse(img.dataset.sources);
            } catch (e) {
                console.warn('解析图片源数据失败:', e);
            }
        }

        // 回退：从现有属性构建
        if (img.dataset.src) {
            sources.jpeg = { [1920]: img.dataset.src };
        }

        return sources;
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const timeoutId = setTimeout(() => {
                reject(new Error('图片加载超时'));
            }, this.options.loadTimeout);

            img.onload = () => {
                clearTimeout(timeoutId);
                resolve(img);
            };

            img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('图片加载失败'));
            };

            img.src = src;
        });
    }

    // 应用图片到元素
    applyImage(img, src) {
        // 淡入效果
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        img.src = src;
        
        // 图片加载完成后淡入
        img.onload = () => {
            img.style.opacity = '1';
            img.removeAttribute('style'); // 清理内联样式
        };
    }

    handleImageError(img) {
        // 尝试回退源
        const fallbackSrc = img.dataset.fallback || img.dataset.src;
        if (fallbackSrc && img.src !== fallbackSrc) {
            img.src = fallbackSrc;
        } else {
            img.classList.add('image-error');
        }
    }

    // 处理加载队列
    processQueue() {
        while (this.loadingQueue.length > 0 && this.loadingCount < this.options.maxConcurrent) {
            const { img, priority } = this.loadingQueue.shift();
            this.loadImage(img, priority);
        }
    }

    // 观察图片元素
    observe(img) {
        if (!img || img.dataset.observed === 'true') return;
        
        img.dataset.observed = 'true';
        this.observer.observe(img);
        
        if (this.prefetchObserver) {
            this.prefetchObserver.observe(img);
        }
    }

    // 取消观察
    unobserve(img) {
        this.observer.unobserve(img);
        if (this.prefetchObserver) {
            this.prefetchObserver.unobserve(img);
        }
    }

    // 销毁
    destroy() {
        this.observer.disconnect();
        if (this.prefetchObserver) {
            this.prefetchObserver.disconnect();
        }
        this.loadingQueue = [];
    }
}

// 全局初始化
window.SmartLazyLoader = SmartLazyLoader;

// DOM 就绪后自动初始化
document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new SmartLazyLoader();
    
    // 自动观察所有懒加载图片
    document.querySelectorAll('img[data-src]').forEach(img => {
        window.lazyLoader.observe(img);
    });
    
    console.log('🖼️ 智能懒加载已激活');
});