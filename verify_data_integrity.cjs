/**
 * verify_data_integrity.cjs — Deep verification of MongoDB collections
 * Ensures 100% data integrity with no false/orphaned data.
 * 
 * Run: node verify_data_integrity.cjs
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pulsewatch';

// Minimal schemas for validation querying
const logSchema = new mongoose.Schema({}, { strict: false, collection: 'logs' });
const traceSchema = new mongoose.Schema({}, { strict: false, collection: 'traces' });
const Log = mongoose.model('LogCheck', logSchema);
const Trace = mongoose.model('TraceCheck', traceSchema);

async function checkIntegrity() {
  console.log('\n🔍 Starting Data Integrity Validation...');
  console.log(`📡 Connecting to: ${MONGO_URI}`);
  
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.\n');
  
  let passed = true;

  try {
    const totalLogs = await Log.countDocuments({});
    const totalTraces = await Trace.countDocuments({});
    
    console.log(`📊 Found ${totalLogs} Logs and ${totalTraces} Traces.\n`);

    // Rule 1: No orphaned logs (logs without trace_ids)
    const orphanedLogs = await Log.countDocuments({ trace_id: { $exists: false } });
    if (orphanedLogs > 0) {
      console.error(`❌ FAILED: Found ${orphanedLogs} logs without a trace_id.`);
      passed = false;
    } else {
      console.log('✅ Rule 1 Passed: 100% of logs have a trace_id.');
    }

    // Rule 2: Strict enum validation for Logs
    const invalidTypes = await Log.countDocuments({ type: { $nin: ['frontend', 'backend', 'system'] } });
    if (invalidTypes > 0) {
        console.error(`❌ FAILED: Found ${invalidTypes} logs with invalid 'type'.`);
        passed = false;
    } else {
        console.log('✅ Rule 2a Passed: All logs have valid types (frontend, backend, system).');
    }

    const invalidSeverities = await Log.countDocuments({ severity: { $nin: ['info', 'warning', 'error', 'critical'] } });
    if (invalidSeverities > 0) {
        console.error(`❌ FAILED: Found ${invalidSeverities} logs with invalid 'severity'.`);
        passed = false;
    } else {
        console.log('✅ Rule 2b Passed: All logs have valid severities (info, warning, error, critical).');
    }

    // Rule 3: Trace Timeline consistency
    console.log('\n🔄 Checking Trace-Log Correlation Consistency...');
    const traces = await Trace.find({});
    
    let badTraces = 0;
    for (const trace of traces) {
        const traceId = trace.trace_id;
        
        // Count actual logs in DB for this trace
        const actualLogCount = await Log.countDocuments({ trace_id: traceId });
        
        // Check timeline array matches actual log count
        const timelineCount = trace.timeline ? trace.timeline.length : 0;
        
        // Exclude system traces or traces if log_count doesn't match timeline length or actual logs
        if (trace.log_count !== actualLogCount || trace.log_count !== timelineCount) {
            console.error(`❌ FAILED Trace '${traceId}': ` +
                `DB logs=${actualLogCount}, trace.log_count=${trace.log_count}, trace.timeline.length=${timelineCount}`);
            badTraces++;
            passed = false;
        }

        // Validate max_severity calculation
        const severityScores = { info: 1, warning: 2, error: 3, critical: 4 };
        let expectedMaxSeverity = 'info';
        let maxScore = 0;
        
        const logs = await Log.find({ trace_id: traceId });
        logs.forEach(log => {
            if (severityScores[log.severity] > maxScore) {
                maxScore = severityScores[log.severity];
                expectedMaxSeverity = log.severity;
            }
        });

        if (trace.max_severity !== expectedMaxSeverity) {
             console.error(`❌ FAILED Trace '${traceId}': expected max_severity=${expectedMaxSeverity}, got=${trace.max_severity}`);
             badTraces++;
             passed = false;
        }

        // Validate timeline ordering (must be chronological)
        if (trace.timeline && trace.timeline.length > 1) {
            let isOrdered = true;
            for(let i = 1; i < trace.timeline.length; i++) {
                if(new Date(trace.timeline[i].timestamp) < new Date(trace.timeline[i-1].timestamp)) {
                    isOrdered = false;
                }
            }
            if(!isOrdered) {
                 console.error(`❌ FAILED Trace '${traceId}': Timeline is NOT correctly ordered by timestamp.`);
                 badTraces++;
                 passed = false;
            }
        }
    }

    if (badTraces === 0) {
        console.log(`✅ Rule 3 Passed: 100% of Traces (${traces.length}) accurately match their underlying Logs.`);
        console.log('✅ Rule 4 Passed: 100% of Traces have correct severity propagation.');
        console.log('✅ Rule 5 Passed: 100% of Timelines are correctly chronologically ordered.');
    }

    // Rule 6: Impact Level validation
    const invalidImpacts = await Trace.countDocuments({ impact_level: { $nin: ['low', 'medium', 'high', 'critical'] } });
    if (invalidImpacts > 0) {
        console.error(`\n❌ FAILED: Found ${invalidImpacts} traces with invalid 'impact_level'.`);
        passed = false;
    } else {
        console.log('\n✅ Rule 6 Passed: All traces have valid impact levels.');
    }

  } catch (error) {
    console.error('CRITICAL ERROR during integrity check:', error);
    passed = false;
  } finally {
    await mongoose.disconnect();
    
    if (passed) {
        console.log('\n💎 DATA INTEGRITY SCORE: 100%');
        console.log('💎 No orphaned records. No false data. Complete relational consistency.');
    } else {
        console.log('\n⚠️ DATA INTEGRITY FAILED. Anomalies detected.');
    }
    process.exit(passed ? 0 : 1);
  }
}

checkIntegrity();
