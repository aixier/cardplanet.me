/**
 * 性能优化配置
 * 根据系统资源自动调整参数
 */

const os = require('os');

class PerformanceConfig {
    static getOptimalConfig() {
        const cpuCount = os.cpus().length;
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
        
        console.log(`💻 系统信息:`);
        console.log(`   CPU核心: ${cpuCount}`);
        console.log(`   总内存: ${(totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB`);
        console.log(`   可用内存: ${(freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB`);
        console.log(`   内存使用率: ${memoryUsagePercent.toFixed(1)}%`);
        
        let config = {
            maxWorkers: Math.min(cpuCount, 8),
            chunkSize: 4,
            concurrency: cpuCount * 2,
            avifEffort: 6,
            webpEffort: 6,
            quality: {
                webp: 85,
                avif: 60
            }
        };
        
        // 根据CPU核心数调整
        if (cpuCount >= 16) {
            config.maxWorkers = 12;
            config.chunkSize = 6;
            config.avifEffort = 7;
        } else if (cpuCount >= 8) {
            config.maxWorkers = 8;
            config.chunkSize = 4;
            config.avifEffort = 6;
        } else if (cpuCount >= 4) {
            config.maxWorkers = 4;
            config.chunkSize = 3;
            config.avifEffort = 5;
        } else {
            config.maxWorkers = 2;
            config.chunkSize = 2;
            config.avifEffort = 4;
            config.webpEffort = 4;
        }
        
        // 根据内存使用率调整
        if (memoryUsagePercent > 80) {
            config.maxWorkers = Math.max(1, Math.floor(config.maxWorkers * 0.6));
            config.chunkSize = Math.max(1, Math.floor(config.chunkSize * 0.7));
            console.log(`⚠️  内存使用率较高，降低并发度: ${config.maxWorkers} workers, 批次大小 ${config.chunkSize}`);
        }
        
        // 根据可用内存调整质量设置
        const availableMemoryGB = freeMemory / 1024 / 1024 / 1024;
        if (availableMemoryGB < 2) {
            config.quality.avif = 50;
            config.avifEffort = 4;
            console.log(`⚠️  可用内存较低，降低AVIF质量和努力程度`);
        }
        
        console.log(`⚡ 优化配置:`);
        console.log(`   Worker线程: ${config.maxWorkers}`);
        console.log(`   批次大小: ${config.chunkSize}`);
        console.log(`   AVIF努力程度: ${config.avifEffort}`);
        console.log(`   WebP努力程度: ${config.webpEffort}`);
        console.log(`   质量设置: WebP ${config.quality.webp}%, AVIF ${config.quality.avif}%\n`);
        
        return config;
    }
    
    static monitorPerformance() {
        const interval = setInterval(() => {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            console.log(`📊 实时监控: 内存 ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB, CPU 使用中...`);
        }, 5000);
        
        // 10分钟后自动停止监控
        setTimeout(() => {
            clearInterval(interval);
        }, 600000);
        
        return interval;
    }
}

module.exports = PerformanceConfig;