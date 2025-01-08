-- Create the database and select it
CREATE DATABASE IF NOT EXISTS studentswap;
USE studentswap;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(64),
    lastName VARCHAR(64),
    email VARCHAR(255),
    hashedPassword VARCHAR(128),
    lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    width INT NOT NULL,
    height INT NOT NULL,
    operatingSystem VARCHAR(32),
    needsToChangePassword BOOLEAN DEFAULT TRUE,
    isOnline BOOLEAN DEFAULT FALSE
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0), -- Ensure non-negative quantity
    imageURL VARCHAR(255) DEFAULT NULL
);

INSERT INTO products(
    name,
    description,
    price,
    quantity,
    imageURL
) VALUES (
    'MacBook Pro',
    'A powerful laptop for professionals',
    1999.99,
    10,
    'https://via.placeholder.com/150'
), (
    'iPhone 12',
    'The latest iPhone model',
    999.99,
    20,
    'https://via.placeholder.com/150'
), (
    'iPad Pro',
    'A powerful tablet for professionals',
    799.99,
    15,
    'https://via.placeholder.com/150'
), (
    'Apple Watch Series 6',
    'The latest Apple Watch model',
    399.99,
    30,
    'https://via.placeholder.com/150'
), (
    'AirPods Pro',
    'The latest AirPods model',
    249.99,
    40,
    'https://via.placeholder.com/150'
), (
    'iMac',
    'A powerful desktop computer',
    1799.99,
    5,
    'https://via.placeholder.com/150'
), (
    'Mac Mini',
    'A compact desktop computer',
    699.99,
    8,
    'https://via.placeholder.com/150'
), (
    'HomePod Mini',
    'A smart speaker for your home',
    99.99,
    25,
    'https://via.placeholder.com/150'
), (
    'Apple TV 4K',
    'A streaming device for your TV',
    179.99,
    12,
    'https://via.placeholder.com/150'
), (
    'Magic Keyboard',
    'A wireless keyboard for your Mac',
    99.99,
    20,
    'https://via.placeholder.com/150'
), (
    'Magic Mouse',
    'A wireless mouse for your Mac',
    79.99,
    15,
    'https://via.placeholder.com/150'
), (
    'Apple Pencil',
    'A stylus for your iPad',
    99.99,
    10,
    'https://via.placeholder.com/150'
), (
    'Apple Leather Case',
    'A protective case for your iPhone',
    49.99,
    30,
    'https://via.placeholder.com/150'
), (
    'Apple Smart Folio',
    'A protective case for your iPad',
    79.99,
    20,
    'https://via.placeholder.com/150'
), (
    'Apple Watch Band',
    'A stylish band for your Apple Watch',
    49.99,
    25,
    'https://via.placeholder.com/150'
);

-- Carts table (links to users)
CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- CartItems table (links carts to products)
CREATE TABLE IF NOT EXISTS cartItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cartId INT NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0), -- Quantity must be positive
    FOREIGN KEY (cartId) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table (stores completed orders)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    totalAmount DECIMAL(10, 2) NOT NULL,
    shippingCost DECIMAL(10, 2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- OrderItems table (links orders to products)
CREATE TABLE IF NOT EXISTS orderItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    productId INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0), -- Quantity must be positive
    priceAtPurchase DECIMAL(10, 2) NOT NULL, -- Price of product at the time of purchase
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);
