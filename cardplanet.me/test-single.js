#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

async function testSingleThumbnail() {
    const caseFile = {
        file: 'floral_flex_Chinese_Artistry_style_best.html',
        output: 'test_floral_flex.jpg'
    };
    
    console.log('🧪 测试单个文件缩略图生成');
    
    // 确保目录存在
    await fs.mkdir('./thumbnails', { recursive: true });
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    try {
        // 设置视口
        await page.setViewport({
            width: 1200,
            height: 1800,
            deviceScaleFactor: 1
        });
        
        const filePath = path.join('./html-files', caseFile.file);
        const fileUrl = `file://${path.resolve(filePath)}`;
        
        console.log(`📄 加载: ${fileUrl}`);
        
        await page.goto(fileUrl, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        console.log('⏳ 等待 8 秒确保渲染完成...');
        await page.waitForTimeout(8000);
        
        // 分析页面
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                bodyHeight: document.body.scrollHeight,
                bodyWidth: document.body.scrollWidth,
                cardCount: document.querySelectorAll('.tutorial-card').length
            };
        });
        
        console.log('📊 页面信息:');
        console.log(`   标题: ${pageInfo.title}`);
        console.log(`   尺寸: ${pageInfo.bodyWidth}x${pageInfo.bodyHeight}`);
        console.log(`   卡片数量: ${pageInfo.cardCount}`);
        
        // 截图
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true
        });
        
        // 保存原始截图用于对比
        await fs.writeFile('./thumbnails/original_full.png', screenshot);
        console.log('💾 原始截图已保存: original_full.png');
        
        // 使用Sharp处理
        const sharp = require('sharp');
        const image = sharp(screenshot);
        const metadata = await image.metadata();
        
        console.log(`📏 原始尺寸: ${metadata.width}x${metadata.height}`);
        
        // 智能裁剪 - 确保裁剪区域在图片范围内
        const maxCropWidth = Math.min(metadata.width * 0.8, 800);
        const maxCropHeight = Math.min(metadata.height * 0.6, 1000);
        const left = Math.max(0, (metadata.width - maxCropWidth) / 2);
        const top = Math.max(0, Math.min(100, metadata.height * 0.05));
        
        // 确保裁剪区域不超出图片边界
        const cropWidth = Math.min(maxCropWidth, metadata.width - left);
        const cropHeight = Math.min(maxCropHeight, metadata.height - top);
        
        console.log(`✂️  裁剪区域: ${Math.round(left)},${Math.round(top)} ${Math.round(cropWidth)}x${Math.round(cropHeight)}`);
        
        // 验证裁剪区域
        if (left + cropWidth > metadata.width || top + cropHeight > metadata.height) {
            console.log('⚠️  裁剪区域超出边界，使用全图');
            // 直接调整尺寸
            await image
                .resize(320, 481, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 85 })
                .toFile(`./thumbnails/${caseFile.output}`);
        } else {
            // 保存裁剪后的图片
            const croppedPath = './thumbnails/cropped_area.jpg';
            await image
                .extract({
                    left: Math.round(left),
                    top: Math.round(top),
                    width: Math.round(cropWidth),
                    height: Math.round(cropHeight)
                })
                .jpeg({ quality: 90 })
                .toFile(croppedPath);
            
            console.log('✂️  裁剪图片已保存: cropped_area.jpg');
            
            // 生成最终缩略图
            const finalPath = `./thumbnails/${caseFile.output}`;
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
                .jpeg({ quality: 85 })
                .toFile(finalPath);
        }
        
        console.log(`✅ 最终缩略图已保存: ${caseFile.output}`);
        
        // 获取文件大小
        const finalPath = `./thumbnails/${caseFile.output}`;
        const stats = await fs.stat(finalPath);
        console.log(`📁 文件大小: ${Math.round(stats.size / 1024)}KB`);
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await browser.close();
    }
}

testSingleThumbnail().catch(console.error);