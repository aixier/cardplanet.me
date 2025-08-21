# 🚀 CardPlanet.me - AI-Powered Knowledge Card Maker

[![GitHub stars](https://img.shields.io/github/stars/aixier/cardplanet.me?style=social)](https://github.com/aixier/cardplanet.me/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/aixier/cardplanet.me?style=social)](https://github.com/aixier/cardplanet.me/network/members)
[![GitHub issues](https://img.shields.io/github/issues/aixier/cardplanet.me)](https://github.com/aixier/cardplanet.me/issues)
[![GitHub license](https://img.shields.io/github/license/aixier/cardplanet.me)](https://github.com/aixier/cardplanet.me/blob/master/LICENSE)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwww.cardplanet.me)](https://www.cardplanet.me)

> **🎯 Create stunning, viral knowledge cards with AI in seconds**  
> Zero-dependency Node.js platform for generating professional social media cards optimized for Xiaohongshu, Instagram, and Pinterest.

[🌐 **Live Demo**](https://www.cardplanet.me) | [📚 **Documentation**](https://www.cardplanet.me/blog/) | [💬 **Discord Community**](https://discord.gg/8H3c8HwY)

## ⭐ Key Features

- 🤖 **AI-Powered Design**: Generate knowledge cards with artificial intelligence
- 🎨 **12 Professional Styles**: Chinese Artistry, Editorial Soft, Cosmic Empire, and more
- 📱 **Social Media Optimized**: Perfect for Xiaohongshu (小红书), Instagram, Pinterest
- ⚡ **Lightning Fast**: Pure Node.js implementation, no Python dependencies
- 🔍 **SEO Optimized**: Built-in SEO tools and performance optimization
- 📊 **Analytics Ready**: Google Analytics and conversion tracking integrated
- 🌍 **Responsive Design**: Works perfectly on desktop and mobile
- 🎯 **Viral Templates**: Designed for maximum engagement and shares

## 🖼️ Screenshots

<div align="center">
  <img src="https://www.cardplanet.me/samples/ins-sample.png" alt="CardPlanet.me Screenshot - AI Card Maker Interface" width="800">
  <br>
  <em>AI-powered card generation interface with 12 professional design styles</em>
</div>

### 🎨 Design Styles Preview

| Style | Preview | Best For |
|-------|---------|----------|
| 🏮 Chinese Artistry | Traditional elegant designs | Xiaohongshu, cultural content |
| 📸 Editorial Soft | Magazine-style layouts | Instagram, lifestyle blogs |
| 🌌 Cosmic Empire | Futuristic space themes | Tech content, gaming |
| 📌 Pin Board | Pinterest-inspired grids | DIY, recipes, tutorials |
| ✨ Minimal | Clean, modern aesthetics | Professional content |
| 🎭 Luxe Print | Premium luxury designs | Fashion, luxury brands |

## 🚀 Quick Start

### 环境要求
- Node.js 16+ (推荐 18+)
- npm 或 yarn
- 无需Python或其他依赖

### 安装和运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
# 或者
npm run dev-server

# 3. 在浏览器打开
# http://localhost:8000
```

## 🛠️ 开发工具

### 主要命令

```bash
# 开发相关
npm run dev              # 启动开发服务器 (推荐)
npm run dev-server       # 直接启动服务器
npm run help             # 显示帮助信息

# 构建优化
npm run full-build       # 完整构建 (图片+博客+SEO检查)
npm run seo-optimize     # SEO优化 (图片+博客+构建)
npm run build           # 基础构建优化

# 单独任务
npm run optimize-images  # 图片WebP转换
npm run build-blog      # 生成博客文章
npm run seo-check       # SEO健康检查

# 实用工具
npm run clean           # 清理生成文件
npm run generate        # 生成缩略图
```

### 开发工具脚本

```bash
# 使用开发工具 (更友好的界面)
node dev-tools.js help     # 显示帮助
node dev-tools.js start    # 启动服务器
node dev-tools.js build    # 完整构建
node dev-tools.js check    # SEO检查
node dev-tools.js clean    # 清理文件
```

## 📁 项目结构

```
cardplanet.me/
├── index.html              # 主页
├── blog/                   # 博客系统
│   ├── index.html
│   └── *.html
├── assets/css/             # 样式文件
├── html-files/             # 样式展示页面
├── samples/                # 卡片样本图片
├── thumbnails/             # 缩略图
├── sitemap.xml             # 网站地图
├── robots.txt              # 爬虫规则
├── package.json            # 项目配置
└── dev-tools.js           # 开发工具
```

## 🎯 SEO优化功能

### 自动化优化
- ✅ 图片WebP转换
- ✅ CSS压缩
- ✅ HTML优化
- ✅ 站点地图生成
- ✅ 结构化数据
- ✅ SEO健康检查

### 性能指标
- Core Web Vitals优化
- 移动端优化
- 缓存策略
- 压缩配置

## 📝 内容管理

### 博客系统
```bash
# 从Markdown生成博客
npm run build-blog

# 手动创建博客文章
# 在 blog/ 目录下创建HTML文件
```

### 图片优化
```bash
# 批量转换为WebP
npm run optimize-images

# 生成响应式图片
# 自动创建多种尺寸和格式
```

## 🔍 SEO监控

### 健康检查
```bash
npm run seo-check
```

检查项目：
- 页面标题长度
- Meta描述优化
- 结构化数据
- 站点地图可访问性
- SSL证书状态
- 文件大小优化

### 性能测试
```bash
# 本地测试
npm run test-performance

# 然后访问 PageSpeed Insights
# https://pagespeed.web.dev/
```

## 🌐 部署

### 构建生产版本
```bash
# 完整优化构建
npm run full-build

# 检查构建结果
npm run seo-check
```

### 部署检查清单
- [ ] 运行完整构建
- [ ] SEO健康检查通过
- [ ] 测试所有链接
- [ ] 验证移动端体验
- [ ] 提交站点地图到搜索引擎

## 🚨 故障排除

### 常见问题

**1. 依赖安装失败**
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

**2. 图片优化失败**
```bash
# 检查Sharp依赖
npm list sharp
npm install sharp
```

**3. 服务器启动失败**
```bash
# 检查端口占用
lsof -i :8000
# 或使用其他端口
node dev-server.js 3000
```

**4. 权限问题**
```bash
# 确保文件权限正确
chmod +x dev-tools.js
```

## 📊 技术栈

- **前端**: HTML5, CSS3, Vanilla JavaScript
- **构建工具**: Node.js 原生脚本
- **图像处理**: Sharp
- **缩略图生成**: Puppeteer
- **开发服务器**: Node.js HTTP Server
- **SEO**: 结构化数据, 站点地图, robots.txt

## 🤝 开发指南

### 添加新功能
1. 修改相应的HTML/CSS/JS文件
2. 运行 `npm run dev` 测试
3. 运行 `npm run seo-check` 验证SEO
4. 运行 `npm run full-build` 构建

### 性能优化
1. 图片添加到适当目录
2. 运行 `npm run optimize-images`
3. 检查生成的WebP文件
4. 测试页面加载速度

### SEO优化
1. 确保每页有适当的title和meta
2. 添加结构化数据
3. 运行SEO健康检查
4. 监控Core Web Vitals

---

## 📞 支持

- 查看帮助: `npm run help`
- 技术问题: 检查console输出
- SEO问题: 运行 `npm run seo-check`

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🐛 Bug Reports
Found a bug? Please [open an issue](https://github.com/aixier/cardplanet.me/issues/new) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### 💡 Feature Requests
Have an idea? [Create a feature request](https://github.com/aixier/cardplanet.me/issues/new) with:
- Detailed description of the feature
- Use cases and benefits
- Mockups or examples (optional)

### 🔧 Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run seo-check`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📈 Performance & SEO

### Lighthouse Scores
- **Performance**: 95+
- **Accessibility**: 100
- **Best Practices**: 100
- **SEO**: 100

### Core Web Vitals
- **LCP**: < 1.2s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=aixier/cardplanet.me&type=Date)](https://star-history.com/#aixier/cardplanet.me&Date)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Sharp](https://github.com/lovell/sharp) - High-performance image processing
- [Puppeteer](https://github.com/puppeteer/puppeteer) - Headless Chrome automation
- [Schema.org](https://schema.org/) - Structured data standards
- [OpenAI](https://openai.com/) - AI inspiration and guidance

## 📞 Support & Community

- 💬 [Discord Community](https://discord.gg/8H3c8HwY)
- 📧 [Email Support](mailto:contact@cardplanet.me)
- 🐦 [Twitter Updates](https://twitter.com/cardplanetme)
- 📖 [Blog & Tutorials](https://www.cardplanet.me/blog/)

---

<div align="center">
  <strong>⭐ Star this repo if you find it useful!</strong><br>
  <em>Built with ❤️ for creators, by creators</em><br><br>
  
  [![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-green.svg)](https://nodejs.org)
  [![Powered by AI](https://img.shields.io/badge/Powered%20by-AI-blue.svg)](https://www.cardplanet.me)
  [![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red.svg)](https://github.com/aixier/cardplanet.me)
</div>