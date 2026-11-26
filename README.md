# Student Placement Management System (DBMS Capstone)

A simple, functional placement dashboard built with **Node.js, Express and MySQL**.

## Features
- Student, company and job-opening records
- Apply students to jobs, with CGPA eligibility validation
- Application status updates
- Record final placements
- Dashboard counts and placement reports
- Relational schema with PK/FK constraints, unique application rule and transaction for placement entry

## Run on macOS

1. Install Node.js and MySQL if not already installed.
2. Open Terminal in this folder.
3. Create the database and tables:
   ```bash
   mysql -u root -p < database.sql
   ```
4. Install packages:
   ```bash
   npm install
   ```
5. Create local environment file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and enter your MySQL password.
6. Start:
   ```bash
   npm start
   ```
7. Open **http://localhost:3000**

## Database design
`students`, `companies`, `jobs`, `applications`, and `placements` are connected through primary and foreign keys. Applications use a unique constraint on `(student_id, job_id)` so a student cannot apply twice to the same job.

## Important
This is a college project/demo, not a production system. It does not include authentication, role permissions, or deployment hardening. Never expose it publicly with real student data as-is.
