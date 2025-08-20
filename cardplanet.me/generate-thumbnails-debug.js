#!/usr/bin/env node

/**
 * CardPlanet 缩略图生成器 - 调试版本
 * 显示浏览器窗口，方便查看渲染过程和调试问题
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// 案例文件配置 - 先测试一个
const testCaseFiles = [
    {
        file: 'floral_flex_Chinese_Artistry_style_best.html',
        output: 'test_floral_flex_Chinese_Artistry.jpg'
    }
];

// 调试配置
const config = {
    viewport: {
        width: 1200,
        height: 1800,
        deviceScaleFactor: 2
    },
    screenshot: {
        width: 320,
        height: 481,
        quality: 85,
        type: 'jpeg'
    },
    inputDir: './html-files',
    outputDir: './thumbnails',
    debug: true,
    renderDelay: 8000  // 更长等待时间便于观察
};

async function debugThumbnail() {
    console.log('🐛 启动调试模式 - 将显示浏览器窗口');
    
    const browser = await puppeteer.launch({
        headless: false,  // 显示浏览器
        devtools: true,   // 开启开发者工具
        slowMo: 1000,     // 操作减慢1秒
        args: [
            '--no-sandbox',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--start-maximized'
        ],
        defaultViewport: null
    });

    const page = await browser.newPage();
    
    try {
        // 设置视口
        await page.setViewport(config.viewport);
        
        const caseFile = testCaseFiles[0];
        const filePath = path.join(config.inputDir, caseFile.file);
        const fileUrl = `file://${path.resolve(filePath)}`;
        
        console.log(`📄 加载页面: ${fileUrl}`);
        
        // 监听控制台消息
        page.on('console', msg => {
            console.log(`🖥️  页面日志:`, msg.text());
        });
        
        // 监听页面错误
        page.on('pageerror', error => {
            console.error(`❌ 页面错误:`, error.message);
        });
        
        await page.goto(fileUrl, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        console.log(`⏳ 等待 ${config.renderDelay/1000} 秒让页面完全渲染...`);
        console.log(`👀 请观察浏览器窗口中的渲染效果`);
        
        await page.waitForTimeout(config.renderDelay);
        
        // 分析页面结构
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                bodyHTML: document.body.innerHTML.substring(0, 500) + '...',
                images: Array.from(document.images).map(img => ({
                    src: img.src,
                    complete: img.complete,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                })),
                styles: Array.from(document.styleSheets).length,
                scripts: Array.from(document.scripts).length
            };
        });
        
        console.log('📊 页面分析:');
        console.log(`   标题: ${pageInfo.title}`);
        console.log(`   图片数量: ${pageInfo.images.length}`);
        console.log(`   样式表数量: ${pageInfo.styles}`);
        console.log(`   脚本数量: ${pageInfo.scripts}`);
        
        pageInfo.images.forEach((img, i) => {
            console.log(`   图片${i+1}: ${img.complete ? '✅' : '❌'} ${img.naturalWidth}x${img.naturalHeight}`);
        });
        
        // 尝试查找卡片元素
        const cardSelectors = [
            '.card-container',
            '.knowledge-card', 
            '.main-card',
            '.card',
            '.content',
            'main',
            'body > div:first-child',
            'body'
        ];
        
        console.log('🔍 查找卡片元素...');
        
        for (const selector of cardSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    const bbox = await element.boundingBox();
                    const isVisible = await page.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return style.display !== 'none' && 
                               style.visibility !== 'hidden' && 
                               style.opacity !== '0';
                    }, element);
                    
                    console.log(`   ${selector}: ${bbox ? `${Math.round(bbox.width)}x${Math.round(bbox.height)}` : '未定位'} ${isVisible ? '✅可见' : '❌隐藏'}`);
                    
                    if (bbox && bbox.width > 100 && bbox.height > 100 && isVisible) {
                        console.log(`🎯 将使用元素: ${selector}`);
                        
                        // 高亮显示元素
                        await page.evaluate(el => {
                            el.style.border = '3px solid red';
                            el.style.boxShadow = '0 0 10px red';
                        }, element);
                        
                        console.log(`🔴 已高亮显示选中的元素`);
                        console.log(`⏸️  按任意键继续截图...`);
                        
                        // 等待用户输入
                        process.stdin.setRawMode(true);
                        process.stdin.resume();
                        await new Promise(resolve => {
                            process.stdin.once('data', () => {
                                process.stdin.setRawMode(false);
                                process.stdin.pause();
                                resolve();
                            });
                        });
                        
                        // 移除高亮
                        await page.evaluate(el => {
                            el.style.border = '';
                            el.style.boxShadow = '';
                        }, element);
                        
                        // 截图
                        const outputPath = path.join(config.outputDir, caseFile.output);
                        await element.screenshot({
                            path: outputPath,
                            type: config.screenshot.type,
                            quality: config.screenshot.quality
                        });
                        
                        console.log(`✅ 截图已保存: ${outputPath}`);
                        
                        // 使用Sharp调整尺寸
                        try {
                            const sharp = require('sharp');
                            const optimizedPath = outputPath.replace('.jpg', '_optimized.jpg');
                            
                            await sharp(outputPath)
                                .resize(config.screenshot.width, config.screenshot.height, {
                                    fit: 'cover',
                                    position: 'center'
                                })
                                .jpeg({ 
                                    quality: config.screenshot.quality,
                                    progressive: true
                                })
                                .toFile(optimizedPath);
                            
                            console.log(`🎨 优化图片已保存: ${optimizedPath}`);
                            
                        } catch (sharpError) {
                            console.log(`ℹ️  Sharp不可用，跳过优化`);
                        }
                        
                        break;
                    }
                }
            } catch (e) {
                console.log(`   ${selector}: 查找失败`);
            }
        }
        
        console.log(`🏁 调试完成！请检查生成的文件`);
        console.log(`📁 输出目录: ${path.resolve(config.outputDir)}`);
        
    } catch (error) {
        console.error('❌ 调试过程中出错:', error);
    } finally {
        console.log(`⏸️  按任意键关闭浏览器...`);
        
        // 等待用户输入后关闭
        process.stdin.setRawMode(true);
        process.stdin.resume();
        await new Promise(resolve => {
            process.stdin.once('data', () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve();
            });
        });
        
        await browser.close();
        console.log('🔚 浏览器已关闭');
    }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// 运行调试
if (require.main === module) {
    debugThumbnail().catch(console.error);
}