#!/usr/bin/env python3
"""
CardPlanet 缩略图生成器 (Python版本)
使用 Selenium + Chrome 生成HTML页面缩略图

安装依赖:
pip install selenium pillow webdriver-manager

使用方法:
python generate_thumbnails.py
"""

import os
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from PIL import Image
import io

# 案例文件配置
CASE_FILES = [
    {
        'file': 'floral_flex_Chinese_Artistry_style_best.html',
        'output': 'floral_flex_Chinese_Artistry.jpg'
    },
    {
        'file': 'sydney_sweeney_Editorial_Soft_style.html',
        'output': 'sydney_sweeney_Editorial_Soft.jpg'
    },
    {
        'file': 'spacecore_drawstring_jean_Cosmic_Empire_style.html',
        'output': 'spacecore_drawstring_Cosmic_Empire.jpg'
    },
    {
        'file': 'depop_2005_closet_Pin_Board_style.html',
        'output': 'depop_2005_closet_Pin_Board.jpg'
    },
    {
        'file': 'no_try_summer_look_Minimal_style.html',
        'output': 'no_try_summer_Minimal.jpg'
    },
    {
        'file': 'lollapalooza_street_Luxe_Print_style.html',
        'output': 'lollapalooza_street_Luxe_Print.jpg'
    },
    {
        'file': 'lolitics_Bubble_Fresh_style.html',
        'output': 'lolitics_Bubble_Fresh.jpg'
    },
    {
        'file': 'pucci_swirls_genz_Geometric_Symphony_style.html',
        'output': 'pucci_swirls_Geometric_Symphony.jpg'
    },
    {
        'file': 'genz_career_shift_System_Clean_style.html',
        'output': 'genz_career_System_Clean.jpg'
    },
    {
        'file': 'brainrot_Impressionist_ Soft_style.html',
        'output': 'brainrot_Impressionist_Soft.jpg'
    },
    {
        'file': 'side_hustle_brand_Woven_Texture_style.html',
        'output': 'side_hustle_Woven_Texture.jpg'
    },
    {
        'file': 'matcha_man_Fluid_Zen_style.html',
        'output': 'matcha_man_Fluid_Zen.jpg'
    }
]

# 配置参数
CONFIG = {
    'viewport': {
        'width': 1200,
        'height': 1800
    },
    'thumbnail': {
        'width': 320,
        'height': 481,
        'quality': 85
    },
    'input_dir': './html-files',
    'output_dir': './thumbnails'
}

def setup_driver():
    """配置Chrome浏览器驱动"""
    print("🌐 设置Chrome浏览器驱动...")
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-file-access-from-files')
    chrome_options.add_argument(f'--window-size={CONFIG["viewport"]["width"]},{CONFIG["viewport"]["height"]}')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.set_window_size(CONFIG['viewport']['width'], CONFIG['viewport']['height'])
    
    return driver

def generate_thumbnail(driver, case_file):
    """生成单个缩略图"""
    try:
        # 构建文件路径
        input_path = Path(CONFIG['input_dir']) / case_file['file']
        output_path = Path(CONFIG['output_dir']) / case_file['output']
        
        if not input_path.exists():
            print(f"❌ 文件不存在: {input_path}")
            return False
        
        # 加载HTML文件
        file_url = f"file://{input_path.absolute()}"
        print(f"📄 加载页面: {case_file['file']}")
        driver.get(file_url)
        
        # 等待页面加载
        time.sleep(3)
        
        # 尝试查找卡片元素
        card_selectors = [
            '.card-container',
            '.knowledge-card', 
            '.main-card',
            '.card',
            'main',
            'body > div:first-child'
        ]
        
        card_element = None
        for selector in card_selectors:
            try:
                card_element = driver.find_element(By.CSS_SELECTOR, selector)
                print(f"✅ 找到卡片元素: {selector}")
                break
            except:
                continue
        
        # 生成截图
        if card_element:
            # 截取特定元素
            screenshot = card_element.screenshot_as_png
        else:
            # 截取整个页面
            print("⚠️  未找到卡片元素，使用整个页面")
            screenshot = driver.get_screenshot_as_png()
        
        # 使用PIL优化图片
        image = Image.open(io.BytesIO(screenshot))
        
        # 调整尺寸
        thumbnail = image.resize(
            (CONFIG['thumbnail']['width'], CONFIG['thumbnail']['height']),
            Image.Resampling.LANCZOS
        )
        
        # 转换为RGB（如果是RGBA）
        if thumbnail.mode == 'RGBA':
            thumbnail = thumbnail.convert('RGB')
        
        # 保存图片
        thumbnail.save(
            output_path,
            'JPEG',
            quality=CONFIG['thumbnail']['quality'],
            optimize=True
        )
        
        print(f"✅ 生成缩略图: {case_file['output']}")
        return True
        
    except Exception as e:
        print(f"❌ 生成 {case_file['file']} 时出错: {str(e)}")
        return False

def ensure_output_directory():
    """确保输出目录存在"""
    output_dir = Path(CONFIG['output_dir'])
    if not output_dir.exists():
        output_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 创建输出目录: {output_dir}")

def main():
    """主程序"""
    print("🚀 CardPlanet 缩略图生成器启动 (Python版本)\n")
    
    # 确保输出目录存在
    ensure_output_directory()
    
    # 设置浏览器驱动
    driver = setup_driver()
    
    try:
        success_count = 0
        total_count = len(CASE_FILES)
        
        # 生成所有缩略图
        for i, case_file in enumerate(CASE_FILES, 1):
            print(f"\n[{i}/{total_count}] 处理: {case_file['file']}")
            if generate_thumbnail(driver, case_file):
                success_count += 1
        
        print(f"\n✅ 缩略图生成完成！")
        print(f"📊 成功: {success_count}/{total_count}")
        print(f"📁 输出目录: {Path(CONFIG['output_dir']).absolute()}")
        
    except Exception as e:
        print(f"❌ 生成过程中出现错误: {str(e)}")
    finally:
        driver.quit()
        print("🔚 浏览器已关闭")

if __name__ == "__main__":
    main()