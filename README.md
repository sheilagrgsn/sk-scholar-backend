
# SK-Scholar Backend

Real backend for Barangay Calapan SK-Scholar.

## Setup
npm install
cp .env.example .env
npm run dev

## API
GET /api/health
GET /api/stats -> { applicationsThisYear, activeScholars, fundDisbursed }
POST /api/applications -> multipart/form-data: fullName, purok, school, yearLevel, contact, cert(file), coe(file) OR JSON { ref, ... }
GET /api/applications/:ref

## Deploy
- Render: connect repo, start command `node server.js`
- Railway / Fly.io supported

For production, replace db.json with MongoDB Atlas or Supabase.
