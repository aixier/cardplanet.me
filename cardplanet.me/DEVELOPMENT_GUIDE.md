# 🛠️ CardPlanet.me 开发手册

> **版本**: v2.0  
> **最后更新**: 2025年8月  
> **适用范围**: 本地开发、代码交付与运维

---

## 📋 目录

1. [环境配置](#环境配置)
2. [本地开发流程](#本地开发流程)
3. [代码交付流程](#代码交付流程)
4. [运维与部署](#运维与部署)
5. [内容页面更新](#内容页面更新)
6. [性能优化](#性能优化)
7. [故障排除](#故障排除)

---

## 🔧 环境配置

### 开发环境要求

```bash
# 基础环境
- Node.js 18+
- Git 2.30+
- npm 8+

# 推荐工具
- VS Code
- Chrome DevTools
- Lighthouse CLI
```

### 项目初始化

```bash
# 克隆项目
git clone https://codeup.aliyun.com/650848bba42f1442323e412e/cardplanet.me.git
cd cardplanet.me/cardplanet.me

# 安装依赖
npm install

# 验证环境
node --version  # 确保 >= 18
npm --version   # 确保 >= 8
```

---

## 💻 本地开发流程

### 1. 启动开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev              # 标准开发模式
npm run dev-server       # 仅服务器模式
npm run test-generate    # 调试模式

# 访问本地服务
# http://localhost:8000
```

### 2. 开发工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 实时开发监控
npm run dev             # 启动开发服务器
npm run seo-check       # SEO实时检查
npm run watch           # 文件变化监控（如果可用）

# 开发过程中的构建
npm run optimize-images  # 图片优化
npm run generate        # 缩略图生成
npm run build-blog      # 博客构建
```

### 3. 质量检查工具

```bash
# 代码质量检查
npm run lint            # 代码规范检查
npm run seo-check       # SEO健康检查
npm run validate-html   # HTML验证（如果可用）

# 性能检查
lighthouse http://localhost:8000 --output json
npm run performance-test # 性能测试（如果可用）

# 构建检查
npm run build           # 基础构建
npm run full-build      # 完整构建
npm run seo-optimize    # SEO优化构建
```

---

## 📦 代码交付流程

### 1. 开发完成检查

```bash
# 代码质量检查
npm run seo-check
npm run lint
npm audit

# 构建验证
npm run full-build

# 本地测试
npm run dev
# 手动测试所有功能

# 性能检查
lighthouse http://localhost:8000 --view
```

### 2. 代码提交与推送

```bash
# 添加所有更改
git add .

# 提交代码
git commit -m "feat: 新功能描述

详细说明:
- 新增功能A
- 优化性能B
- 修复问题C

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送到远程仓库
git push origin feature/new-feature
```

### 3. 合并到主分支

```bash
# 切换到主分支
git checkout master
git pull origin master

# 合并功能分支
git merge feature/new-feature

# 推送主分支
git push origin master

# 删除功能分支
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```

### 4. 生产部署准备

```bash
# 最终构建
npm run full-build

# 验证构建结果
npm run seo-check

# 创建发布标签
git tag -a v$(date +%Y.%m.%d) -m "Release $(date +%Y.%m.%d)"
git push origin v$(date +%Y.%m.%d)
```

---

## 🚀 运维与部署

### 1. 静态网站部署

```bash
# 构建生产版本
npm run full-build

# 部署到服务器 (示例: 使用rsync)
rsync -avz --delete \
  ./ \
  user@server:/var/www/cardplanet.me/

# 或部署到CDN/OSS
# 上传到阿里云OSS
ossutil cp -r ./ oss://cardplanet-me/ --update

# 或部署到Nginx
sudo cp -r ./ /var/www/html/cardplanet.me/
sudo systemctl reload nginx
```

### 2. 服务器配置

```nginx
# /etc/nginx/sites-available/cardplanet.me
server {
    listen 80;
    listen 443 ssl http2;
    server_name www.cardplanet.me cardplanet.me;

    # SSL配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 根目录
    root /var/www/html/cardplanet.me;
    index index.html;

    # 缓存配置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 压缩配置
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/javascript application/json;
}
```

### 3. 监控与备份

```bash
# 定期备份脚本
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
tar -czf /backups/cardplanet-$DATE.tar.gz /var/www/html/cardplanet.me/

# 配置代码备份
git commit -am "Production backup $(date)"
git push origin main

# 简单监控脚本
#!/bin/bash
# monitor.sh
if ! curl -f https://www.cardplanet.me > /dev/null 2>&1; then
    echo "Website is down!" | mail -s "Alert: CardPlanet Down" admin@example.com
fi
```

---

## 📝 内容页面更新

### 1. 页面内容更新流程

```bash
# 1. 创建功能分支
git checkout -b feature/content-update

# 2. 更新内容文件
# 编辑 index.html, blog/*.html 等

# 3. 生成优化资源
npm run optimize-images   # 图片优化
npm run build-blog       # 博客生成
npm run generate         # 缩略图生成

# 4. SEO优化检查
npm run seo-check
npm run validate-html

# 5. 提交和推送
git add .
git commit -m "Update content: 新增功能描述"
git push origin feature/content-update
```

### 2. 博客文章管理

```bash
# 新增博客文章
mkdir -p blog/new-article
cat > blog/new-article.md << 'EOF'
---
title: "新文章标题"
date: 2025-08-22
description: "文章描述"
keywords: "关键词1, 关键词2"
---

# 文章内容...
EOF

# 生成HTML
npm run build-blog

# 更新站点地图
npm run update-sitemap
```

### 3. 样式和模板更新

```bash
# 新增设计风格
mkdir -p html-files/new-style
# 创建 new-style.html

# 生成缩略图
npm run generate

# 更新展示页面
# 编辑 index.html 添加新风格展示
```

---

## ⚡ 性能优化

### 1. 图像优化策略

```bash
# 批量WebP转换
find ./samples -name "*.png" -exec sh -c '
  cwebp -q 85 "$1" -o "${1%.png}.webp"
' _ {} \;

# 响应式图片生成
npm run generate-responsive

# 图片懒加载验证
npm run verify-lazy-loading
```

### 2. 代码优化

```bash
# CSS优化
npm run minify-css
npm run critical-css

# JavaScript优化  
npm run minify-js
npm run tree-shake

# HTML优化
npm run minify-html
npm run remove-unused
```

### 3. 缓存策略

```nginx
# nginx.conf 缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}

location ~* \.(html)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

---

## 🛡️ 故障排除

### 常见问题与解决方案

#### 1. 容器启动失败

```bash
# 检查容器日志
docker logs cardplanet-web

# 检查端口占用
netstat -tlnp | grep :8000

# 重启容器
docker restart cardplanet-web
```

#### 2. 图片生成失败

```bash
# 检查Puppeteer依赖
npm list puppeteer

# 使用调试模式
npm run test-generate

# 重新安装依赖
rm -rf node_modules
npm install
```

#### 3. 性能问题

```bash
# 检查Core Web Vitals
npm run performance-audit

# 分析打包体积
npm run analyze-bundle

# 检查资源加载
npm run check-resources
```

#### 4. SEO问题

```bash
# 完整SEO检查
npm run seo-check

# 验证结构化数据
npm run validate-schema

# 检查站点地图
curl -f https://www.cardplanet.me/sitemap.xml
```

---

## 📞 支持与联系

### 开发支持

- **技术文档**: [README.md](./README.md)
- **快速开始**: [QUICK_START.md](./QUICK_START.md)  
- **故障排除**: 运行 `npm run help`

### 生产支持

- **监控面板**: [监控链接]
- **日志查看**: `kubectl logs -f deployment/cardplanet-web`
- **告警通知**: 企业微信群/邮件列表

### 版本管理

- **开发分支**: `develop`
- **生产分支**: `main`
- **发布标签**: `v2.x.x`
- **镜像版本**: `YYYYMMDD`

---

## 📈 最佳实践

### 开发最佳实践

1. **功能分支开发**: 每个功能使用独立分支
2. **提交规范**: 使用 Conventional Commits
3. **代码审查**: 所有PR需要审查
4. **测试驱动**: 编写充分的测试用例

### 部署最佳实践

1. **渐进式部署**: 使用金丝雀发布
2. **回滚准备**: 保留上一版本镜像
3. **监控告警**: 设置合理的监控指标
4. **文档更新**: 及时更新部署文档

### 性能最佳实践

1. **图片优化**: WebP格式 + 懒加载
2. **缓存策略**: 合理设置缓存头
3. **CDN使用**: 静态资源CDN分发
4. **监控追踪**: 持续监控Core Web Vitals

---

*本文档涵盖了CardPlanet.me的完整开发、交付和运维流程，确保团队能够高效协作和稳定交付。*