const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Review = require('./Review');
const ReviewHelpfulVote = require('./ReviewHelpfulVote');
const ReviewSource = require('./ReviewSource');
const ScrapingJob = require('./ScrapingJob');
const Reward = require('./Reward');
const UserReward = require('./UserReward');

// Define associations

// User <-> Product (one-to-many: user creates products)
User.hasMany(Product, {
    foreignKey: 'createdBy',
    as: 'products'
});
Product.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator'
});

// User <-> Review (one-to-many: user writes reviews)
User.hasMany(Review, {
    foreignKey: 'userId',
    as: 'reviews'
});
Review.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Product <-> Review (one-to-many: product has reviews)
Product.hasMany(Review, {
    foreignKey: 'productId',
    as: 'reviews'
});
Review.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

// ReviewSource <-> Review (one-to-many: source has reviews)
ReviewSource.hasMany(Review, {
    foreignKey: 'sourceId',
    as: 'reviews'
});
Review.belongsTo(ReviewSource, {
    foreignKey: 'sourceId',
    as: 'source'
});

// Product <-> ScrapingJob (one-to-many: product has scraping jobs)
Product.hasMany(ScrapingJob, {
    foreignKey: 'productId',
    as: 'scrapingJobs'
});
ScrapingJob.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

// ReviewSource <-> ScrapingJob (one-to-many: source has scraping jobs)
ReviewSource.hasMany(ScrapingJob, {
    foreignKey: 'sourceId',
    as: 'scrapingJobs'
});
ScrapingJob.belongsTo(ReviewSource, {
    foreignKey: 'sourceId',
    as: 'source'
});

// User <-> Review (many-to-many through ReviewHelpfulVote: users vote reviews helpful)
User.belongsToMany(Review, {
    through: ReviewHelpfulVote,
    foreignKey: 'userId',
    otherKey: 'reviewId',
    as: 'helpfulReviews'
});
Review.belongsToMany(User, {
    through: ReviewHelpfulVote,
    foreignKey: 'reviewId',
    otherKey: 'userId',
    as: 'helpfulVoters'
});

// User <-> UserReward (one-to-many: user redeems rewards)
User.hasMany(UserReward, {
    foreignKey: 'userId',
    as: 'userRewards'
});
UserReward.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Reward <-> UserReward (one-to-many: reward has many redemptions)
Reward.hasMany(UserReward, {
    foreignKey: 'rewardId',
    as: 'redemptions'
});
UserReward.belongsTo(Reward, {
    foreignKey: 'rewardId',
    as: 'rewardInfo'
});

module.exports = {
    sequelize,
    User,
    Product,
    Review,
    ReviewHelpfulVote,
    ReviewSource,
    ScrapingJob,
    Reward,
    UserReward
};
