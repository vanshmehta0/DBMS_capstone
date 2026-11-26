const content=document.getElementById('content'), search=document.getElementById('search');
let current='students', cache={};
const titles={students:'Students',companies:'Companies',jobs:'Job openings',applications:'Applications',placements:'Placements',reports:'Placement reports'};
async function get(url){const r=await fetch(url);if(!r.ok)throw Error(await r.text());return r.json()}
async function refreshStats(){const d=await get('/api/dashboard');for(const k of Object.keys(d))document.getElementById(k).textContent=d[k]}
function form(action,fields){return `<form class="form" method="post" action="${action}">${fields.join('')}<button type="submit">Add record</button></form>`}
function field(name,placeholder,type='text',required=true){return `<input name="${name}" placeholder="${placeholder}" type="${type}" ${required?'required':''}>`}
function select(name,items,label){return `<select name="${name}" required><option value="">${label}</option>${items.map(x=>`<option value="${x.id}">${esc(x.label)}</option>`).join('')}</select>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function table(headers,rows){if(!rows.length)return '<div class="empty">No records yet. Add your first record above.</div>';return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
async function render(){
 document.getElementById('section-title').textContent=titles[current];search.style.display=current==='reports'?'none':'block';
 try{
 if(current==='students'){
 cache.students=await get('/api/students');
 content.innerHTML=form('/api/students',[field('full_name','Full name'),field('email','Email','email'),field('department','Department'),field('graduation_year','Graduation year','number'),`<input name="cgpa" placeholder="CGPA" type="number" step="0.01" min="0" max="10" required>`])+table(['ID','Name','Email','Department','Year','CGPA'],cache.students.map(s=>[s.student_id,esc(s.full_name),esc(s.email),esc(s.department),s.graduation_year,s.cgpa]));
 }else if(current==='companies'){
 cache.companies=await get('/api/companies');
 content.innerHTML=form('/api/companies',[field('company_name','Company name'),field('industry','Industry', 'text',false),field('location','Location','text',false)])+table(['ID','Company','Industry','Location'],cache.companies.map(c=>[c.company_id,esc(c.company_name),esc(c.industry),esc(c.location)]));
 }else if(current==='jobs'){
 const [jobs,companies]=await Promise.all([get('/api/jobs'),get('/api/companies')]);cache.jobs=jobs;cache.companies=companies;
 content.innerHTML=form('/api/jobs',[select('company_id',companies.map(c=>({id:c.company_id,label:c.company_name})),'Choose company'),field('job_title','Job title'),field('package_lpa','Package (LPA)','number'),field('min_cgpa','Minimum CGPA','number'),field('description','Description','text',false)])+table(['ID','Company','Role','Package (LPA)','Min CGPA','Description'],jobs.map(j=>[j.job_id,esc(j.company_name),esc(j.job_title),j.package_lpa,j.min_cgpa,esc(j.description)]));
 }else if(current==='applications'){
 const [apps,students,jobs]=await Promise.all([get('/api/applications'),get('/api/students'),get('/api/jobs')]);cache.applications=apps;
 content.innerHTML=form('/api/applications',[select('student_id',students.map(s=>({id:s.student_id,label:s.full_name+' (CGPA '+s.cgpa+')'})),'Choose student'),select('job_id',jobs.map(j=>({id:j.job_id,label:j.job_title+' — '+j.company_name})),'Choose job')])+table(['ID','Student','Company','Role','Applied on','Status','Update status'],apps.map(a=>[a.application_id,esc(a.full_name),esc(a.company_name),esc(a.job_title),a.applied_on,`<span class="pill">${a.status}</span>`,`<form method="post" action="/api/applications/${a.application_id}/status" style="display:flex;gap:5px"><select name="status"><option>Applied</option><option>Shortlisted</option><option>Rejected</option><option>Selected</option></select><button class="tab" type="submit">Save</button></form>`]));
 }else if(current==='placements'){
 const [students,companies]=await Promise.all([get('/api/students'),get('/api/companies')]);
 content.innerHTML=form('/api/placements',[select('student_id',students.map(s=>({id:s.student_id,label:s.full_name})),'Choose student'),select('company_id',companies.map(c=>({id:c.company_id,label:c.company_name})),'Choose company'),field('package_lpa','Package (LPA)','number')])+table(['Student','Company','Package'],(await get('/api/reports')).byCompany.map(c=>[esc(c.company_name),c.hires,c.avg_package??'—']));
 }else{
 const r=await get('/api/reports');
 content.innerHTML=`<div class="report-grid"><div class="report-card"><h3>Placement overview</h3>${table(['Metric','Value'],[['Students',r.summary.total],['Placement %',r.summary.placement_percentage+'%'],['Highest package',r.summary.highest_package+' LPA'],['Average package',r.summary.average_package+' LPA']])}</div><div class="report-card"><h3>Department-wise report</h3>${table(['Department','Students','Placed'],r.byDept.map(x=>[esc(x.department),x.total_students,x.placed]))}</div><div class="report-card"><h3>Company-wise hiring</h3>${table(['Company','Hires','Average LPA'],r.byCompany.map(x=>[esc(x.company_name),x.hires,x.avg_package??'—']))}</div></div>`;
 }
 }catch(e){content.innerHTML=`<div class="empty">Unable to load data. Check MySQL setup and start the server.<br><small>${esc(e.message)}</small></div>`}
}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');current=b.dataset.view;render()}));
search.addEventListener('input',()=>{const q=search.value.toLowerCase();content.querySelectorAll('tbody tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?'':'none')});
refreshStats().catch(()=>{});render();
