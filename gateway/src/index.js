import express from 'express';
import axios from 'axios';

const app  = express();
const port = 8080;

const services = [
    { name: 'user',       url: process.env.USER_SVC_URL },
    { name: 'shortener',  url: process.env.SHORTENER_SVC_URL },
    { name: 'qr',         url: process.env.QR_SVC_URL }
];

app.get('/', async (_, res) => {
    res.json({ name: 'gateway', status: 'online' });
});


// health fan-out → gather → respond
app.get('/health', async (_, res) => {
    const results = await Promise.allSettled(
        services.map(async svc => {
            try {
                const response = await axios.get(svc.url);
                return response.data;
            } catch (error) {
                throw new Error(`Failed to fetch ${svc.name}`);
            }
        })
    );

    res.json(
        results.map((r, i) =>
            r.status === 'fulfilled'
                ? r.value
                : { name: services[i].name, status: 'offline' }
        )
    );
});

// This route is duplicated in the original code, I'm keeping just one
app.listen(port, () => console.log(`Gateway listening on :${port}`));
