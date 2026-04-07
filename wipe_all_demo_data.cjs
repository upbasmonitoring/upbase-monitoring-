const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsewatch';

async function wipe() {
  console.log('📡 Connecting to MongoDB to permanently delete logs and traces...');
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  try {
    const logsResult = await db.collection('logs').deleteMany({});
    console.log(`✅ Deleted ${logsResult.deletedCount} items from the 'logs' collection.`);

    const tracesResult = await db.collection('traces').deleteMany({});
    console.log(`✅ Deleted ${tracesResult.deletedCount} items from the 'traces' collection.`);

    console.log('\n🧹 Database is now completely clean. Ready for REAL production testing!');
  } catch (error) {
    console.error('❌ Error wiping data:', error);
  } finally {
    process.exit(0);
  }
}

wipe();
