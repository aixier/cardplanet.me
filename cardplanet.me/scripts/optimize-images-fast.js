#!/usr/bin/env node

/**
 * 超高速图片优化脚本
 * 优化重点：速度优先，质量其次
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const cluster = require('cluster');

class FastImageOptimizer {
    constructor(options = {}) {
        this.mode = options.mode || 'fast'; // fast, balanced, quality
        this.sourceDir = './samples';
        this.outputDir = './optimized-images';
        this.thumbnailsDir = './thumbnails';
        
        // 性能配置根据模式调整
        this.setupMode(this.mode);
        
        // Sharp全局优化
        sharp.concurrency(this.concurrency);
        sharp.cache({ memory: 200, files: 50, items: 500 });
        sharp.simd(true); // 启用SIMD加速
    }

    setupMode(mode) {
        const cpuCount = os.cpus().length;
        
        switch(mode) {
            case 'ultra-fast':
                // 极速模式：只生成WebP，最低质量设置
                this.targetFormats = ['webp'];
                this.sizes = [{ suffix: '', width: null }]; // 只保留原始尺寸
                this.quality = { webp: 75, avif: 40 };
                this.effort = { webp: 1, avif: 1 };
                this.concurrency = cpuCount * 2;
                this.batchSize = 20;
                console.log('⚡ 极速模式：最快速度，基础质量');
                break;
                
            case 'fast':
                // 快速模式：WebP优先，简化尺寸
                this.targetFormats = ['webp'];
                this.sizes = [
                    { suffix: '', width: null },
                    { suffix: '-small', width: 640 }
                ];
                this.quality = { webp: 80, avif: 45 };
                this.effort = { webp: 2, avif: 2 };
                this.concurrency = cpuCount;
                this.batchSize = 10;
                console.log('🚀 快速模式：高速处理，良好质量');
                break;
                
            case 'balanced':
                // 平衡模式
                this.targetFormats = ['webp', 'avif'];
                this.sizes = [
                    { suffix: '', width: null },
                    { suffix: '-medium', width: 640 }
                ];
                this.quality = { webp: 85, avif: 50 };
                this.effort = { webp: 4, avif: 3 };
                this.concurrency = Math.ceil(cpuCount * 0.75);
                this.batchSize = 6;
                console.log('⚖️ 平衡模式：速度与质量兼顾');
                break;
                
            case 'quality':
                // 质量模式
                this.targetFormats = ['webp', 'avif'];
                this.sizes = [
                    { suffix: '', width: null },
                    { suffix: '-small', width: 320 },
                    { suffix: '-medium', width: 640 }
                ];
                this.quality = { webp: 90, avif: 65 };
                this.effort = { webp: 6, avif: 5 };
                this.concurrency = Math.ceil(cpuCount * 0.5);
                this.batchSize = 4;
                console.log('🎨 质量模式：最佳质量，速度较慢');
                break;
                
            default:
                this.setupMode('fast');
        }
    }

    async init() {
        // 创建输出目录
        for (const format of this.targetFormats) {
            const dir = path.join(this.outputDir, format);
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async findImages() {
        const images = [];
        const extensions = ['.png', '.jpg', '.jpeg'];
        
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        await scanDir(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        if (extensions.includes(ext)) {
                            images.push({
                                path: fullPath,
                                name: path.basename(entry.name, ext),
                                dir: dir,
                                size: (await fs.stat(fullPath)).size
                            });
                        }
                    }
                }
            } catch (error) {
                console.error(`扫描目录失败: ${dir}`, error.message);
            }
        }

        // 扫描源目录
        if (fsSync.existsSync(this.sourceDir)) {
            await scanDir(this.sourceDir);
        }
        if (fsSync.existsSync(this.thumbnailsDir)) {
            await scanDir(this.thumbnailsDir);
        }

        return images;
    }

    async processImage(image) {
        const results = [];
        const startTime = Date.now();
        
        try {
            // 读取图片一次，重复使用
            const inputBuffer = await fs.readFile(image.path);
            const metadata = await sharp(inputBuffer).metadata();
            
            // 并行处理所有变体
            const tasks = [];
            
            for (const format of this.targetFormats) {
                for (const size of this.sizes) {
                    tasks.push(this.createVariant(inputBuffer, metadata, image, format, size));
                }
            }
            
            const variants = await Promise.all(tasks);
            results.push(...variants.filter(v => v !== null));
            
            const duration = Date.now() - startTime;
            console.log(`✅ ${image.name} 处理完成 (${duration}ms)`);
            
        } catch (error) {
            console.error(`❌ ${image.name} 处理失败:`, error.message);
        }
        
        return results;
    }

    async createVariant(inputBuffer, metadata, image, format, size) {
        try {
            const outputName = `${image.name}${size.suffix}.${format}`;
            const outputPath = path.join(this.outputDir, format, outputName);
            
            let pipeline = sharp(inputBuffer);
            
            // 调整尺寸
            if (size.width && size.width < metadata.width) {
                pipeline = pipeline.resize(size.width, null, {
                    withoutEnlargement: true,
                    fastShrinkOnLoad: true, // 快速缩放
                    kernel: sharp.kernel.nearest // 最快的算法
                });
            }
            
            // 格式转换
            if (format === 'webp') {
                pipeline = pipeline.webp({
                    quality: this.quality.webp,
                    effort: this.effort.webp,
                    preset: 'photo', // 针对照片优化
                    smartSubsample: false, // 关闭智能子采样提速
                    nearLossless: false,
                    reductionEffort: this.effort.webp
                });
            } else if (format === 'avif') {
                pipeline = pipeline.avif({
                    quality: this.quality.avif,
                    effort: this.effort.avif,
                    speed: 8, // 最快速度
                    chromaSubsampling: '4:2:0'
                });
            }
            
            const outputBuffer = await pipeline.toBuffer();
            await fs.writeFile(outputPath, outputBuffer);
            
            return {
                format,
                size: size.suffix,
                path: outputPath,
                originalSize: image.size,
                newSize: outputBuffer.length,
                compression: ((1 - outputBuffer.length / image.size) * 100).toFixed(1)
            };
            
        } catch (error) {
            console.error(`变体创建失败 ${format}${size.suffix}:`, error.message);
            return null;
        }
    }

    async processBatch(images) {
        const batchStart = Date.now();
        const results = await Promise.all(images.map(img => this.processImage(img)));
        const batchDuration = Date.now() - batchStart;
        
        console.log(`📦 批次完成：${images.length}张图片，耗时${(batchDuration/1000).toFixed(1)}秒`);
        
        return results.flat();
    }

    async run() {
        console.log(`
╔════════════════════════════════════════╗
║     超高速图片优化 - ${this.mode.toUpperCase()} 模式     ║
╚════════════════════════════════════════╝
`);
        
        const startTime = Date.now();
        
        // 显示系统信息
        console.log(`💻 系统配置：`);
        console.log(`   CPU核心: ${os.cpus().length}`);
        console.log(`   内存: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB`);
        console.log(`   并发数: ${this.concurrency}`);
        console.log(`   批次大小: ${this.batchSize}\n`);
        
        await this.init();
        
        // 查找图片
        const images = await this.findImages();
        if (images.length === 0) {
            console.log('⚠️ 没有找到图片');
            return;
        }
        
        console.log(`📷 找到 ${images.length} 张图片\n`);
        console.log(`开始处理...\n`);
        
        // 分批处理
        const batches = [];
        for (let i = 0; i < images.length; i += this.batchSize) {
            batches.push(images.slice(i, i + this.batchSize));
        }
        
        // 并行处理所有批次
        const allResults = [];
        for (let i = 0; i < batches.length; i++) {
            console.log(`\n🔄 处理批次 ${i + 1}/${batches.length}`);
            const batchResults = await this.processBatch(batches[i]);
            allResults.push(...batchResults);
        }
        
        // 生成统计
        const duration = (Date.now() - startTime) / 1000;
        this.showStats(allResults, images.length, duration);
        
        // 生成清单
        await this.generateManifest(allResults);
    }

    showStats(results, imageCount, duration) {
        let totalOriginal = 0;
        let totalOptimized = 0;
        
        results.forEach(result => {
            totalOriginal += result.originalSize;
            totalOptimized += result.newSize;
        });
        
        const savings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);
        const speed = (imageCount / duration).toFixed(1);
        
        console.log(`
╔════════════════════════════════════════╗
║            优化完成统计                 ║
╠════════════════════════════════════════╣
║ 🎉 处理图片: ${imageCount} 张
║ ⏱️  总耗时: ${duration.toFixed(1)} 秒
║ 🚀 处理速度: ${speed} 张/秒
║ 📦 原始大小: ${(totalOriginal / 1024 / 1024).toFixed(1)} MB
║ 📦 优化后: ${(totalOptimized / 1024 / 1024).toFixed(1)} MB
║ 💾 节省空间: ${savings}%
║ 💻 内存使用: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB
╚════════════════════════════════════════╝
        `);
    }

    async generateManifest(results) {
        const manifest = {
            generated: new Date().toISOString(),
            mode: this.mode,
            stats: {
                totalImages: results.length,
                formats: this.targetFormats,
                sizes: this.sizes.map(s => s.suffix || 'original')
            },
            images: results
        };
        
        const manifestPath = path.join(this.outputDir, 'manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log(`\n📋 清单已保存: ${manifestPath}`);
    }
}

// 主程序
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'fast';
    
    const validModes = ['ultra-fast', 'fast', 'balanced', 'quality'];
    if (!validModes.includes(mode)) {
        console.log(`
使用方法：
  node optimize-images-fast.js [mode]

模式选项：
  ultra-fast  - 极速模式 (只WebP，最快)
  fast        - 快速模式 (推荐)
  balanced    - 平衡模式
  quality     - 质量模式

示例：
  node optimize-images-fast.js fast
        `);
        process.exit(1);
    }
    
    const optimizer = new FastImageOptimizer({ mode });
    await optimizer.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FastImageOptimizer;