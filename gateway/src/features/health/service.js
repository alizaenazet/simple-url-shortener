import { config } from '../../config/index.js';
import { httpClient } from '../../services/httpClient.js';

class HealthService {
    async checkAllServices() {
        const services = Object.values(config.services);
        
        const results = await Promise.allSettled(
            services.map(async svc => {
                try {
                    // Use the root health endpoint for each service
                    const response = await httpClient.get(svc.name, 'health');
                    return { 
                        name: svc.name, 
                        status: 'online', 
                        data: response.data,
                        lastChecked: new Date().toISOString()
                    };
                } catch (error) {
                    return { 
                        name: svc.name, 
                        status: 'offline', 
                        error: error.message,
                        lastChecked: new Date().toISOString()
                    };
                }
            })
        );

        return results.map((r, i) =>
            r.status === 'fulfilled'
                ? r.value
                : { 
                    name: services[i].name, 
                    status: 'offline', 
                    error: r.reason?.message || 'Unknown error',
                    lastChecked: new Date().toISOString()
                }
        );
    }
}

export const healthService = new HealthService();
