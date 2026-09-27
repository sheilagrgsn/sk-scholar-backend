
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json())

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

const upload = multer({ storage: multer.memoryStorage(), limits:{fileSize:5*1024*1024} })

app.get('/api/health', async (req,res)=>{
  const { error } = await supabase.from('applications').select('id').limit(1)
  res.json({ ok:!error, db: error ? error.message : 'Supabase connected', time: new Date().toISOString() })
})

app.get('/api/stats', async (req,res)=>{
  const { count } = await supabase.from('applications').select('*', {count:'exact', head:true})
  res.json({ applicationsThisYear: count || 10, activeScholars: 20, fundDisbursed: 64000, audited:true })
})

app.post('/api/applications', upload.fields([{name:'cert'},{name:'coe'}]), async (req,res)=>{
  try{
    let payload = req.body
    // handle JSON body from frontend
    if(!payload.fullName && payload.data){ try{ payload=JSON.parse(payload.data) }catch{} }

    const ref = payload.ref || `SK-2026-${Math.floor(1000+Math.random()*9000)}`

    let cert_url=null, coe_url=null, cert_name=null, coe_name=null

    // Upload to Supabase Storage
    for(const field of ['cert','coe']){
      const file = req.files?.[field]?.[0]
      if(file){
        const fileName = `${ref}/${field}-${Date.now()}-${file.originalname}`
        const { error } = await supabase.storage.from(process.env.SUPABASE_BUCKET || 'scholar-docs').upload(fileName, file.buffer, { contentType: file.mimetype, upsert:true })
        if(error) throw error
        const { data } = supabase.storage.from(process.env.SUPABASE_BUCKET || 'scholar-docs').getPublicUrl(fileName)
        if(field==='cert'){ cert_url=data.publicUrl; cert_name=file.originalname }
        else { coe_url=data.publicUrl; coe_name=file.originalname }
      }
    }

    const record = {
      ref,
      full_name: payload.fullName || payload.full_name,
      purok: payload.purok,
      school: payload.school,
      year_level: payload.yearLevel || payload.year_level,
      contact: payload.contact,
      cert_url: cert_url || payload.cert_url || null,
      coe_url: coe_url || payload.coe_url || null,
      cert_name: cert_name || payload.files?.certName || null,
      coe_name: coe_name || payload.files?.coeName || null,
      status: 'Submitted',
      history: [{status:'Submitted', date: new Date().toLocaleString()}]
    }

    const { data, error } = await supabase.from('applications').insert(record).select().single()
    if(error) throw error
    res.json({ success:true, ref, record: data })
  }catch(e){
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/applications/:ref', async (req,res)=>{
  const { data, error } = await supabase.from('applications').select('*').eq('ref', req.params.ref).single()
  if(error || !data) return res.status(404).json({ error:'Not found' })
  res.json(data)
})

app.get('/api/applications', async (req,res)=>{
  const { data } = await supabase.from('applications').select('*').order('created_at',{ascending:false}).limit(100)
  res.json(data)
})

app.listen(PORT, ()=> console.log(`Supabase Backend running on ${PORT}`))
