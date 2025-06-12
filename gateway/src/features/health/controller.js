import { healthService } from './service.js';
import { httpClient } from '../../services/httpClient.js';

class HealthController {
    async root(req, res) {
        res.json({ name: 'gateway', status: 'online' });
    }

    async health(req, res) {
        const results = await healthService.checkAllServices();
        res.json(results);
    }

    async status(req, res) {
        const circuitBreakerStatus = httpClient.getCircuitBreakerStatus();
        res.json({
            gateway: { status: 'online' },
            circuitBreakers: circuitBreakerStatus
        });
    }
}

export const healthController = new HealthController();
