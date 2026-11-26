require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'placement_db',
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const [students] = await pool.query('SELECT COUNT(*) total FROM students');
    const [companies] = await pool.query('SELECT COUNT(*) total FROM companies');
    const [jobs] = await pool.query('SELECT COUNT(*) total FROM jobs');
    const [placed] = await pool.query('SELECT COUNT(*) total FROM placements');
    res.json({students: students[0].total, companies: companies[0].total,
      jobs: jobs[0].total, placed: placed[0].total});
  } catch (e) { res.status(500).json({error: e.message}); }
});

app.get('/api/students', async (req,res) => {
  try { const [rows]=await pool.query('SELECT * FROM students ORDER BY student_id DESC'); res.json(rows); }
  catch(e){res.status(500).json({error:e.message});}
});
app.post('/api/students', async (req,res) => {
  const {full_name,email,department,graduation_year,cgpa}=req.body;
  try { await pool.query('INSERT INTO students(full_name,email,department,graduation_year,cgpa) VALUES(?,?,?,?,?)',[full_name,email,department,graduation_year,cgpa]); res.redirect('/'); }
  catch(e){res.status(400).send('Could not add student: '+e.message+' <a href="/">Back</a>');}
});

app.get('/api/companies', async(req,res)=>{
  try {const [rows]=await pool.query('SELECT * FROM companies ORDER BY company_id DESC');res.json(rows);}
  catch(e){res.status(500).json({error:e.message});}
});
app.post('/api/companies',async(req,res)=>{
  const {company_name,industry,location}=req.body;
  try{await pool.query('INSERT INTO companies(company_name,industry,location) VALUES(?,?,?)',[company_name,industry,location]);res.redirect('/');}
  catch(e){res.status(400).send('Could not add company: '+e.message+' <a href="/">Back</a>');}
});

app.get('/api/jobs',async(req,res)=>{
  try{const [rows]=await pool.query(`SELECT j.*,c.company_name FROM jobs j JOIN companies c ON c.company_id=j.company_id ORDER BY j.job_id DESC`);res.json(rows);}
  catch(e){res.status(500).json({error:e.message});}
});
app.post('/api/jobs',async(req,res)=>{
  const {company_id,job_title,package_lpa,min_cgpa,description}=req.body;
  try{await pool.query('INSERT INTO jobs(company_id,job_title,package_lpa,min_cgpa,description) VALUES(?,?,?,?,?)',[company_id,job_title,package_lpa,min_cgpa,description]);res.redirect('/');}
  catch(e){res.status(400).send('Could not add job: '+e.message+' <a href="/">Back</a>');}
});

app.get('/api/applications',async(req,res)=>{
  try{const [rows]=await pool.query(`SELECT a.*,s.full_name,j.job_title,c.company_name FROM applications a JOIN students s ON s.student_id=a.student_id JOIN jobs j ON j.job_id=a.job_id JOIN companies c ON c.company_id=j.company_id ORDER BY a.application_id DESC`);res.json(rows);}
  catch(e){res.status(500).json({error:e.message});}
});
app.post('/api/applications',async(req,res)=>{
  const {student_id,job_id}=req.body;
  try{
    const [[s]]=await pool.query('SELECT cgpa FROM students WHERE student_id=?',[student_id]);
    const [[j]]=await pool.query('SELECT min_cgpa FROM jobs WHERE job_id=?',[job_id]);
    if(!s||!j) return res.status(400).send('Select a valid student and job. <a href="/">Back</a>');
    if(Number(s.cgpa)<Number(j.min_cgpa)) return res.status(400).send('Student does not meet the job CGPA requirement. <a href="/">Back</a>');
    await pool.query('INSERT INTO applications(student_id,job_id) VALUES(?,?)',[student_id,job_id]);
    res.redirect('/');
  }catch(e){res.status(400).send('Application could not be created (possibly duplicate): '+e.message+' <a href="/">Back</a>');}
});

app.post('/api/applications/:id/status',async(req,res)=>{
  try{await pool.query('UPDATE applications SET status=? WHERE application_id=?',[req.body.status,req.params.id]);res.redirect('/');}
  catch(e){res.status(400).send(e.message);}
});
app.post('/api/placements',async(req,res)=>{
  const {student_id,company_id,package_lpa}=req.body;
  const conn=await pool.getConnection();
  try{
    await conn.beginTransaction();
    await conn.query("UPDATE applications SET status='Selected' WHERE student_id=? AND status='Shortlisted'",[student_id]);
    await conn.query('INSERT INTO placements(student_id,company_id,package_lpa) VALUES(?,?,?)',[student_id,company_id,package_lpa]);
    await conn.commit();res.redirect('/');
  }catch(e){await conn.rollback();res.status(400).send('Placement not saved: '+e.message+' <a href="/">Back</a>');}
  finally{conn.release();}
});

app.get('/api/reports',async(req,res)=>{
  try{
    const [byDept]=await pool.query('SELECT department,COUNT(*) total_students, SUM(student_id IN (SELECT student_id FROM placements)) placed FROM students GROUP BY department');
    const [byCompany]=await pool.query('SELECT c.company_name,COUNT(p.placement_id) hires,ROUND(AVG(p.package_lpa),2) avg_package FROM companies c LEFT JOIN placements p ON p.company_id=c.company_id GROUP BY c.company_id ORDER BY hires DESC');
    const [summary]=await pool.query('SELECT COUNT(*) total,ROUND(100*COUNT(p.placement_id)/NULLIF(COUNT(s.student_id),0),2) placement_percentage,MAX(p.package_lpa) highest_package,ROUND(AVG(p.package_lpa),2) average_package FROM students s LEFT JOIN placements p ON p.student_id=s.student_id');
    res.json({byDept,byCompany,summary:summary[0]});
  }catch(e){res.status(500).json({error:e.message});}
});

app.listen(process.env.PORT || 3000,()=>console.log('Placement app running at http://localhost:'+(process.env.PORT||3000)));
