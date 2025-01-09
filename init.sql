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
    'https://d2e6ccujb3mkqf.cloudfront.net/6ff668c3-51f8-4772-bad5-683ccac5be04-1_15331178-e3c0-4fe7-9c85-5672098826b9.jpg'
), (
    'iPhone 12',
    'The latest iPhone model',
    999.99,
    20,
    'https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MP_108019322/fee_786_587_png'
), (
    'iPad Pro',
    'A powerful tablet for professionals',
    799.99,
    15,
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/refurb-ipad-pro-12-wifi-spacegray-2021?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1674663706569'
), (
    'Apple Watch Series 6',
    'The latest Apple Watch model',
    399.99,
    30,
    'https://m.media-amazon.com/images/I/71Km8qFU0KL.jpg'
), (
    'AirPods Pro',
    'The latest AirPods model',
    249.99,
    40,
    'https://m.media-amazon.com/images/I/61sRKTAfrhL._AC_UF1000,1000_QL80_.jpg'
), (
    'iMac',
    'A powerful desktop computer',
    1799.99,
    5,
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/refurb-imac-24-touch-id-purple-202402?wid=1000&hei=1000&fmt=jpeg&qlt=95&.v=1709178834593'
), (
    'Mac Mini',
    'A compact desktop computer',
    699.99,
    8,
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mac-mini-og-202410?wid=1200&hei=630&fmt=jpeg&qlt=95&.v=1729476438669'
), (
    'HomePod Mini',
    'A smart speaker for your home',
    99.99,
    25,
    'https://static.bueroplus.de/img/13/8/Zoom_m2569093.jpg?width=800&height=800&fit=contain&bg=ffffff'
), (
    'Apple TV 4K',
    'A streaming device for your TV',
    179.99,
    12,
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-tv-4k-hero-select-202210_FMT_WHH?wid=640&hei=600&fmt=jpeg&qlt=90&.v=1664896361164'
),(
    'Küchenmaschine Deluxe',
    'A multifunctional food processor for your cooking needs',
    499.99,
    10,
    'https://example.com/images/kuechenmaschine.jpg'
), (
    'Magic Keyboard',
    'A wireless keyboard for your Mac',
    99.99,
    20,
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MXCL3RS_AV3?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=1730833503924'
), (
    'Magic Mouse',
    'A wireless mouse for your Mac',
    79.99,
    15,
    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/MXK53?wid=2000&hei=2000&fmt=jpeg&qlt=95&.v=1730508286345'
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
