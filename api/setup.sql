-- =============================================================
-- TURBOEAGLE — Database Setup
-- Run this in Hostinger phpMyAdmin before first use
-- =============================================================

-- ── Admins table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `admins` (
    `id`            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `email`         VARCHAR(255)    NOT NULL,
    `password_hash` VARCHAR(255)    NOT NULL,
    `name`          VARCHAR(100)    NOT NULL DEFAULT 'Admin',
    `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `admins_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Cars table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cars` (
    `id`                          INT UNSIGNED        NOT NULL AUTO_INCREMENT,

    -- Identity
    `brand`                       VARCHAR(100)        NOT NULL,
    `model`                       VARCHAR(100)        NOT NULL,
    `version`                     VARCHAR(150)        DEFAULT NULL  COMMENT 'e.g. eDrive40 M Sport',
    `year`                        SMALLINT UNSIGNED   NOT NULL,

    -- Pricing
    `price`                       DECIMAL(10, 2)      NOT NULL,
    `mileage`                     INT UNSIGNED        NOT NULL DEFAULT 0  COMMENT 'km',

    -- Technical
    `fuel_type`                   ENUM('electric','hybrid','petrol','diesel') NOT NULL DEFAULT 'electric',
    `transmission`                ENUM('automatic','manual')                  NOT NULL DEFAULT 'automatic',
    `power`                       SMALLINT UNSIGNED   DEFAULT NULL  COMMENT 'hp',
    `battery_capacity`            DECIMAL(5, 1)       DEFAULT NULL  COMMENT 'kWh',
    `battery_health`              TINYINT UNSIGNED    DEFAULT NULL  COMMENT '0-100 percent',
    `electric_range`              SMALLINT UNSIGNED   DEFAULT NULL  COMMENT 'km WLTP',
    `drive_type`                  VARCHAR(10)         DEFAULT NULL  COMMENT 'FWD / RWD / AWD / 4WD',

    -- Appearance & location
    `exterior_color`              VARCHAR(100)        DEFAULT NULL,
    `interior_color`              VARCHAR(100)        DEFAULT NULL,
    `location`                    VARCHAR(200)        DEFAULT NULL,

    -- Listing status
    `status`                      ENUM('available','reserved','sold','hidden') NOT NULL DEFAULT 'available',

    -- Options & services
    `warranty_available`          TINYINT(1)          NOT NULL DEFAULT 0,
    `warranty_term`               VARCHAR(100)        DEFAULT NULL  COMMENT 'e.g. 12 months',
    `financing_available`         TINYINT(1)          NOT NULL DEFAULT 0,
    `trade_in_available`          TINYINT(1)          NOT NULL DEFAULT 0,
    `service_history_available`   TINYINT(1)          NOT NULL DEFAULT 0,
    `delivery_available_portugal` TINYINT(1)          NOT NULL DEFAULT 0,

    -- Descriptions
    `short_description`           TEXT                DEFAULT NULL  COMMENT 'Max 250 chars — shown in catalog card',
    `full_description`            MEDIUMTEXT          DEFAULT NULL  COMMENT 'Shown on car detail page',

    -- Equipment & features
    `equipment`                   TEXT                DEFAULT NULL  COMMENT 'Free-text equipment list',
    `features`                    JSON                DEFAULT NULL  COMMENT 'Array of short highlight strings',

    -- Images
    `gallery`                     JSON                DEFAULT NULL  COMMENT 'Array of image URLs',
    `main_image`                  VARCHAR(500)        DEFAULT NULL  COMMENT 'Primary image URL',

    -- SEO
    `meta_title`                  VARCHAR(200)        DEFAULT NULL,
    `meta_description`            TEXT                DEFAULT NULL,

    -- Timestamps
    `created_at`                  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`                  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `cars_status_idx`    (`status`),
    KEY `cars_brand_idx`     (`brand`),
    KEY `cars_year_idx`      (`year`),
    KEY `cars_price_idx`     (`price`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
