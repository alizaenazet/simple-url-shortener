import { config } from '../../config/index.js';
import { httpClient } from '../../services/httpClient.js';

class HealthService {
    async checkAllServices() {
        const services = Object.values(config.services);
        
        const results = await Promise.allSettled(
            services.map(async svc => {
                try {
                    const response = await httpClient.get(svc.name, '');
                    return response.data;
                } catch (error) {
                    return { name: svc.name, status: 'offline', error: error.message };
                }
            })
        );

        return results.map((r, i) =>
            r.status === 'fulfilled'
                ? r.value
                : { name: services[i].name, status: 'offline', error: r.reason?.message }
        );
    }
}

export const healthService = new HealthService();
