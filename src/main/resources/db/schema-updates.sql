-- =============================================================================
-- Salon Management System — database updates (2026)
-- Database: SalonMangement (MySQL / MariaDB via XAMPP)
--
-- When to run:
--   Usually NOT needed — restart the Spring Boot app and JPA will update schema
--   (spring.jpa.hibernate.ddl-auto=update) and DataSeeder runs migrations.
--
-- Run manually only if you prefer SQL or the app cannot start:
--   mysql -u root SalonMangement < src/main/resources/db/schema-updates.sql
-- =============================================================================

USE SalonMangement;

-- 1) Service categories for public price list
-- Ignore error "Duplicate column name 'category'" if JPA already added it.
ALTER TABLE salon_services
  ADD COLUMN category VARCHAR(255) NULL AFTER name;

-- 2) Website contact form messages (table created by JPA if missing)
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NULL,
  message VARCHAR(2000) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_contact_messages_created_at (created_at)
);

-- 3) Legacy role fix — login now uses role from DB, not dropdown
UPDATE users u
INNER JOIN roles r_old ON u.role_id = r_old.id
INNER JOIN roles r_new ON r_new.role_name = 'Cashier'
SET u.role_id = r_new.id
WHERE r_old.role_name IN ('Chashire', 'Cashire');

-- 4) Main branch details (matches public website)
UPDATE branches
SET
  branch_name = 'Lumière Salon — Main Branch',
  address = '123 Main Street, Colombo, Sri Lanka',
  phone = '+94 11 555 0100'
WHERE branch_name = 'Main Branch'
   OR address = '123 Main St'
   OR address IS NULL
   OR phone = '555-0100'
LIMIT 1;

-- 5) Backfill service categories where empty
UPDATE salon_services SET category = 'Hair Care'
WHERE (category IS NULL OR category = '') AND name IN (
  'Women''s Haircut & Blow Dry', 'Full Hair Colour', 'Keratin Smoothing Treatment'
);

UPDATE salon_services SET category = 'Skin & Facials'
WHERE (category IS NULL OR category = '') AND name IN (
  'Classic Deep Cleansing Facial', 'Gold Glow Facial'
);

UPDATE salon_services SET category = 'Nails'
WHERE (category IS NULL OR category = '') AND name IN (
  'Classic Manicure', 'Gel Manicure', 'Spa Pedicure'
);

UPDATE salon_services SET category = 'Bridal & Occasions'
WHERE (category IS NULL OR category = '') AND name IN (
  'Bridal Hair & Makeup Trial', 'Party Makeup'
);

UPDATE salon_services SET category = 'Spa & Wellness'
WHERE (category IS NULL OR category = '') AND name IN (
  'Head & Shoulder Massage', 'Aromatherapy Body Relaxation'
);

UPDATE salon_services SET category = 'Other Services'
WHERE category IS NULL OR category = '';

-- 6) Ensure default staff users exist with Cashier role (passwords set by DataSeeder on first run)
-- No password changes here — BCrypt hashes must be created by the application.

SELECT 'Schema/data migration script finished.' AS status;
