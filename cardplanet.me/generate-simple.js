#!/usr/bin/env node

/**
 * CardPlanet 简化缩略图生成器
 * 专注于可靠性，确保完整渲染后截图
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

const caseFiles = [
    { file: 'floral_flex_Chinese_Artistry_style_best.html', output: 'floral_flex_Chinese_Artistry.jpg' },
    { file: 'sydney_sweeney_Editorial_Soft_style.html', output: 'sydney_sweeney_Editorial_Soft.jpg' },
    { file: 'spacecore_drawstring_jean_Cosmic_Empire_style.html', output: 'spacecore_drawstring_Cosmic_Empire.jpg' },
    { file: 'depop_2005_closet_Pin_Board_style.html', output: 'depop_2005_closet_Pin_Board.jpg' },
    { file: 'no_try_summer_look_Minimal_style.html', output: 'no_try_summer_Minimal.jpg' },
    { file: 'lollapalooza_street_Luxe_Print_style.html', output: 'lollapalooza_street_Luxe_Print.jpg' },
    { file: 'lolitics_Bubble_Fresh_style.html', output: 'lolitics_Bubble_Fresh.jpg' },
    { file: 'pucci_swirls_genz_Geometric_Symphony_style.html', output: 'pucci_swirls_Geometric_Symphony.jpg' },
    { file: 'genz_career_shift_System_Clean_style.html', output: 'genz_career_System_Clean.jpg' },
    { file: 'brainrot_Impressionist_ Soft_style.html', output: 'brainrot_Impressionist_Soft.jpg' },
    { file: 'side_hustle_brand_Woven_Texture_style.html', output: 'side_hustle_Woven_Texture.jpg' },
    { file: 'matcha_man_Fluid_Zen_style.html', output: 'matcha_man_Fluid_Zen.jpg' }
];

async function generateThumbnail(page, caseFile) {
    try {
        const filePath = path.join('./html-files', caseFile.file);
        const fileUrl = `file://${path.resolve(filePath)}`;
        
        console.log(`📄 处理: ${caseFile.file}`);
        
        // 加载页面
        await page.goto(fileUrl, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        // 强制等待确保完全渲染
        console.log(`⏳ 等待 10 秒确保页面完全渲染...`);
        await page.waitForTimeout(10000);
        
        // 强制刷新渲染
        await page.evaluate(() => {
            // 强制重新计算样式
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                el.style.display = el.style.display;
            });
            
            // 触发重排
            document.body.offsetHeight;
            
            // 滚动一下确保所有内容都渲染了
            window.scrollTo(0, 100);
            window.scrollTo(0, 0);
        });
        
        await page.waitForTimeout(2000);
        
        // 截取整个页面，然后裁剪
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true
        });
        
        // 使用Sharp处理图片
        const sharp = require('sharp');
        const image = sharp(screenshot);
        const metadata = await image.metadata();
        
        console.log(`📏 原始尺寸: ${metadata.width}x${metadata.height}`);
        
        // 计算裁剪区域 - 假设卡片在页面中央80%区域
        const cropWidth = Math.min(metadata.width * 0.8, 800);
        const cropHeight = Math.min(metadata.height * 0.8, 1200);
        const left = Math.max(0, (metadata.width - cropWidth) / 2);
        const top = Math.max(0, (metadata.height - cropHeight) / 6); // 稍微偏上一点
        
        const outputPath = path.join('./thumbnails', caseFile.output);
        
        await image
            .extract({
                left: Math.round(left),
                top: Math.round(top),
                width: Math.round(cropWidth),
                height: Math.round(cropHeight)
            })
            .resize(320, 481, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ 
                quality: 85,
                progressive: true
            })
            .toFile(outputPath);
        
        console.log(`✅ 生成: ${caseFile.output} (裁剪区域: ${Math.round(cropWidth)}x${Math.round(cropHeight)})`);
        return true;
        
    } catch (error) {
        console.error(`❌ 失败: ${caseFile.file} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 CardPlanet 简化缩略图生成器');
    console.log('📋 特点: 长时间等待 + 全页截图 + 智能裁剪\n');
    
    // 确保输出目录存在
    await fs.mkdir('./thumbnails', { recursive: true });
    
    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    });
    
    const page = await browser.newPage();
    
    // 设置大视口
    await page.setViewport({
        width: 1200,
        height: 1800,
        deviceScaleFactor: 2
    });
    
    try {
        let successCount = 0;
        
        // 顺序处理每个文件（避免并发问题）
        for (let i = 0; i < caseFiles.length; i++) {
            console.log(`\\n[${i + 1}/${caseFiles.length}] 处理文件:`);
            if (await generateThumbnail(page, caseFiles[i])) {
                successCount++;
            }
        }
        
        console.log(`\\n🎉 生成完成！`);
        console.log(`📊 成功: ${successCount}/${caseFiles.length}`);
        console.log(`📁 输出目录: ${path.resolve('./thumbnails')}`);
        
        // 检查生成的文件
        const files = await fs.readdir('./thumbnails');
        const jpgFiles = files.filter(f => f.endsWith('.jpg'));
        console.log(`📁 生成文件: ${jpgFiles.join(', ')}`);
        
    } finally {
        await browser.close();
    }
}

main().catch(console.error);