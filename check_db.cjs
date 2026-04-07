const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsewatch';

async function check() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  
  const cabLogs = await db.collection('logs').countDocuments({ project_id: '69c05f265bcad42f6c04b2de' });
  const cabTraces = await db.collection('traces').countDocuments({ project_id: '69c05f265bcad42f6c04b2de' });
  
  console.log(`CAB Logs: ${cabLogs}`);
  console.log(`CAB Traces: ${cabTraces}`);

  // Fetch all distinct project IDs in traces
  const distinctProjects = await db.collection('traces').distinct('project_id');
  console.log('Project IDs in Traces:', distinctProjects);

  process.exit(0);
}
check();
