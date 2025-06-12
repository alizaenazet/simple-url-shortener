const express = require('express');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();
app.use(express.json());

app.use('/service/users', userRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`User Account Service running on port ${PORT}`);
});