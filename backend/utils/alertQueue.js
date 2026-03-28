/**
 * 🛰️ PulseWatch Internal Alert Queue (Sentinel Queue)
 * Simulates Redis/Bull background processing to ensure zero-latency monitoring loop.
 */

class AlertQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.maxRetries = 3;
    }

    /**
     * Push an alert task to the background queue
     */
    async push(task) {
        console.log(`[QUEUE] 📥 Staging alert for: ${task.monitor.name} [Type: ${task.incidentData.status || 'Info'}]`);
        this.queue.push({
            ...task,
            id: Date.now() + Math.random(),
            retries: 0,
            timestamp: new Date()
        });

        if (!this.isProcessing) {
            this.process();
        }
    }

    /**
     * Background worker loop
     */
    async process() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const task = this.queue.shift();

        try {
            // Lazy load the dispatcher to avoid circular dependencies
            const { processDispatch } = await import('../alertService.js');
            
            console.log(`[WORKER] 🚀 Processing alert: ${task.monitor.name}`);
            await processDispatch(task.monitor, task.incidentData);
            
            // Artificial delay to simulate real-world queuing (and prevent channel spam)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
        } catch (err) {
            console.error(`[WORKER ERROR] ❌ Task failed:`, err.message);
            
            if (task.retries < this.maxRetries) {
                task.retries++;
                console.log(`[WORKER] 🔄 Retrying task (${task.retries}/${this.maxRetries}) in 5s...`);
                setTimeout(() => this.queue.push(task), 5000);
            }
        }

        // Keep pumping the queue
        setImmediate(() => this.process());
    }

    getQueueSize() {
        return this.queue.length;
    }

    clearQueue() {
        this.queue = [];
    }
}

// Singleton instance
const sentinelQueue = new AlertQueue();
export default sentinelQueue;
