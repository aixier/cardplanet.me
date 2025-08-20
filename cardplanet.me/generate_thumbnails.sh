#!/bin/bash

# CardPlanet 缩略图生成器 (Bash版本)
# 使用wkhtmltopdf工具生成HTML页面缩略图
#
# 安装依赖 (Ubuntu/Debian):
# sudo apt-get install wkhtmltopdf imagemagick
#
# 安装依赖 (macOS):
# brew install wkhtmltopdf imagemagick
#
# 使用方法:
# chmod +x generate_thumbnails.sh
# ./generate_thumbnails.sh

set -e

# 配置参数
INPUT_DIR="./html-files"
OUTPUT_DIR="./thumbnails"
TEMP_DIR="./temp_screenshots"
VIEWPORT_WIDTH=1200
VIEWPORT_HEIGHT=1800
THUMBNAIL_WIDTH=320
THUMBNAIL_HEIGHT=481
QUALITY=85

# 案例文件列表
declare -A CASE_FILES=(
    ["floral_flex_Chinese_Artistry_style_best.html"]="floral_flex_Chinese_Artistry.jpg"
    ["sydney_sweeney_Editorial_Soft_style.html"]="sydney_sweeney_Editorial_Soft.jpg"
    ["spacecore_drawstring_jean_Cosmic_Empire_style.html"]="spacecore_drawstring_Cosmic_Empire.jpg"
    ["depop_2005_closet_Pin_Board_style.html"]="depop_2005_closet_Pin_Board.jpg"
    ["no_try_summer_look_Minimal_style.html"]="no_try_summer_Minimal.jpg"
    ["lollapalooza_street_Luxe_Print_style.html"]="lollapalooza_street_Luxe_Print.jpg"
    ["lolitics_Bubble_Fresh_style.html"]="lolitics_Bubble_Fresh.jpg"
    ["pucci_swirls_genz_Geometric_Symphony_style.html"]="pucci_swirls_Geometric_Symphony.jpg"
    ["genz_career_shift_System_Clean_style.html"]="genz_career_System_Clean.jpg"
    ["brainrot_Impressionist_ Soft_style.html"]="brainrot_Impressionist_Soft.jpg"
    ["side_hustle_brand_Woven_Texture_style.html"]="side_hustle_Woven_Texture.jpg"
    ["matcha_man_Fluid_Zen_style.html"]="matcha_man_Fluid_Zen.jpg"
)

# 颜色输出函数
print_success() { echo -e "\\033[32m✅ $1\\033[0m"; }
print_error() { echo -e "\\033[31m❌ $1\\033[0m"; }
print_info() { echo -e "\\033[34mℹ️  $1\\033[0m"; }
print_warning() { echo -e "\\033[33m⚠️  $1\\033[0m"; }

# 检查依赖
check_dependencies() {
    print_info "检查依赖项..."
    
    if ! command -v wkhtmltoimage &> /dev/null; then
        print_error "wkhtmltoimage 未安装"
        echo "请安装: sudo apt-get install wkhtmltopdf (Ubuntu/Debian) 或 brew install wkhtmltopdf (macOS)"
        exit 1
    fi
    
    if ! command -v convert &> /dev/null; then
        print_error "ImageMagick 未安装"
        echo "请安装: sudo apt-get install imagemagick (Ubuntu/Debian) 或 brew install imagemagick (macOS)"
        exit 1
    fi
    
    print_success "依赖项检查完成"
}

# 创建目录
setup_directories() {
    print_info "设置目录..."
    
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$TEMP_DIR"
    
    print_success "目录设置完成"
}

# 生成单个缩略图
generate_thumbnail() {
    local input_file="$1"
    local output_file="$2"
    local input_path="$INPUT_DIR/$input_file"
    local temp_path="$TEMP_DIR/${output_file%.jpg}.png"
    local final_path="$OUTPUT_DIR/$output_file"
    
    if [[ ! -f "$input_path" ]]; then
        print_error "文件不存在: $input_path"
        return 1
    fi
    
    print_info "处理: $input_file"
    
    # 使用wkhtmltoimage生成高分辨率截图
    wkhtmltoimage \\
        --width "$VIEWPORT_WIDTH" \\
        --height "$VIEWPORT_HEIGHT" \\
        --quality 100 \\
        --format png \\
        --disable-smart-width \\
        --load-error-handling ignore \\
        --load-media-error-handling ignore \\
        "$input_path" \\
        "$temp_path" 2>/dev/null
    
    if [[ $? -ne 0 ]]; then
        print_error "截图生成失败: $input_file"
        return 1
    fi
    
    # 使用ImageMagick调整尺寸和优化
    convert "$temp_path" \\
        -resize "${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}^" \\
        -gravity center \\
        -extent "${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}" \\
        -quality "$QUALITY" \\
        -strip \\
        "$final_path"
    
    if [[ $? -eq 0 ]]; then
        print_success "生成: $output_file"
        rm -f "$temp_path"
        return 0
    else
        print_error "图片优化失败: $output_file"
        return 1
    fi
}

# 清理临时文件
cleanup() {
    print_info "清理临时文件..."
    rm -rf "$TEMP_DIR"
    print_success "清理完成"
}

# 主程序
main() {
    echo "🚀 CardPlanet 缩略图生成器启动 (Bash版本)"
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 设置目录
    setup_directories
    
    # 生成缩略图
    local success_count=0
    local total_count=${#CASE_FILES[@]}
    local current=0
    
    for input_file in "${!CASE_FILES[@]}"; do
        current=$((current + 1))
        output_file="${CASE_FILES[$input_file]}"
        
        echo ""
        print_info "[$current/$total_count] 处理: $input_file"
        
        if generate_thumbnail "$input_file" "$output_file"; then
            success_count=$((success_count + 1))
        fi
    done
    
    # 清理
    cleanup
    
    # 统计结果
    echo ""
    print_success "缩略图生成完成！"
    echo "📊 成功: $success_count/$total_count"
    echo "📁 输出目录: $(realpath "$OUTPUT_DIR")"
    
    # 列出生成的文件
    if [[ $success_count -gt 0 ]]; then
        echo ""
        print_info "生成的文件:"
        ls -la "$OUTPUT_DIR"/*.jpg 2>/dev/null || true
    fi
}

# 错误处理
trap cleanup EXIT

# 运行主程序
main "$@"