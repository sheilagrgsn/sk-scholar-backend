
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

// Storage
const uploadDir = path.join(__dirname, 'uploads')
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req,file,cb)=> cb(null, Date.now()+'-'+file.originalname)
})
const upload = multer({ storage, limits:{fileSize:5*1024*1024} })

// Simple JSON DB (replace with MongoDB/Supabase in prod)
const dbFile = path.join(__dirname, 'db.json')
if(!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([]))
const getDB = ()=> JSON.parse(fs.readFileSync(dbFile))
const saveDB = (data)=> fs.writeFileSync(dbFile, JSON.stringify(data,null,2))

// Routes
app.get('/api/health', (req,res)=> res.json({ ok:true, message:'SK-Scholar API running', time: new Date().toISOString() }))

app.get('/api/stats', (req,res)=>{
  const db = getDB()
  res.json({
    applicationsThisYear: db.length || 10,
    activeScholars: 20,
    fundDisbursed: 64000,
    audited: true
  })
})

app.post('/api/applications', upload.fields([{name:'cert'},{name:'coe'}]), (req,res)=>{
  // Support both JSON (from frontend local version) and multipart
  let payload = req.body
  if(typeof payload.fullName === 'undefined' && req.body.data){
    try{ payload = JSON.parse(req.body.data) }catch{}
  }
  const ref = payload.ref || `SK-2026-${Math.floor(1000+Math.random()*9000)}`
  const record = {
    ref,
    fullName: payload.fullName,
    purok: payload.purok,
    school: payload.school,
    yearLevel: payload.yearLevel,
    contact: payload.contact,
    status: 'Submitted',
    date: new Date().toISOString(),
    history: [{status:'Submitted', date: new Date().toLocaleString()}],
    files: req.files ? Object.keys(req.files).reduce((acc,k)=>{acc[k]=req.files[k][0].filename; return acc},{}) : payload.files
  }
  const db = getDB()
  db.unshift(record)
  saveDB(db)
  res.json({ success:true, ref, record })
})

app.get('/api/applications/:ref', (req,res)=>{
  const db = getDB()
  const found = db.find(a=> a.ref.toLowerCase()===req.params.ref.toLowerCase())
  if(!found) return res.status(404).json({ error:'Not found' })
  res.json(found)
})

app.get('/api/applications', (req,res)=>{
  res.json(getDB())
})

app.use('/uploads', express.static(uploadDir))

app.listen(PORT, ()=> console.log(`Backend running http://localhost:${PORT}`))
