import { config } from '../config/index.js';

class CircuitBreaker {
    constructor(name, options = {}) {
        this.name = name;
        this.failureCount = 0;
        this.successCount = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
        this.failureThreshold = options.failureThreshold || config.circuitBreaker.failureThreshold;
        this.successThreshold = options.successThreshold || config.circuitBreaker.successThreshold;
        this.timeout = options.timeout || config.circuitBreaker.timeout;
    }

    async execute(operation) {
        if (this.state === 'OPEN') {
            if (this.nextAttempt > Date.now()) {
                throw new Error(`Circuit breaker is OPEN for ${this.name}. Service temporarily unavailable.`);
            }
            this.state = 'HALF_OPEN';
            this.successCount = 0;
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= this.successThreshold) {
                this.state = 'CLOSED';
                console.log(`Circuit breaker ${this.name} transitioned to CLOSED`);
            }
        }
    }

    onFailure() {
        this.failureCount++;
        
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
            console.log(`Circuit breaker ${this.name} transitioned to OPEN`);
        }
    }

    getState() {
        return {
            name: this.name,
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            nextAttempt: this.nextAttempt
        };
    }
}

export default CircuitBreaker;
