# NeuroPick - Getting Started Guide

## Prerequisites

Before running NeuroPick, you need to set up the following:

### 1. MySQL Database

**Install MySQL:**
- Download from [mysql.com](https://dev.mysql.com/downloads/)
- Or use XAMPP/WAMP/MAMP

**Create Database:**
```sql
CREATE DATABASE neuropick;
```

### 2. API Keys

#### Google Gemini AI (Required for AI features)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

#### Reddit API (Optional - for Reddit scraping)
1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Select "script" type
4. Note down:
   - Client ID (under app name)
   - Client Secret

---

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit `.env` file with your credentials:

```env
# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=neuropick
DB_USER=root
DB_PASSWORD=your_mysql_password

# Gemini AI (Get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Reddit API (Optional - Get from https://www.reddit.com/prefs/apps)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=NeuroPick/1.0
```

### 3. Start the Application

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend on http://localhost:5173

---

## Features Overview

### 🤖 AI-Powered Analysis
- Sentiment analysis using Gemini AI
- Fake review detection
- Smart review summarization
- Personalized recommendations

### 🌐 Multi-Source Review Scraping
- **Reddit**: Scrape product discussions from subreddits
- **Amazon**: Extract product reviews (requires product URL)
- **Flipkart**: Indian e-commerce reviews

### 📊 Product Management
- Browse and search products
- View AI-generated insights
- Compare products
- Track review sources

---

## Using the Scraping Features

### Start Scraping for a Product

**API Endpoint:**
```http
POST /api/scraping/start/:productId
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "sources": ["reddit", "amazon", "flipkart"],
  "options": {
    "reddit": {
      "subreddits": ["ProductReviews", "BuyItForLife"],
      "limit": 50
    }
  }
}
```

### Check Scraping Status

```http
GET /api/scraping/status/:jobId
```

---

## Using Gemini AI Features

### Analyze Product Reviews

```http
POST /api/gemini/analyze
Content-Type: application/json

{
  "productId": 1
}
```

### Get AI Recommendations

```http
POST /api/gemini/recommend
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "category": "Electronics",
  "limit": 5
}
```

### Chat with AI

```http
POST /api/gemini/chat
Content-Type: application/json

{
  "question": "What are the best headphones under $100?",
  "productId": 1
}
```

---

## Troubleshooting

### MySQL Connection Error
```
❌ Unable to connect to MySQL database
```
**Solution:**
- Ensure MySQL is running
- Check credentials in `.env`
- Verify database exists: `CREATE DATABASE neuropick;`

### Gemini API Error
```
Error: API key not valid
```
**Solution:**
- Get a valid API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Update `GEMINI_API_KEY` in `.env`

### Reddit Scraping Not Working
```
⚠️ Reddit API credentials not configured
```
**Solution:**
- Reddit scraping is optional
- Get credentials from [Reddit Apps](https://www.reddit.com/prefs/apps)
- Update `.env` with Reddit credentials

### Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
- Change `PORT` in `.env` to another port (e.g., 5001)
- Or stop the process using port 5000

---

## Next Steps

1. **Create an account** at http://localhost:5173/register
2. **Browse products** at http://localhost:5173/products
3. **Try AI features**:
   - View product insights
   - Get personalized recommendations
   - Chat with AI about products
4. **Scrape reviews** (if configured):
   - Add product URLs (Amazon/Flipkart)
   - Start scraping jobs
   - View aggregated reviews

---

## Important Notes

⚠️ **Legal Considerations:**
- Amazon and Flipkart scraping may violate their Terms of Service
- Use official APIs when available
- Reddit scraping uses official API (legal)
- For production, seek proper permissions

🔒 **Security:**
- Never commit `.env` file to version control
- Use strong JWT secrets in production
- Change default passwords

📊 **Performance:**
- Scraping can be slow (rate limiting)
- AI analysis requires API calls (costs may apply)
- Use caching for frequently accessed data

---

## Support

For issues or questions:
- Check the implementation plan in `brain/implementation_plan.md`
- Review the walkthrough in `brain/walkthrough.md`
- Check console logs for detailed error messages
