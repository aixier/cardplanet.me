#!/usr/bin/env node

/**
 * CardPlanet 优化缩略图生成器
 * 基于成功的测试方法，生成所有HTML文件的高质量缩略图
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const caseFiles = [
    { file: 'floral_flex_Chinese_Artistry_style_best.html', output: 'floral_flex_Chinese_Artistry.jpg', url: 'html-files/floral_flex_Chinese_Artistry_style_best.html' },
    { file: 'sydney_sweeney_Editorial_Soft_style.html', output: 'sydney_sweeney_Editorial_Soft.jpg', url: 'html-files/sydney_sweeney_Editorial_Soft_style.html' },
    { file: 'spacecore_drawstring_jean_Cosmic_Empire_style.html', output: 'spacecore_drawstring_Cosmic_Empire.jpg', url: 'html-files/spacecore_drawstring_jean_Cosmic_Empire_style.html' },
    { file: 'depop_2005_closet_Pin_Board_style.html', output: 'depop_2005_closet_Pin_Board.jpg', url: 'html-files/depop_2005_closet_Pin_Board_style.html' },
    { file: 'no_try_summer_look_Minimal_style.html', output: 'no_try_summer_Minimal.jpg', url: 'html-files/no_try_summer_look_Minimal_style.html' },
    { file: 'lollapalooza_street_Luxe_Print_style.html', output: 'lollapalooza_street_Luxe_Print.jpg', url: 'html-files/lollapalooza_street_Luxe_Print_style.html' },
    { file: 'lolitics_Bubble_Fresh_style.html', output: 'lolitics_Bubble_Fresh.jpg', url: 'html-files/lolitics_Bubble_Fresh_style.html' },
    { file: 'pucci_swirls_genz_Geometric_Symphony_style.html', output: 'pucci_swirls_Geometric_Symphony.jpg', url: 'html-files/pucci_swirls_genz_Geometric_Symphony_style.html' },
    { file: 'genz_career_shift_System_Clean_style.html', output: 'genz_career_System_Clean.jpg', url: 'html-files/genz_career_shift_System_Clean_style.html' },
    { file: 'brainrot_Impressionist_ Soft_style.html', output: 'brainrot_Impressionist_Soft.jpg', url: 'html-files/brainrot_Impressionist_ Soft_style.html' },
    { file: 'side_hustle_brand_Woven_Texture_style.html', output: 'side_hustle_Woven_Texture.jpg', url: 'html-files/side_hustle_brand_Woven_Texture_style.html' },
    { file: 'matcha_man_Fluid_Zen_style.html', output: 'matcha_man_Fluid_Zen.jpg', url: 'html-files/matcha_man_Fluid_Zen_style.html' }
];

async function generateOptimizedThumbnail(page, caseFile) {
    try {
        const filePath = path.join('./html-files', caseFile.file);
        const fileUrl = `file://${path.resolve(filePath)}`;
        
        console.log(`📄 处理: ${caseFile.file}`);
        
        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch (error) {
            console.log(`⚠️  文件不存在，跳过: ${caseFile.file}`);
            return false;
        }
        
        // 加载页面 - 使用成功测试的方法
        await page.goto(fileUrl, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // 等待8秒确保完全渲染（基于成功测试）
        console.log(`⏳ 等待 8 秒确保渲染完成...`);
        await page.waitForTimeout(8000);
        
        // 分析页面信息
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                bodyHeight: document.body.scrollHeight,
                bodyWidth: document.body.scrollWidth,
                cardCount: document.querySelectorAll('.tutorial-card').length
            };
        });
        
        console.log(`📊 页面: ${pageInfo.title || caseFile.file}`);
        console.log(`📏 尺寸: ${pageInfo.bodyWidth}x${pageInfo.bodyHeight}`);
        
        // 截取完整页面
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true
        });
        
        // 使用Sharp优化处理
        const sharp = require('sharp');
        const image = sharp(screenshot);
        const metadata = await image.metadata();
        
        // 完整内容裁剪 - 包含所有8个卡片和社交媒体区域
        const cropWidth = metadata.width;                // 保持完整宽度
        const cropHeight = metadata.height - 50;         // 去掉底部少量空白
        const left = 0;                                  // 不裁剪左边
        const top = 0;                                   // 从顶部开始
        
        const outputPath = path.join('./thumbnails', caseFile.output);
        
        // 生成高度压缩的缩略图
        await image
            .extract({
                left: left,
                top: top,
                width: cropWidth,
                height: cropHeight
            })
            .resize(320, 481, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ 
                quality: 75,        // 降低质量以减少文件大小
                progressive: true,  // 渐进式加载
                mozjpeg: true      // 使用mozjpeg优化
            })
            .toFile(outputPath);
        
        // 检查文件大小
        const stats = await fs.stat(outputPath);
        const fileSizeKB = Math.round(stats.size / 1024);
        
        console.log(`✅ 生成: ${caseFile.output} (${fileSizeKB}KB)`);
        return true;
        
    } catch (error) {
        console.error(`❌ 失败: ${caseFile.file} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 CardPlanet 优化缩略图生成器');
    console.log('📋 特点: 完整渲染 + 智能裁剪 + 高度压缩\n');
    
    // 确保输出目录存在
    await fs.mkdir('./thumbnails', { recursive: true });
    
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-file-access-from-files'
        ]
    });
    
    const page = await browser.newPage();
    
    // 设置视口
    await page.setViewport({
        width: 1200,
        height: 1800,
        deviceScaleFactor: 1
    });
    
    try {
        let successCount = 0;
        let totalSize = 0;
        
        // 处理每个文件
        for (let i = 0; i < caseFiles.length; i++) {
            console.log(`\n[${i + 1}/${caseFiles.length}] 处理文件:`);
            if (await generateOptimizedThumbnail(page, caseFiles[i])) {
                successCount++;
                
                // 累计文件大小
                try {
                    const stats = await fs.stat(`./thumbnails/${caseFiles[i].output}`);
                    totalSize += stats.size;
                } catch (e) {}
            }
        }
        
        console.log(`\n🎉 生成完成！`);
        console.log(`📊 成功: ${successCount}/${caseFiles.length}`);
        console.log(`📁 总大小: ${Math.round(totalSize / 1024)}KB`);
        console.log(`📁 平均大小: ${Math.round(totalSize / 1024 / successCount)}KB/张`);
        
        // 检查生成的文件
        const files = await fs.readdir('./thumbnails');
        const jpgFiles = files.filter(f => f.endsWith('.jpg'));
        console.log(`📁 生成文件数: ${jpgFiles.length}`);
        
    } finally {
        await browser.close();
    }
}

main().catch(console.error);