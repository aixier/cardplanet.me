/**
 * 图片回退策略
 * 确保在优化图片不存在时能正常显示原始图片
 */

class ImageFallbackManager {
    constructor() {
        this.optimizedFormats = ['avif', 'webp'];
        this.originalPaths = new Map();
        this.init();
    }

    init() {
        // 扫描所有图片并建立回退映射
        this.mapOriginalPaths();
        
        // 设置图片错误处理
        this.setupErrorHandling();
        
        console.log('🔄 图片回退系统已初始化');
    }

    mapOriginalPaths() {
        // 建立优化图片到原始图片的映射
        const imageMap = {
            'floral_flex_Chinese_Artistry': 'samples/Chinese Artistry/card-3.png',
            'sydney_sweeney_Editorial_Soft': 'samples/Editorial Soft/card-1.png',
            'spacecore_drawstring_Cosmic_Empire': 'samples/Cosmic Empire/card-1.png',
            'matcha_man_Fluid_Zen': 'samples/Fluid Zen/card-1.png',
            'brainrot_Impressionist_Soft': 'samples/Impressionist Soft/card-1.png',
            'lolitics_Bubble_Fresh': 'samples/Bubble Fresh/card-1.png',
            'depop_2005_closet_Pin_Board': 'samples/Pin Board/card-1.png',
            'genz_career_shift_System_Clean': 'samples/System Clean/card-1.png',
            'lollapalooza_street_Luxe_Print': 'samples/Luxe Print/card-1.png',
            'no_try_summer_look_Minimal': 'samples/Minimal/card-1.png',
            'pucci_swirls_genz_Geometric_Symphony': 'samples/Geometric Symphony/card-1.png',
            'side_hustle_brand_Woven_Texture': 'samples/Woven Texture/card-1.png'
        };

        this.originalPaths = new Map(Object.entries(imageMap));
    }

    setupErrorHandling() {
        // 为所有图片设置错误处理
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    handleImageError(img) {
        const currentSrc = img.src;
        
        // 如果是优化格式失败，回退到原始图片
        if (this.isOptimizedPath(currentSrc)) {
            const originalPath = this.getOriginalPath(currentSrc);
            if (originalPath && img.src !== originalPath) {
                console.log(`🔄 图片回退: ${currentSrc} → ${originalPath}`);
                img.src = originalPath;
                return;
            }
        }

        // 如果有data-fallback属性，使用它
        if (img.dataset.fallback && img.src !== img.dataset.fallback) {
            console.log(`🔄 使用回退图片: ${img.dataset.fallback}`);
            img.src = img.dataset.fallback;
            return;
        }

        // 最后的回退：显示占位符
        this.showPlaceholder(img);
    }

    isOptimizedPath(src) {
        return src.includes('optimized-images/') || 
               src.includes('.webp') || 
               src.includes('.avif');
    }

    getOriginalPath(optimizedSrc) {
        // 从优化路径提取基础名称
        const basename = this.extractBasename(optimizedSrc);
        return this.originalPaths.get(basename);
    }

    extractBasename(path) {
        // 提取文件基础名称
        const filename = path.split('/').pop();
        const nameWithoutExt = filename.split('.')[0];
        // 移除尺寸后缀 (-small, -medium)
        return nameWithoutExt.replace(/-(small|medium)$/, '');
    }

    showPlaceholder(img) {
        // 创建SVG占位符
        const placeholder = `data:image/svg+xml;base64,${btoa(`
            <svg width="320" height="481" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f0f0f0"/>
                <text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="Arial" font-size="16">
                    Image Loading...
                </text>
            </svg>
        `)}`;
        
        img.src = placeholder;
        img.classList.add('image-placeholder');
    }

    // 检测优化图片是否存在
    async checkOptimizedImageExists(path) {
        try {
            const response = await fetch(path, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 获取最佳图片源（考虑回退）
    async getBestImageSrc(baseName, size = '', format = 'webp') {
        const formats = ['avif', 'webp', 'jpeg'];
        const sizes = [size, '-medium', '-small', ''].filter(Boolean);
        
        // 尝试不同格式和尺寸的组合
        for (const fmt of formats) {
            for (const sz of sizes) {
                const path = `optimized-images/${fmt}/${baseName}${sz}.${fmt}`;
                if (await this.checkOptimizedImageExists(path)) {
                    return path;
                }
            }
        }
        
        // 回退到原始图片
        return this.originalPaths.get(baseName);
    }
}

// 全局初始化
window.ImageFallbackManager = ImageFallbackManager;

// 页面加载后启动
document.addEventListener('DOMContentLoaded', () => {
    window.imageFallback = new ImageFallbackManager();
});