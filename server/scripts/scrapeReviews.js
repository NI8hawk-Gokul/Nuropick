require('dotenv').config();
const path = require('path');
const db = require('../models');
const { Product, ReviewSource, ScrapingJob } = db;
const { Op } = require('sequelize');
const { scrapeAmazonProductMetadata, scrapeFlipkartProductMetadata } = require('../services/scraper');
const { runProductScraping } = require('../services/scrapingService');
const { cleanUrl, extractUrl, resolveUrl } = require('../utils/urlHelper');

async function main() {
    const urlInput = process.argv[2];

    if (!urlInput) {
        console.error('❌ Error: Please provide a product URL as an argument.');
        console.log('Usage: node server/scripts/scrapeReviews.js "https://www.amazon.in/dp/B0CX299X8M/"');
        process.exit(1);
    }

    try {
        console.log('Initializing database...');
        await db.sequelize.authenticate();
        console.log('Database connected.');

        // Clean and resolve URL
        const extracted = extractUrl(urlInput);
        if (!extracted) {
            console.error('❌ Error: No valid URL found in input.');
            process.exit(1);
        }

        let url = await resolveUrl(extracted);
        url = cleanUrl(url);
        console.log(`🌐 Processing URL: ${url}`);

        // Check if product exists or needs creation
        let product = await Product.findOne({
            where: {
                [Op.or]: [
                    { amazonUrl: url },
                    { flipkartUrl: url }
                ]
            }
        });

        let sources = [];
        if (url.includes('amazon.')) {
            sources = ['amazon'];
        } else if (url.includes('flipkart.')) {
            sources = ['flipkart', 'amazon'];
        } else {
            console.error('❌ Error: Unsupported store. Only Amazon and Flipkart are supported.');
            process.exit(1);
        }

        if (!product) {
            console.log('🛒 Product not found in database. Scraping metadata...');
            let metadataResult;
            if (url.includes('amazon.')) {
                metadataResult = await scrapeAmazonProductMetadata(url);
            } else {
                metadataResult = await scrapeFlipkartProductMetadata(url);
            }

            if (!metadataResult.success) {
                console.error(`❌ Error scraping metadata: ${metadataResult.error}`);
                process.exit(1);
            }

            const { metadata } = metadataResult;
            product = await Product.create({
                ...metadata,
                createdBy: 1 // Default to first user or system
            });
            console.log(`✅ Created new product: ${product.name}`);
        } else {
            console.log(`📦 Found existing product: ${product.name}`);
        }

        // Create scraping jobs
        const jobs = [];
        for (const sourceName of sources) {
            const source = await ReviewSource.findOne({ where: { name: sourceName } });
            if (!source) {
                console.warn(`⚠️ Warning: Source "${sourceName}" not found in database. Skipping job creation.`);
                continue;
            }

            const job = await ScrapingJob.create({
                productId: product.id,
                sourceId: source.id,
                status: 'pending'
            });
            jobs.push(job);
        }

        // Run the scraper
        console.log('🔍 Starting review scraper...');
        const result = await runProductScraping(product, sources, { limit: 20 }, jobs);
        
        console.log('\n--- Scraping Summary ---');
        console.log(`Status: SUCCEEDED`);
        console.log(`Reviews Found: ${result.reviewsFound}`);
        console.log(`Reviews Saved: ${result.reviewsSaved}`);
        console.log('------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
