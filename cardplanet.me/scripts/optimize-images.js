#!/usr/bin/env node

/**
 * 高性能图片现代化优化脚本
 * 支持 WebP 和 AVIF 格式转换，多核并行处理
 * 生成响应式图片和懒加载配置
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const PerformanceConfig = require('./performance-config');

class ImageOptimizer {
    constructor() {
        this.sourceDir = './samples';
        this.outputDir = './optimized-images';
        this.thumbnailsDir = './thumbnails';
        this.supportedFormats = ['.png', '.jpg', '.jpeg'];
        this.targetFormats = ['webp', 'avif'];
        
        // 获取优化的性能配置
        const perfConfig = PerformanceConfig.getOptimalConfig();
        this.maxWorkers = perfConfig.maxWorkers;
        this.chunkSize = perfConfig.chunkSize;
        this.concurrency = perfConfig.concurrency;
        this.quality = perfConfig.quality;
        this.avifEffort = perfConfig.avifEffort;
        this.webpEffort = perfConfig.webpEffort;
        
        // Sharp性能优化配置
        sharp.concurrency(this.maxWorkers);
        sharp.cache({ memory: 100, files: 20, items: 200 });
    }

    async init() {
        // 创建输出目录
        await this.ensureDir(this.outputDir);
        await this.ensureDir(path.join(this.outputDir, 'webp'));
        await this.ensureDir(path.join(this.outputDir, 'avif'));
        console.log('📁 输出目录已创建');
    }

    async ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    async findImages() {
        const images = [];
        
        // 扫描samples目录
        const walk = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    walk(filePath);
                } else if (this.supportedFormats.includes(path.extname(file).toLowerCase())) {
                    images.push({
                        path: filePath,
                        name: path.basename(file, path.extname(file)),
                        ext: path.extname(file),
                        relativePath: path.relative('.', filePath)
                    });
                }
            });
        };

        if (fs.existsSync(this.sourceDir)) {
            walk(this.sourceDir);
        }

        // 扫描thumbnails目录
        if (fs.existsSync(this.thumbnailsDir)) {
            walk(this.thumbnailsDir);
        }

        console.log(`🔍 发现 ${images.length} 张图片待优化`);
        return images;
    }

    // 并行处理图片批次
    async optimizeImagesBatch(images) {
        const chunks = this.chunkArray(images, this.chunkSize);
        const allResults = [];
        
        console.log(`📦 分批处理: ${chunks.length}个批次，每批${this.chunkSize}张图片`);
        
        // 使用 Promise.all 并行处理所有批次
        const batchPromises = chunks.map((chunk, index) => 
            this.processBatchWithWorker(chunk, index)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        // 合并所有结果
        batchResults.forEach(results => {
            if (results && results.length > 0) {
                allResults.push(...results);
            }
        });
        
        return allResults;
    }

    // 将数组分割成指定大小的块
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    // 使用Worker线程处理批次
    async processBatchWithWorker(imagesBatch, batchIndex) {
        return new Promise((resolve, reject) => {
            const workerScript = `
                const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
                const sharp = require('sharp');
                const fs = require('fs');
                const path = require('path');

                if (!isMainThread) {
                    const { images, config, batchIndex } = workerData;
                    
                    async function processImages() {
                        const results = [];
                        
                        for (const image of images) {
                            try {
                                const imageResults = await optimizeImage(image, config);
                                results.push(...imageResults);
                            } catch (error) {
                                console.error(\`❌ Worker[\${batchIndex}] 处理失败: \${image.relativePath} - \${error.message}\`);
                            }
                        }
                        
                        parentPort.postMessage(results);
                    }

                    async function optimizeImage(image, config) {
                        const results = [];
                        
                        // 获取原始图片信息
                        const metadata = await sharp(image.path).metadata();
                        const originalSize = fs.statSync(image.path).size;
                        
                        console.log(\`🔄 Worker[\${batchIndex}] 处理: \${image.relativePath} (\${metadata.width}x\${metadata.height}, \${(originalSize / 1024).toFixed(1)}KB)\`);

                        // 生成不同格式和尺寸
                        const sizes = [
                            { suffix: '', width: metadata.width }, // 原始尺寸
                            { suffix: '-small', width: 320 },       // 小尺寸
                            { suffix: '-medium', width: 640 }       // 中等尺寸
                        ];

                        // 并行处理所有格式和尺寸的组合
                        const tasks = [];
                        
                        for (const format of config.targetFormats) {
                            for (const size of sizes) {
                                tasks.push(processImageVariant(image, format, size, config, originalSize));
                            }
                        }
                        
                        const taskResults = await Promise.all(tasks);
                        return taskResults.filter(result => result !== null);
                    }

                    async function processImageVariant(image, format, size, config, originalSize) {
                        try {
                            const outputName = \`\${image.name}\${size.suffix}.\${format}\`;
                            const outputPath = path.join(config.outputDir, format, outputName);

                            let pipeline = sharp(image.path);
                            
                            // 调整尺寸（如果需要）
                            if (size.width < await sharp(image.path).metadata().then(m => m.width)) {
                                pipeline = pipeline.resize(size.width, null, {
                                    withoutEnlargement: true,
                                    fit: 'inside',
                                    kernel: sharp.kernel.lanczos3 // 更好的缩放算法
                                });
                            }

                            // 应用格式和质量设置
                            if (format === 'webp') {
                                pipeline = pipeline.webp({ 
                                    quality: config.quality.webp,
                                    effort: config.webpEffort,
                                    smartSubsample: true,
                                    reductionEffort: 6,
                                    nearLossless: false,
                                    alphaQuality: 100
                                });
                            } else if (format === 'avif') {
                                pipeline = pipeline.avif({ 
                                    quality: config.quality.avif,
                                    effort: config.avifEffort,
                                    chromaSubsampling: '4:2:0',
                                    speed: 6 // 加速编码
                                });
                            }

                            await pipeline.toFile(outputPath);
                            
                            const newSize = fs.statSync(outputPath).size;
                            const compression = ((originalSize - newSize) / originalSize * 100).toFixed(1);
                            
                            return {
                                format,
                                size: size.suffix,
                                path: outputPath,
                                originalSize,
                                newSize,
                                compression: \`\${compression}%\`,
                                imageName: image.name
                            };
                        } catch (error) {
                            console.error(\`❌ 格式变体处理失败: \${format}\${size.suffix} - \${error.message}\`);
                            return null;
                        }
                    }

                    processImages().catch(error => {
                        console.error(\`❌ Worker[\${batchIndex}] 批次处理失败:\`, error);
                        parentPort.postMessage([]);
                    });
                }
            `;

            // 创建临时worker文件
            const workerFile = path.join(__dirname, `worker-${batchIndex}-${Date.now()}.js`);
            fs.writeFileSync(workerFile, workerScript);

            const worker = new Worker(workerFile, {
                workerData: {
                    images: imagesBatch,
                    config: {
                        targetFormats: this.targetFormats,
                        quality: this.quality,
                        outputDir: this.outputDir,
                        avifEffort: this.avifEffort,
                        webpEffort: this.webpEffort
                    },
                    batchIndex
                }
            });

            worker.on('message', (results) => {
                // 清理临时文件
                fs.unlinkSync(workerFile);
                resolve(results);
            });

            worker.on('error', (error) => {
                console.error(`❌ Worker[${batchIndex}] 错误:`, error);
                fs.unlinkSync(workerFile);
                reject(error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`❌ Worker[${batchIndex}] 异常退出，代码: ${code}`);
                }
            });
        });
    }

    async generateManifest(optimizedImages) {
        const manifest = {
            generated: new Date().toISOString(),
            images: {},
            stats: {
                totalOriginal: 0,
                totalOptimized: 0,
                totalSaved: 0,
                compressionRatio: 0
            }
        };

        optimizedImages.forEach(imageResults => {
            imageResults.forEach(result => {
                const key = path.basename(result.path, path.extname(result.path));
                
                if (!manifest.images[key]) {
                    manifest.images[key] = {
                        original: result.originalSize,
                        formats: {}
                    };
                }

                manifest.images[key].formats[result.format + result.size] = {
                    path: result.path,
                    size: result.newSize,
                    compression: result.compression
                };

                manifest.stats.totalOriginal += result.originalSize;
                manifest.stats.totalOptimized += result.newSize;
            });
        });

        manifest.stats.totalSaved = manifest.stats.totalOriginal - manifest.stats.totalOptimized;
        manifest.stats.compressionRatio = ((manifest.stats.totalSaved / manifest.stats.totalOriginal) * 100).toFixed(1);

        const manifestPath = path.join(this.outputDir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        console.log(`\n📊 优化统计:`);
        console.log(`   原始总大小: ${(manifest.stats.totalOriginal / 1024 / 1024).toFixed(1)}MB`);
        console.log(`   优化后大小: ${(manifest.stats.totalOptimized / 1024 / 1024).toFixed(1)}MB`);
        console.log(`   节省空间: ${(manifest.stats.totalSaved / 1024 / 1024).toFixed(1)}MB (${manifest.stats.compressionRatio}%)`);
        console.log(`   清单文件: ${manifestPath}`);

        return manifest;
    }

    async run() {
        const startTime = process.hrtime.bigint();
        console.log('🚀 开始高性能图片现代化优化...\n');
        
        // 启动性能监控
        const perfMonitor = PerformanceConfig.monitorPerformance();
        
        await this.init();
        const images = await this.findImages();
        
        if (images.length === 0) {
            console.log('⚠️  没有找到需要优化的图片');
            clearInterval(perfMonitor);
            return;
        }

        console.log(`⚡ 使用 ${this.maxWorkers} 个Worker线程并行处理 ${images.length} 张图片`);
        console.log(`📊 预计生成 ${images.length * this.targetFormats.length * 3} 个优化文件\n`);

        // 使用并行批处理
        const optimizedImages = await this.optimizeImagesBatch(images);

        // 显示详细统计
        this.displayOptimizationStats(optimizedImages);

        await this.generateManifest(optimizedImages);
        
        // 停止性能监控
        clearInterval(perfMonitor);
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
        
        console.log('\n🎉 高性能图片优化完成！');
        console.log(`⏱️  总耗时: ${(duration / 1000).toFixed(2)}秒`);
        console.log(`🚀 平均速度: ${(images.length / (duration / 1000)).toFixed(1)} 张/秒`);
        console.log(`💾 内存峰值: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`);
        console.log('💡 下一步: 运行 npm run dev 查看优化效果');
        
        // 清理Sharp缓存
        sharp.cache(false);
    }

    // 优化统计显示
    displayOptimizationStats(optimizedImages) {
        const formatStats = {};
        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;
        
        optimizedImages.forEach(result => {
            if (!formatStats[result.format]) {
                formatStats[result.format] = {
                    count: 0,
                    originalSize: 0,
                    optimizedSize: 0,
                    savings: []
                };
            }
            
            formatStats[result.format].count++;
            formatStats[result.format].originalSize += result.originalSize;
            formatStats[result.format].optimizedSize += result.newSize;
            formatStats[result.format].savings.push(parseFloat(result.compression));
            
            totalOriginalSize += result.originalSize;
            totalOptimizedSize += result.newSize;
        });

        console.log('\n📊 优化统计:');
        Object.entries(formatStats).forEach(([format, stats]) => {
            const avgSavings = stats.savings.reduce((a, b) => a + b, 0) / stats.savings.length;
            console.log(`   ${format.toUpperCase()}: ${stats.count}文件, 平均节省${avgSavings.toFixed(1)}%`);
        });
        
        const totalSavings = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
        console.log(`   总计: ${(totalOriginalSize / 1024 / 1024).toFixed(1)}MB → ${(totalOptimizedSize / 1024 / 1024).toFixed(1)}MB (节省${totalSavings}%)`);
    }
}

// 执行优化
if (require.main === module) {
    const optimizer = new ImageOptimizer();
    optimizer.run().catch(console.error);
}

module.exports = ImageOptimizer;