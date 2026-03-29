const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monitring';

// Minimal Schema to avoid import issues
const monitorSchema = new mongoose.Schema({ name: String });
const Monitor = mongoose.models.Monitor || mongoose.model('Monitor', monitorSchema);

async function findID() {
    try {
        console.log('Connecting to: ' + MONGODB_URI.substring(0, 20) + '...');
        await mongoose.connect(MONGODB_URI);
        
        const m = await Monitor.findOne({ name: /NIRMAAN/i });
        if (m) {
            console.log('------------------------------------------------');
            console.log('SUCCESS! NIRMAAN ID IS: ' + m._id);
            console.log('------------------------------------------------');
        } else {
            console.log('Monitor not found. Listing all monitors:');
            const all = await Monitor.find({});
            all.forEach(x => console.log(`- ${x.name}: ${x._id}`));
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Connection failed: ' + err.message);
        process.exit(1);
    }
}

findID();
