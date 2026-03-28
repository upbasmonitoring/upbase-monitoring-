import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Monitor from '../models/Monitor.js';

dotenv.config({ path: '../.env' });

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const result = await Monitor.updateMany(
      { name: 'cab moniting' }, 
      { isBaselineError: false, lastRalphAnalysisAt: null }
    );
    
    console.log(`✅ Baseline cleared for ${result.modifiedCount} monitor(s). Ralph is now FREE to act.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fix();
