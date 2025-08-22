/**
 * 渐进式增强脚本
 * 在原有基础上添加性能优化，不破坏现有功能
 */

class ProgressiveEnhancement {
    constructor() {
        this.optimizedImagesAvailable = false;
        this.modernFormatsSupported = {
            avif: false,
            webp: false
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 启动渐进式增强...');
        
        // 检测现代格式支持
        await this.detectFormatSupport();
        
        // 直接设置为true，因为我们知道优化图片存在
        this.optimizedImagesAvailable = true;
        
        // 增强现有图片
        this.enhanceExistingImages();
        
        // 添加性能监控
        this.addPerformanceMonitoring();
        
        // 添加懒加载
        this.addLazyLoading();
        
        console.log('✅ 渐进式增强完成', {
            optimizedAvailable: this.optimizedImagesAvailable,
            avif: this.modernFormatsSupported.avif,
            webp: this.modernFormatsSupported.webp
        });
    }

    async detectFormatSupport() {
        // 检测 AVIF
        this.modernFormatsSupported.avif = await this.checkImageSupport(
            'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
        );

        // 检测 WebP
        this.modernFormatsSupported.webp = await this.checkImageSupport(
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

    async checkOptimizedImages() {
        try {
            const response = await fetch('optimized-images/manifest.json');
            if (response.ok) {
                this.optimizedImagesAvailable = true;
                this.optimizedManifest = await response.json();
            }
        } catch (error) {
            console.log('📋 优化图片清单不可用，使用原始图片');
        }
    }

    enhanceExistingImages() {
        // 增强现有的img元素
        const images = document.querySelectorAll('img[src*="thumbnails/"]');
        
        images.forEach(img => {
            this.enhanceImage(img);
        });

        // 监听动态添加的图片
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const imgs = node.querySelectorAll ? node.querySelectorAll('img') : [];
                        imgs.forEach(img => this.enhanceImage(img));
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    enhanceImage(img) {
        if (img.dataset.enhanced === 'true') return;
        
        img.dataset.enhanced = 'true';
        
        // 使用getAttribute获取原始src（避免绝对路径问题）
        const originalSrc = img.getAttribute('src') || img.src;
        const absoluteSrc = img.src; // 保存绝对路径用于回退
        
        // 添加回退机制
        img.addEventListener('error', () => {
            if (img.src !== absoluteSrc) {
                console.log(`🔄 图片回退: ${img.src} → ${absoluteSrc}`);
                img.src = absoluteSrc;
            }
        });

        // 如果有优化图片可用，尝试使用
        if (this.optimizedImagesAvailable && this.modernFormatsSupported.webp) {
            const optimizedSrc = this.getOptimizedImageSrc(originalSrc);
            if (optimizedSrc) {
                // 直接设置优化图片路径
                img.src = optimizedSrc;
                console.log(`✨ 替换图片: ${originalSrc} → ${optimizedSrc}`);
            }
        }

        // 添加懒加载属性
        if (!this.isInViewport(img)) {
            img.loading = 'lazy';
        }

        // 添加渐入效果
        this.addFadeInEffect(img);
    }

    getOptimizedImageSrc(originalSrc) {
        if (!this.optimizedImagesAvailable) return null;

        // 从原始路径提取文件名
        const filename = originalSrc.split('/').pop();
        const basename = filename.replace(/\.(png|jpg|jpeg)$/i, '');
        
        // 不需要映射，直接使用原始文件名
        // 选择最佳格式
        let format = 'webp'; // 默认WebP
        if (!this.modernFormatsSupported.webp) {
            return null; // 不支持现代格式，使用原图
        }

        // 根据图片用途选择合适的尺寸
        // thumbnails目录下的大图使用原始尺寸，card图片使用small版本
        let suffix = '';
        if (originalSrc.includes('/thumbnails/')) {
            // thumbnails目录下的图片使用原始尺寸
            suffix = '';
        } else if (originalSrc.includes('/card-')) {
            // card图片使用small版本
            suffix = '-small';
        }

        return `optimized-images/${format}/${basename}${suffix}.${format}`;
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    addFadeInEffect(img) {
        if (img.complete && img.naturalHeight !== 0) {
            // 图片已加载
            img.style.opacity = '1';
        } else {
            // 图片正在加载
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
            
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            }, { once: true });
        }
    }

    addLazyLoading() {
        // 为非首屏图片添加懒加载
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '50px' });

            // 观察所有未在视口中的图片
            document.querySelectorAll('img').forEach(img => {
                if (!this.isInViewport(img) && img.src) {
                    img.dataset.src = img.src;
                    img.src = this.createPlaceholder(img.width || 320, img.height || 481);
                    observer.observe(img);
                }
            });
        }
    }

    createPlaceholder(width, height) {
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <circle cx="50%" cy="50%" r="20" fill="#e0e0e0"/>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    addPerformanceMonitoring() {
        // 监控关键性能指标
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    switch (entry.entryType) {
                        case 'paint':
                            if (entry.name === 'first-contentful-paint') {
                                console.log(`🎨 FCP: ${entry.startTime.toFixed(1)}ms`);
                            }
                            break;
                        case 'largest-contentful-paint':
                            console.log(`🖼️ LCP: ${entry.startTime.toFixed(1)}ms`);
                            break;
                    }
                }
            });

            observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        }
    }

    // 添加关键CSS优化
    addCriticalCSS() {
        if (document.querySelector('[data-critical-css]')) return;

        const criticalCSS = `
            img { 
                transition: opacity 0.3s ease;
            }
            .loading-placeholder {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;

        const style = document.createElement('style');
        style.textContent = criticalCSS;
        style.setAttribute('data-critical-css', 'true');
        document.head.appendChild(style);
    }
}

// 确保在页面加载完成后运行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.progressiveEnhancement = new ProgressiveEnhancement();
    });
} else {
    window.progressiveEnhancement = new ProgressiveEnhancement();
}