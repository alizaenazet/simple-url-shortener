import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    host: true, 
    port: 5173 
  },
  define: {
    // Define the gateway URL for different environments
    'import.meta.env.VITE_GATEWAY_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? 'http://localhost:8080' // or your production gateway URL
        : 'http://localhost:8080'
    )
  }
});
