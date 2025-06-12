import axios from 'axios';
import CircuitBreaker from './circuitBreaker.js';
import { config } from '../config/index.js';

class HttpClient {
    constructor() {
        this.circuitBreakers = new Map();
        this.initCircuitBreakers();
    }

    initCircuitBreakers() {
        Object.values(config.services).forEach(service => {
            this.circuitBreakers.set(service.name, new CircuitBreaker(service.name));
        });
    }

    async request(serviceName, method, path, data = null, options = {}) {
        const service = config.services[serviceName];
        if (!service) {
            throw new Error(`Service ${serviceName} not configured`);
        }

        const circuitBreaker = this.circuitBreakers.get(serviceName);
        
        return circuitBreaker.execute(async () => {
            const fullUrl = `${service.url}${path}`;
            console.log(`Making ${method.toUpperCase()} request to: ${fullUrl}`);
            
            const axiosOptions = {
                method,
                url: fullUrl,
                timeout: service.timeout,
                ...options
            };

            if (data) {
                axiosOptions.data = data;
                console.log(`Request data:`, JSON.stringify(data, null, 2));
            }

            // Log headers if present
            if (axiosOptions.headers) {
                console.log(`Request headers:`, axiosOptions.headers);
            }

            let lastError;
            for (let attempt = 1; attempt <= service.retries; attempt++) {
                try {
                    const response = await axios(axiosOptions);
                    console.log(`Request successful: ${response.status}`);
                    return response;
                } catch (error) {
                    console.log(`Request failed (attempt ${attempt}): ${error.message}`);
                    if (error.response) {
                        console.log(`Response status: ${error.response.status}`);
                        console.log(`Response data:`, error.response.data);
                    }
                    lastError = error;
                    if (attempt < service.retries && this.isRetryableError(error)) {
                        await this.delay(Math.pow(2, attempt - 1) * 1000);
                        continue;
                    }
                    break;
                }
            }
            throw lastError;
        });
    }

    isRetryableError(error) {
        return error.code === 'ECONNRESET' || 
               error.code === 'ECONNREFUSED' || 
               error.code === 'ENOTFOUND' ||
               (error.response && error.response.status >= 500);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async get(serviceName, path, options = {}) {
        return this.request(serviceName, 'get', path, null, options);
    }

    async post(serviceName, path, data, options = {}) {
        return this.request(serviceName, 'post', path, data, options);
    }

    async delete(serviceName, path, options = {}) {
        return this.request(serviceName, 'delete', path, null, options);
    }

    // Helper method to get authorization header from request
    getAuthHeaders(req) {
        const authHeader = req.headers.authorization;
        return authHeader ? { Authorization: authHeader } : {};
    }

    getCircuitBreakerStatus() {
        const status = {};
        this.circuitBreakers.forEach((breaker, name) => {
            status[name] = breaker.getState();
        });
        return status;
    }
}

export const httpClient = new HttpClient();
