#!/bin/bash

# Auto Submit Script for CardPlanet.me SEO
# 自动提交到搜索引擎和目录网站

echo "🚀 Starting SEO Auto-Submit for cardplanet.me..."

SITE_URL="https://cardplanet.me"
SITEMAP_URL="https://cardplanet.me/sitemap.xml"

# 1. 提交到搜索引擎
echo "📍 Submitting to Search Engines..."

# Bing/Microsoft
echo "  → Submitting to Bing..."
curl -X GET "https://www.bing.com/ping?sitemap=${SITEMAP_URL}" 2>/dev/null
echo "  ✓ Bing submission sent"

# Yandex
echo "  → Submitting to Yandex..."
curl -X GET "https://webmaster.yandex.com/ping?sitemap=${SITEMAP_URL}" 2>/dev/null
echo "  ✓ Yandex submission sent"

# 2. 提交到IndexNow (Bing, Yandex, Seznam.cz等)
echo "📍 Submitting via IndexNow..."
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "cardplanet.me",
    "key": "e5a0c9ea8f4d4b5c9f3e7d8c5b4a3c2d",
    "urlList": [
      "https://cardplanet.me/",
      "https://cardplanet.me/cardplanet_english_version.html"
    ]
  }' 2>/dev/null
echo "  ✓ IndexNow submission sent"

# 3. 提交到网站监测服务
echo "📍 Submitting to Website Monitoring Services..."

# Pingdom
curl -X GET "https://api.pingdom.com/api/3.1/reports.public?url=${SITE_URL}" 2>/dev/null
echo "  ✓ Pingdom notification sent"

# 4. 提交RSS/Atom feeds
echo "📍 Creating and submitting RSS feed..."
cat > /tmp/cardplanet-rss.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CardPlanet - AI Card Maker 2025</title>
    <link>https://cardplanet.me</link>
    <description>Create viral knowledge cards with AI for Xiaohongshu, Instagram, Pinterest</description>
    <lastBuildDate>Mon, 25 Aug 2025 12:00:00 GMT</lastBuildDate>
    <item>
      <title>AI Card Maker 2025 - Create Viral Cards</title>
      <link>https://cardplanet.me</link>
      <description>Professional knowledge card generator with 12 design styles</description>
      <pubDate>Mon, 25 Aug 2025 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
EOF

# 5. 提交到免费ping服务
echo "📍 Pinging Blog Services..."
for service in \
  "https://rpc.pingomatic.com" \
  "https://ping.feedburner.com" \
  "https://ping.blogs.yandex.ru/RPC2" \
  "https://blogsearch.google.com/ping/RPC2"
do
  curl -X POST "$service" \
    -H "Content-Type: text/xml" \
    -d "<?xml version='1.0'?>
    <methodCall>
      <methodName>weblogUpdates.ping</methodName>
      <params>
        <param><value>CardPlanet</value></param>
        <param><value>https://cardplanet.me</value></param>
      </params>
    </methodCall>" 2>/dev/null &
done
echo "  ✓ Blog ping services notified"

echo "✅ Auto-submit completed!"