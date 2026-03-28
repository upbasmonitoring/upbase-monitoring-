import mongoose from 'mongoose';

async function migrate() {
    try {
        await mongoose.connect('mongodb+srv://upbasmonitoring_db_user:UyJVbYilQfH36rkF@cluster0.rfp7qeo.mongodb.net/test?appName=Cluster0');
        console.log('Connected to DB');
        
        const userId = '69bd8d4b23623b66e9de263e';
        const projectId = '69bdf4e08d2bc0af817f56d5';
        
        const result = await mongoose.connection.collection('monitors').updateMany(
            { 
                project: { $exists: false }, 
                user: new mongoose.Types.ObjectId(userId) 
            }, 
            { 
                $set: { project: new mongoose.Types.ObjectId(projectId) } 
            }
        );
        
        console.log('Migration Complete.');
        console.log('Monitors updated:', result.modifiedCount);
        
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
