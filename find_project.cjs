/**
 * find_project.cjs - List projects so we can seed data appropriately
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsewatch';

async function listProjects() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
  // Just use a raw query, assuming collection is 'projects'
  const db = mongoose.connection.db;
  const projects = await db.collection('projects').find({}).toArray();
  
  if (projects.length === 0) {
      console.log('No projects found in DB!');
  } else {
      console.log(`Found ${projects.length} projects:`);
      projects.forEach(p => console.log(` - ID: ${p._id}, Name: ${p.name || p.title || 'Unknown'}`));
  }
  process.exit(0);
}
listProjects().catch(console.error);
