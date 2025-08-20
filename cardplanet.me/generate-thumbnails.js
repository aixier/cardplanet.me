#!/usr/bin/env node

/**
 * CardPlanet 缩略图自动生成器
 * 使用 Puppeteer 从 HTML 文件生成优化缩略图
 * 
 * 使用方法：
 * npm install puppeteer
 * node generate-thumbnails.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// 案例文件配置
const caseFiles = [
    {
        file: 'floral_flex_Chinese_Artistry_style_best.html',
        output: 'floral_flex_Chinese_Artistry.jpg'
    },
    {
        file: 'sydney_sweeney_Editorial_Soft_style.html',
        output: 'sydney_sweeney_Editorial_Soft.jpg'
    },
    {
        file: 'spacecore_drawstring_jean_Cosmic_Empire_style.html',
        output: 'spacecore_drawstring_Cosmic_Empire.jpg'
    },
    {
        file: 'depop_2005_closet_Pin_Board_style.html',
        output: 'depop_2005_closet_Pin_Board.jpg'
    },
    {
        file: 'no_try_summer_look_Minimal_style.html',
        output: 'no_try_summer_Minimal.jpg'
    },
    {
        file: 'lollapalooza_street_Luxe_Print_style.html',
        output: 'lollapalooza_street_Luxe_Print.jpg'
    },
    {
        file: 'lolitics_Bubble_Fresh_style.html',
        output: 'lolitics_Bubble_Fresh.jpg'
    },
    {
        file: 'pucci_swirls_genz_Geometric_Symphony_style.html',
        output: 'pucci_swirls_Geometric_Symphony.jpg'
    },
    {
        file: 'genz_career_shift_System_Clean_style.html',
        output: 'genz_career_System_Clean.jpg'
    },
    {
        file: 'brainrot_Impressionist_ Soft_style.html',
        output: 'brainrot_Impressionist_Soft.jpg'
    },
    {
        file: 'side_hustle_brand_Woven_Texture_style.html',
        output: 'side_hustle_Woven_Texture.jpg'
    },
    {
        file: 'matcha_man_Fluid_Zen_style.html',
        output: 'matcha_man_Fluid_Zen.jpg'
    }
];

// 配置参数
const config = {
    viewport: {
        width: 1200,   // 页面宽度
        height: 1800,  // 页面高度
        deviceScaleFactor: 2  // 高DPI，生成清晰图片
    },
    screenshot: {
        width: 320,    // 缩略图宽度
        height: 481,   // 缩略图高度 (3:4比例)
        quality: 85,   // JPG质量
        type: 'jpeg'
    },
    inputDir: './html-files',
    outputDir: './thumbnails',
    debug: false,  // 设置为true查看调试信息
    renderDelay: 5000  // 等待渲染完成的时间(毫秒)
};

async function generateThumbnail(browser, caseFile) {
    const page = await browser.newPage();
    
    try {
        // 设置视口大小
        await page.setViewport(config.viewport);
        
        // 加载HTML文件
        const filePath = path.join(config.inputDir, caseFile.file);
        const fileUrl = `file://${path.resolve(filePath)}`;
        
        console.log(`📄 加载页面: ${caseFile.file}`);
        await page.goto(fileUrl, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // 等待页面完全渲染和所有资源加载
        console.log(`⏳ 等待页面渲染完成...`);
        await page.waitForTimeout(config.renderDelay);
        
        // 等待所有图片和字体加载完成
        await page.evaluate(async () => {
            // 等待所有图片加载
            const images = Array.from(document.images);
            console.log(`🖼️ 等待 ${images.length} 个图片加载...`);
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    // 设置超时避免无限等待
                    setTimeout(resolve, 3000);
                });
            }));
            
            // 等待字体加载
            if (document.fonts) {
                console.log(`🔤 等待字体加载...`);
                await document.fonts.ready;
            }
            
            // 强制重绘页面
            document.body.style.display = 'none';
            document.body.offsetHeight; // 触发重排
            document.body.style.display = '';
            
            // 等待任何动画完成
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log(`✅ 页面渲染完成`);
        });
        
        // 额外等待确保样式应用
        await page.waitForTimeout(1000);
        
        // 查找卡片元素（尝试多种选择器）
        const cardSelectors = [
            '.card-container',
            '.knowledge-card', 
            '.main-card',
            '.card',
            '.content',
            'main',
            'body > div:first-child'
        ];
        
        let cardElement = null;
        let usedSelector = '';
        
        for (const selector of cardSelectors) {
            try {
                cardElement = await page.$(selector);
                if (cardElement) {
                    // 检查元素是否有实际内容
                    const bbox = await cardElement.boundingBox();
                    if (bbox && bbox.width > 100 && bbox.height > 100) {
                        usedSelector = selector;
                        console.log(`✅ 找到卡片元素: ${selector} (${Math.round(bbox.width)}x${Math.round(bbox.height)})`);
                        break;
                    }
                }
            } catch (e) {
                // 继续尝试下一个选择器
            }
        }
        
        // 生成截图
        const outputPath = path.join(config.outputDir, caseFile.output);
        
        if (cardElement && usedSelector) {
            // 滚动到元素位置确保可见
            await page.evaluate(element => {
                element.scrollIntoView({behavior: 'instant', block: 'start'});
            }, cardElement);
            
            await page.waitForTimeout(500);
            
            // 截取特定元素
            await cardElement.screenshot({
                path: outputPath,
                type: config.screenshot.type,
                quality: config.screenshot.quality
            });
            
            console.log(`📸 截取元素: ${usedSelector}`);
        } else {
            // 截取整个页面的卡片区域 (假设卡片在页面中央)
            console.log(`📸 使用全页面截图模式`);
            
            const fullScreenshot = await page.screenshot({
                type: 'png',
                fullPage: false
            });
            
            // 如果有Sharp，裁剪中央区域
            try {
                const sharp = require('sharp');
                const image = sharp(fullScreenshot);
                const { width, height } = await image.metadata();
                
                // 计算卡片可能的位置 (中央区域)
                const cardWidth = Math.min(width * 0.8, 800);
                const cardHeight = Math.min(height * 0.9, 1200);
                const left = Math.max(0, (width - cardWidth) / 2);
                const top = Math.max(0, (height - cardHeight) / 2);
                
                await image
                    .extract({
                        left: Math.round(left),
                        top: Math.round(top),
                        width: Math.round(cardWidth),
                        height: Math.round(cardHeight)
                    })
                    .jpeg({ quality: config.screenshot.quality })
                    .toFile(outputPath);
                    
                console.log(`🎨 智能裁剪: ${Math.round(cardWidth)}x${Math.round(cardHeight)}`);
            } catch (sharpError) {
                // 如果Sharp不可用，使用原始截图
                await fs.writeFile(outputPath, fullScreenshot);
                console.log(`📸 使用原始截图`);
            }
        }
        
        console.log(`✅ 生成缩略图: ${caseFile.output}`);
        
        // 使用Sharp进行图片优化（如果可用）
        try {
            const sharp = require('sharp');
            await sharp(outputPath)
                .resize(config.screenshot.width, config.screenshot.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ 
                    quality: config.screenshot.quality,
                    progressive: true
                })
                .toFile(outputPath.replace('.jpg', '_optimized.jpg'));
            
            // 替换原文件
            await fs.rename(
                outputPath.replace('.jpg', '_optimized.jpg'),
                outputPath
            );
            
            console.log(`🎨 图片已优化: ${caseFile.output}`);
        } catch (sharpError) {
            console.log(`ℹ️  Sharp不可用，跳过图片优化`);
        }
        
    } catch (error) {
        console.error(`❌ 生成 ${caseFile.file} 时出错:`, error.message);
    } finally {
        await page.close();
    }
}

async function ensureOutputDirectory() {
    try {
        await fs.access(config.outputDir);
    } catch {
        await fs.mkdir(config.outputDir, { recursive: true });
        console.log(`📁 创建输出目录: ${config.outputDir}`);
    }
}

async function main() {
    console.log('🚀 CardPlanet 缩略图生成器启动\n');
    
    // 确保输出目录存在
    await ensureOutputDirectory();
    
    // 启动浏览器
    console.log('🌐 启动浏览器...');
    const browser = await puppeteer.launch({
        headless: !config.debug, // 调试模式下显示浏览器
        devtools: config.debug,   // 调试模式下开启开发者工具
        slowMo: config.debug ? 1000 : 0, // 调试模式下减慢操作
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-extensions',
            '--no-first-run',
            '--disable-default-apps'
        ],
        defaultViewport: null
    });
    
    try {
        // 并行生成缩略图（最多3个并发）
        const concurrency = 3;
        for (let i = 0; i < caseFiles.length; i += concurrency) {
            const batch = caseFiles.slice(i, i + concurrency);
            const promises = batch.map(caseFile => 
                generateThumbnail(browser, caseFile)
            );
            await Promise.all(promises);
        }
        
        console.log('\n✅ 所有缩略图生成完成！');
        console.log(`📁 输出目录: ${path.resolve(config.outputDir)}`);
        
        // 生成统计报告
        const files = await fs.readdir(config.outputDir);
        const jpgFiles = files.filter(f => f.endsWith('.jpg'));
        console.log(`📊 共生成 ${jpgFiles.length} 个缩略图文件`);
        
    } catch (error) {
        console.error('❌ 生成过程中出现错误:', error);
    } finally {
        await browser.close();
        console.log('🔚 浏览器已关闭');
    }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// 运行主程序
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { generateThumbnail, config, caseFiles };