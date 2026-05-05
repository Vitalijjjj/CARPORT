/**
 * Run once to create the first admin user and DB tables.
 * Usage: node seed.js
 *
 * Set env vars before running:
 *   DB_HOST=127.0.0.1 DB_NAME=... DB_USER=... DB_PASS=... ADMIN_EMAIL=... ADMIN_PASS=... node seed.js
 */

import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const db = await mysql.createConnection({
  host:     process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
})

// Create tables if they don't exist
await db.query(`
  CREATE TABLE IF NOT EXISTS admins (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL DEFAULT 'Admin',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY admins_email_unique (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

await db.query(`
  CREATE TABLE IF NOT EXISTS cars (
    id                          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    brand                       VARCHAR(100) NOT NULL,
    model                       VARCHAR(100) NOT NULL,
    version                     VARCHAR(150) DEFAULT NULL,
    year                        SMALLINT UNSIGNED NOT NULL,
    price                       DECIMAL(10,2) NOT NULL,
    mileage                     INT UNSIGNED NOT NULL DEFAULT 0,
    fuel_type                   ENUM('electric','hybrid','petrol','diesel') NOT NULL DEFAULT 'electric',
    transmission                ENUM('automatic','manual') NOT NULL DEFAULT 'automatic',
    power                       SMALLINT UNSIGNED DEFAULT NULL,
    battery_capacity            DECIMAL(5,1) DEFAULT NULL,
    battery_health              TINYINT UNSIGNED DEFAULT NULL,
    electric_range              SMALLINT UNSIGNED DEFAULT NULL,
    drive_type                  VARCHAR(10) DEFAULT NULL,
    exterior_color              VARCHAR(100) DEFAULT NULL,
    interior_color              VARCHAR(100) DEFAULT NULL,
    location                    VARCHAR(200) DEFAULT NULL,
    status                      ENUM('available','reserved','sold','hidden') NOT NULL DEFAULT 'available',
    warranty_available          TINYINT(1) NOT NULL DEFAULT 0,
    warranty_term               VARCHAR(100) DEFAULT NULL,
    financing_available         TINYINT(1) NOT NULL DEFAULT 0,
    trade_in_available          TINYINT(1) NOT NULL DEFAULT 0,
    service_history_available   TINYINT(1) NOT NULL DEFAULT 0,
    delivery_available_portugal TINYINT(1) NOT NULL DEFAULT 0,
    short_description           TEXT DEFAULT NULL,
    full_description            MEDIUMTEXT DEFAULT NULL,
    equipment                   TEXT DEFAULT NULL,
    features                    JSON DEFAULT NULL,
    gallery                     JSON DEFAULT NULL,
    main_image                  VARCHAR(500) DEFAULT NULL,
    meta_title                  VARCHAR(200) DEFAULT NULL,
    meta_description            TEXT DEFAULT NULL,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

await db.query(`
  CREATE TABLE IF NOT EXISTS leads (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(200) DEFAULT NULL,
    phone        VARCHAR(50)  DEFAULT NULL,
    email        VARCHAR(255) DEFAULT NULL,
    message      TEXT         DEFAULT NULL,
    source       VARCHAR(50)  NOT NULL DEFAULT 'form',
    car_id       INT UNSIGNED DEFAULT NULL,
    quiz_answers JSON         DEFAULT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`)

const adminEmail = process.env.ADMIN_EMAIL || 'admin@carrai.com'
const adminPass  = process.env.ADMIN_PASS  || 'changeme123'
const hash = await bcrypt.hash(adminPass, 12)

const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [adminEmail])
if (existing.length > 0) {
  await db.query('UPDATE admins SET password_hash = ? WHERE email = ?', [hash, adminEmail])
  console.log(`Updated password for ${adminEmail}`)
} else {
  await db.query('INSERT INTO admins (email, password_hash, name) VALUES (?, ?, ?)', [adminEmail, hash, 'Admin'])
  console.log(`Created admin: ${adminEmail}`)
}

await db.end()
console.log('Done.')
