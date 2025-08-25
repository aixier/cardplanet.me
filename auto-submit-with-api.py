#!/usr/bin/env python3
"""
CardPlanet.me 自动SEO提交脚本
需要在.env文件中配置API凭证
"""

import os
import json
import requests
from datetime import datetime
import hashlib
import base64
from typing import Dict, List, Optional

# 网站信息
SITE_INFO = {
    "url": "https://cardplanet.me",
    "sitemap": "https://cardplanet.me/sitemap.xml",
    "title": "CardPlanet - AI Card Maker 2025",
    "description": "Create viral knowledge cards with AI for Xiaohongshu, Instagram & Pinterest",
    "keywords": ["AI card maker", "knowledge cards", "xiaohongshu", "instagram cards", "viral content"]
}

class SEOSubmitter:
    def __init__(self):
        self.results = []
        
    def log_result(self, service: str, status: str, message: str):
        """记录提交结果"""
        self.results.append({
            "service": service,
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        print(f"{'✅' if status == 'success' else '❌'} {service}: {message}")

    # ========== 1. IndexNow 提交 ==========
    def submit_indexnow(self, api_key: str):
        """提交到IndexNow (Bing, Yandex等)"""
        if not api_key:
            self.log_result("IndexNow", "skipped", "No API key provided")
            return
            
        try:
            # 创建key文件内容
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()[:16]
            
            payload = {
                "host": "cardplanet.me",
                "key": api_key,
                "keyLocation": f"https://cardplanet.me/{api_key}.txt",
                "urlList": [
                    "https://cardplanet.me/",
                    "https://cardplanet.me/cardplanet_english_version.html"
                ]
            }
            
            response = requests.post(
                "https://api.indexnow.org/indexnow",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                self.log_result("IndexNow", "success", "URLs submitted successfully")
            else:
                self.log_result("IndexNow", "failed", f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("IndexNow", "error", str(e))

    # ========== 2. Twitter/X 自动发布 ==========
    def post_to_twitter(self, api_key: str, api_secret: str, access_token: str, access_secret: str):
        """自动发布到Twitter"""
        if not all([api_key, api_secret, access_token, access_secret]):
            self.log_result("Twitter", "skipped", "Missing credentials")
            return
            
        try:
            import tweepy
            
            auth = tweepy.OAuthHandler(api_key, api_secret)
            auth.set_access_token(access_token, access_secret)
            api = tweepy.API(auth)
            
            tweet = f"""
🚀 Create stunning knowledge cards with AI!
✨ Perfect for Xiaohongshu & Instagram
🎨 12 professional design styles
⚡ Generate in under 3 minutes

Try it free: {SITE_INFO['url']}

#AItools #ContentCreation #Design #Xiaohongshu
"""
            
            api.update_status(tweet)
            self.log_result("Twitter", "success", "Tweet posted successfully")
        except ImportError:
            self.log_result("Twitter", "error", "tweepy not installed. Run: pip install tweepy")
        except Exception as e:
            self.log_result("Twitter", "error", str(e))

    # ========== 3. Dev.to 文章发布 ==========
    def post_to_devto(self, api_key: str):
        """发布文章到Dev.to"""
        if not api_key:
            self.log_result("Dev.to", "skipped", "No API key provided")
            return
            
        try:
            article = {
                "article": {
                    "title": "I Built an AI Card Maker for Viral Content Creation",
                    "published": True,
                    "body_markdown": f"""
I'm excited to share **CardPlanet**, an AI-powered card maker I built for creating viral content on platforms like Xiaohongshu and Instagram.

## 🚀 What is CardPlanet?

[CardPlanet]({SITE_INFO['url']}) is a web-based tool that uses AI to generate professional knowledge cards in under 3 minutes. No design skills required!

## ✨ Key Features

- **12 Professional Styles**: From minimalist to artistic
- **AI-Powered**: Smart content optimization
- **Zero Dependencies**: Pure HTML/CSS/JS
- **Mobile Responsive**: Works everywhere
- **Privacy First**: No data collection

## 🛠️ Tech Stack

- Frontend: Vanilla JavaScript (no frameworks!)
- Optimization: WebP images, lazy loading
- SEO: Schema.org, Open Graph
- Hosting: Netlify with global CDN

## 📊 Use Cases

1. **Knowledge Cards** for education
2. **Social Media Posts** for Instagram/Xiaohongshu
3. **Marketing Materials** for businesses
4. **Pinterest Pins** for viral content

## 🎯 Why I Built This

As a content creator, I was frustrated with:
- Expensive design tools
- Steep learning curves
- Time-consuming processes

CardPlanet solves these problems with AI-powered automation.

## 🔗 Try It Out

Visit [{SITE_INFO['url']}]({SITE_INFO['url']}) to create your first card!

## 💡 Lessons Learned

1. **Simplicity wins**: No framework needed
2. **Performance matters**: Optimized everything
3. **SEO is crucial**: Built-in from day one

What do you think? I'd love to hear your feedback!

#webdev #ai #tools #javascript
""",
                    "tags": ["webdev", "ai", "javascript", "tools"],
                    "canonical_url": SITE_INFO['url']
                }
            }
            
            response = requests.post(
                "https://dev.to/api/articles",
                json=article,
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 201:
                self.log_result("Dev.to", "success", f"Article published: {response.json().get('url')}")
            else:
                self.log_result("Dev.to", "failed", f"Status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result("Dev.to", "error", str(e))

    # ========== 4. Reddit 自动发帖 ==========
    def post_to_reddit(self, client_id: str, client_secret: str, username: str, password: str):
        """发布到Reddit相关subreddit"""
        if not all([client_id, client_secret, username, password]):
            self.log_result("Reddit", "skipped", "Missing credentials")
            return
            
        try:
            import praw
            
            reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                username=username,
                password=password,
                user_agent="CardPlanet SEO Bot 1.0"
            )
            
            # 发布到r/SideProject
            subreddit = reddit.subreddit("SideProject")
            post = subreddit.submit(
                title="I made an AI tool that creates viral knowledge cards in 3 minutes",
                selftext=f"""
Hey everyone! I built CardPlanet, an AI-powered card maker for creating viral content.

**What it does:**
- Generates professional knowledge cards using AI
- 12 different design styles
- Perfect for Xiaohongshu, Instagram, Pinterest
- No design skills needed

**Tech stack:**
- Pure vanilla JS (no frameworks)
- Optimized for performance
- Mobile responsive

**Try it out:** {SITE_INFO['url']}

Would love to hear your feedback!
"""
            )
            self.log_result("Reddit", "success", f"Posted to r/SideProject: {post.url}")
        except ImportError:
            self.log_result("Reddit", "error", "praw not installed. Run: pip install praw")
        except Exception as e:
            self.log_result("Reddit", "error", str(e))

    # ========== 5. GitHub Gist 创建 ==========
    def create_github_gist(self, token: str):
        """创建GitHub Gist作为反向链接"""
        if not token:
            self.log_result("GitHub Gist", "skipped", "No token provided")
            return
            
        try:
            gist_data = {
                "description": "AI Card Maker Tools and Resources",
                "public": True,
                "files": {
                    "awesome-card-makers.md": {
                        "content": f"""# Awesome Card Makers and Design Tools

## AI-Powered Card Makers

### ⭐ CardPlanet
- **URL**: [{SITE_INFO['url']}]({SITE_INFO['url']})
- **Description**: {SITE_INFO['description']}
- **Features**: 12 styles, AI-powered, mobile responsive
- **Best for**: Xiaohongshu, Instagram, Pinterest content

## Other Tools
- Canva (paid)
- Adobe Express (subscription)
- Crello (limited free)

## Why CardPlanet?
1. **Free to use**
2. **No signup required**
3. **AI-powered automation**
4. **Optimized for viral content**

Created with ❤️ by CardPlanet Team
"""
                    }
                }
            }
            
            response = requests.post(
                "https://api.github.com/gists",
                json=gist_data,
                headers={
                    "Authorization": f"token {token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if response.status_code == 201:
                gist_url = response.json()['html_url']
                self.log_result("GitHub Gist", "success", f"Created: {gist_url}")
            else:
                self.log_result("GitHub Gist", "failed", f"Status {response.status_code}")
        except Exception as e:
            self.log_result("GitHub Gist", "error", str(e))

    # ========== 6. Webhook 触发 ==========
    def trigger_webhook(self, webhook_url: str):
        """触发Zapier/IFTTT等webhook进行更多自动化"""
        if not webhook_url:
            self.log_result("Webhook", "skipped", "No webhook URL provided")
            return
            
        try:
            payload = {
                "site": SITE_INFO['url'],
                "title": SITE_INFO['title'],
                "description": SITE_INFO['description'],
                "action": "seo_submission",
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(webhook_url, json=payload)
            
            if response.status_code in [200, 201, 202]:
                self.log_result("Webhook", "success", "Triggered successfully")
            else:
                self.log_result("Webhook", "failed", f"Status {response.status_code}")
        except Exception as e:
            self.log_result("Webhook", "error", str(e))

    def run_all_submissions(self):
        """执行所有配置的提交"""
        print("\n🚀 Starting automated SEO submissions for CardPlanet.me\n")
        
        # 从环境变量读取凭证
        from dotenv import load_dotenv
        load_dotenv()
        
        # 1. IndexNow
        self.submit_indexnow(os.getenv('INDEXNOW_KEY'))
        
        # 2. Twitter
        self.post_to_twitter(
            os.getenv('TWITTER_API_KEY'),
            os.getenv('TWITTER_API_SECRET'),
            os.getenv('TWITTER_ACCESS_TOKEN'),
            os.getenv('TWITTER_ACCESS_SECRET')
        )
        
        # 3. Dev.to
        self.post_to_devto(os.getenv('DEVTO_API_KEY'))
        
        # 4. Reddit
        self.post_to_reddit(
            os.getenv('REDDIT_CLIENT_ID'),
            os.getenv('REDDIT_CLIENT_SECRET'),
            os.getenv('REDDIT_USERNAME'),
            os.getenv('REDDIT_PASSWORD')
        )
        
        # 5. GitHub Gist
        self.create_github_gist(os.getenv('GITHUB_TOKEN'))
        
        # 6. Webhook
        self.trigger_webhook(os.getenv('ZAPIER_WEBHOOK_URL'))
        
        # 打印总结
        print("\n📊 Submission Summary:")
        success_count = len([r for r in self.results if r['status'] == 'success'])
        failed_count = len([r for r in self.results if r['status'] == 'failed'])
        skipped_count = len([r for r in self.results if r['status'] == 'skipped'])
        
        print(f"✅ Success: {success_count}")
        print(f"❌ Failed: {failed_count}")
        print(f"⏭️ Skipped: {skipped_count}")
        
        # 保存结果
        with open('submission_results.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        print("\n📁 Results saved to submission_results.json")

if __name__ == "__main__":
    submitter = SEOSubmitter()
    submitter.run_all_submissions()