-- NeuroPick MySQL Database Initialization Script
-- Run this script to create the database and set up initial structure

-- Create database
CREATE DATABASE IF NOT EXISTS neuropick CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE neuropick;

-- Note: Tables will be automatically created by Sequelize when the server starts
-- This script is provided for reference and manual database setup if needed

-- The following tables will be created by Sequelize:
-- 1. users
-- 2. products
-- 3. reviews
-- 4. review_helpful_votes

-- Optional: Create a dedicated database user
-- CREATE USER 'neuropick_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON neuropick.* TO 'neuropick_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Verify database creation
SHOW DATABASES LIKE 'neuropick';
