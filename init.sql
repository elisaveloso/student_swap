-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS studentswap;
USE studentswap;

-- Create the orders table with the specified columns if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
	firstName varchar(64),
    lastName varchar(64),
    email varchar(255),
    hashedPassword varchar(128),
    lastLogin timestamp DEFAULT CURRENT_TIMESTAMP,
    width INT NOT NULL,
    height INT NOT NULL,
    operatingSystem varchar(32),
    needsToChangePassword BOOLEAN DEFAULT TRUE
);