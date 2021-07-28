const express = require('express');
const connectDB = require('./config/db.js');

const app = express();
//Initialize DB Connection
connectDB();
//Initialize middleware
app.use(express.json());

app.get('/', (_req, res) => res.send('API Running'));

//Define routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/users', require('./routes/api/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
