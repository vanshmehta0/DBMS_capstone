CREATE DATABASE IF NOT EXISTS placement_db;
USE placement_db;

CREATE TABLE IF NOT EXISTS students (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  department VARCHAR(80) NOT NULL,
  graduation_year INT NOT NULL,
  cgpa DECIMAL(3,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
  company_id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(120) NOT NULL,
  industry VARCHAR(80),
  location VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS jobs (
  job_id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  job_title VARCHAR(120) NOT NULL,
  package_lpa DECIMAL(6,2) NOT NULL,
  min_cgpa DECIMAL(3,2) NOT NULL DEFAULT 0,
  description TEXT,
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS applications (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  job_id INT NOT NULL,
  applied_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  status ENUM('Applied','Shortlisted','Rejected','Selected') NOT NULL DEFAULT 'Applied',
  UNIQUE KEY unique_application(student_id, job_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS placements (
  placement_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL UNIQUE,
  company_id INT NOT NULL,
  package_lpa DECIMAL(6,2) NOT NULL,
  placed_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Optional sample records
INSERT INTO students(full_name,email,department,graduation_year,cgpa)
VALUES ('Aarav Sharma','aarav@example.com','CSE',2027,8.40)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);
INSERT INTO companies(company_name,industry,location)
VALUES ('TechNova','IT','Delhi');
INSERT INTO jobs(company_id,job_title,package_lpa,min_cgpa,description)
SELECT company_id,'Software Developer',6.50,7.00,'Entry-level developer role'
FROM companies WHERE company_name='TechNova' LIMIT 1;
