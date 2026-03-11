-- ============================================
-- LEAD MANAGEMENT APP v3 - MySQL Schema
-- Email OTP Auth (no Twilio)
-- ============================================

CREATE DATABASE IF NOT EXISTS lead_management;
USE lead_management;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  mobile      VARCHAR(15)  NOT NULL,
  otp         VARCHAR(6),
  otp_expiry  DATETIME,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  company_name  VARCHAR(200) NOT NULL,
  person_name   VARCHAR(150) NOT NULL,
  contact_no    VARCHAR(15)  NOT NULL,
  contact_email VARCHAR(150),
  lead_type     ENUM('Product','Development','Resources','Other') NOT NULL DEFAULT 'Other',
  status        ENUM('In Progress','Converted','Lost') NOT NULL DEFAULT 'In Progress',
  description   TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status  ON leads(status);
CREATE INDEX idx_leads_type    ON leads(lead_type);
CREATE INDEX idx_users_email   ON users(email);

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Dashboard stats:
-- SELECT COUNT(*) AS total,
--   SUM(status='In Progress') AS in_progress,
--   SUM(status='Converted')   AS converted,
--   SUM(status='Lost')        AS lost
-- FROM leads WHERE user_id = ?;

-- All leads (with optional filters):
-- SELECT * FROM leads WHERE user_id = ? [AND status=?] [AND lead_type=?]
--   [AND (company_name LIKE ? OR person_name LIKE ?)]
--   ORDER BY created_at DESC;

-- Create lead:
-- INSERT INTO leads (user_id,company_name,person_name,contact_no,contact_email,lead_type,status,description)
-- VALUES (?,?,?,?,?,?,?,?);

-- Update lead:
-- UPDATE leads SET company_name=?,person_name=?,contact_no=?,contact_email=?,
--   lead_type=?,status=?,description=? WHERE id=? AND user_id=?;

-- Delete lead:
-- DELETE FROM leads WHERE id=? AND user_id=?;
