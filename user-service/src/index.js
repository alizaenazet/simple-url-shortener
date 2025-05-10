import express from 'express';
const app  = express();
const port = process.env.PORT || 3001;
const NAME = process.env.SVC_NAME || 'user-service';

app.get('/', (_req, res) => res.json({ name: NAME, status: 'online' }));
app.listen(port, () => console.log(`${NAME} on :${port}`));
