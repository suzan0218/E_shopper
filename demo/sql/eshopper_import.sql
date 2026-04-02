-- EShopper MySQL import file
-- Import in phpMyAdmin or MySQL CLI.

CREATE DATABASE IF NOT EXISTS eshopper
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE eshopper;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS order_item;
DROP TABLE IF EXISTS customer_orders;
DROP TABLE IF EXISTS contact_message;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS category;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE category (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(500) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE product (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000) NULL,
  image_url VARCHAR(255) NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NULL,
  rating DOUBLE NULL,
  review_count INT NULL,
  stock INT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  category_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_product_category_id (category_id),
  CONSTRAINT fk_product_category
    FOREIGN KEY (category_id) REFERENCES category (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE contact_message (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE customer_orders (
  id BIGINT NOT NULL AUTO_INCREMENT,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  address_line VARCHAR(500) NOT NULL,
  notes TEXT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'NEW',
  created_at DATETIME(6) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE order_item (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_item_order_id (order_id),
  KEY idx_order_item_product_id (product_id),
  CONSTRAINT fk_order_item_order
    FOREIGN KEY (order_id) REFERENCES customer_orders (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_order_item_product
    FOREIGN KEY (product_id) REFERENCES product (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO category (id, name, description) VALUES
  (1, 'Shirts', 'Casual and formal shirts'),
  (2, 'Dresses', 'All kinds of dresses'),
  (3, 'Shoes', 'Footwear collection'),
  (4, 'Jackets', 'Warm and stylish jackets');

INSERT INTO product (
  id, name, description, image_url, price, original_price, rating, review_count, stock, active, category_id
) VALUES
  (1, 'Colorful Stylish Shirt', 'Soft cotton shirt for daily wear', 'img/product-1.jpg', 123.00, 150.00, 4.3, 50, 40, 1, 1),
  (2, 'Classic White Shirt', 'Formal shirt with slim fit', 'img/product-2.jpg', 99.00, 129.00, 4.1, 38, 35, 1, 1),
  (3, 'Summer Floral Dress', 'Lightweight dress for summer', 'img/product-3.jpg', 149.00, 199.00, 4.6, 64, 24, 1, 2),
  (4, 'Evening Party Dress', 'Elegant evening wear', 'img/product-4.jpg', 199.00, 249.00, 4.5, 45, 15, 1, 2),
  (5, 'Running Shoes', 'Comfortable shoes with grip sole', 'img/product-5.jpg', 139.00, 179.00, 4.4, 89, 50, 1, 3),
  (6, 'Leather Sneakers', 'Premium sneakers for daily use', 'img/product-6.jpg', 179.00, 229.00, 4.2, 33, 28, 1, 3),
  (7, 'Denim Jacket', 'Classic denim jacket', 'img/product-7.jpg', 169.00, 219.00, 4.1, 26, 22, 1, 4),
  (8, 'Winter Puffer Jacket', 'Insulated winter jacket', 'img/product-8.jpg', 229.00, 299.00, 4.7, 71, 12, 1, 4);

ALTER TABLE category AUTO_INCREMENT = 5;
ALTER TABLE product AUTO_INCREMENT = 9;
