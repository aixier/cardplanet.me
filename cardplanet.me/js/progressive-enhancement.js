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
        
        // 检查优化图片是否可用
        await this.checkOptimizedImages();
        
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
        const originalSrc = img.src;
        
        // 添加回退机制
        img.addEventListener('error', () => {
            if (img.src !== originalSrc) {
                console.log(`🔄 图片回退: ${img.src} → ${originalSrc}`);
                img.src = originalSrc;
            }
        });

        // 如果有优化图片可用，尝试使用
        if (this.optimizedImagesAvailable) {
            const optimizedSrc = this.getOptimizedImageSrc(originalSrc);
            if (optimizedSrc && optimizedSrc !== originalSrc) {
                // 预加载优化图片
                const testImg = new Image();
                testImg.onload = () => {
                    img.src = optimizedSrc;
                    console.log(`✅ 使用优化图片: ${optimizedSrc}`);
                };
                testImg.onerror = () => {
                    console.log(`⚠️ 优化图片不可用，保持原图: ${originalSrc}`);
                };
                testImg.src = optimizedSrc;
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
        
        // 映射到优化图片
        const nameMapping = {
            'floral_flex_Chinese_Artistry_style_best': 'floral_flex_Chinese_Artistry',
            'sydney_sweeney_Editorial_Soft_style': 'sydney_sweeney_Editorial_Soft',
            'spacecore_drawstring_jean_Cosmic_Empire_style': 'spacecore_drawstring_Cosmic_Empire',
            'depop_2005_closet_Pin_Board_style': 'depop_2005_closet_Pin_Board',
            'no_try_summer_look_Minimal_style': 'no_try_summer_look_Minimal',
            'lollapalooza_street_Luxe_Print_style': 'lollapalooza_street_Luxe_Print',
            'lolitics_Bubble_Fresh_style': 'lolitics_Bubble_Fresh',
            'pucci_swirls_genz_Geometric_Symphony_style': 'pucci_swirls_genz_Geometric_Symphony',
            'genz_career_shift_System_Clean_style': 'genz_career_shift_System_Clean',
            'brainrot_Impressionist_ Soft_style': 'brainrot_Impressionist_Soft',
            'side_hustle_brand_Woven_Texture_style': 'side_hustle_brand_Woven_Texture',
            'matcha_man_Fluid_Zen_style': 'matcha_man_Fluid_Zen'
        };

        const mappedName = nameMapping[basename] || basename;
        
        // 选择最佳格式
        let format = 'webp'; // 默认WebP
        if (this.modernFormatsSupported.avif) {
            format = 'avif';
        } else if (!this.modernFormatsSupported.webp) {
            return null; // 不支持现代格式，使用原图
        }

        return `optimized-images/${format}/${mappedName}.${format}`;
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