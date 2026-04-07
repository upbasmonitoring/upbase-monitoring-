const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsewatch';

async function check() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  
  const cabTraces = await db.collection('traces').find({ project_id: '69c05f265bcad42f6c04b2de' }).toArray();
  
  console.log(`CAB Traces in purely DB: ${cabTraces.length}`);
  if (cabTraces.length > 0) {
      console.log('Sample trace doc max_severity:', cabTraces[0].max_severity);
      console.log('Sample trace doc last_seen:', cabTraces[0].last_seen);
  } else {
      console.log('Look at all traces:');
      const sample = await db.collection('traces').find({}).limit(5).toArray();
      sample.forEach(s => console.log(`Trace: ${s.trace_id}, proj: ${s.project_id}, sev: ${s.max_severity}`));
  }

  process.exit(0);
}
check();
