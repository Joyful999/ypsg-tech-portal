-- =========================================================
-- YPSG TECH PORTAL — DATABASE SCHEMA
-- Run this once against your MySQL server, e.g.:
--   mysql -u root -p < sql/schema.sql
-- =========================================================

CREATE DATABASE IF NOT EXISTS ypsg_tech_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ypsg_tech_portal;

-- ---------------------------------------------------------
-- Participants (registered seminar attendees)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Admins (separate table from participants, on purpose —
-- admin auth uses its own JWT secret and its own login route)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Certificates (one-to-one with users; the "cannot be edited
-- after submission" rule is enforced by treating the row's
-- existence as the lock, not just an application-level check)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  certificate_name VARCHAR(150) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  status ENUM('generated', 'email_pending', 'email_sent', 'email_failed') NOT NULL DEFAULT 'email_pending',
  regeneration_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  emailed_at TIMESTAMP NULL DEFAULT NULL,

  CONSTRAINT fk_certificates_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  INDEX idx_certificates_status (status)
) ENGINE=InnoDB;
