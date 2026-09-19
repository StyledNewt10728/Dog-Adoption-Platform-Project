require('dotenv').config();

const express = require('express');
const cors = require('cors');

const {connectDB} = require('./db');
const authRoutes = require('./routes/authRoutes');
const dogRoutes = require('./routes/dogRoutes');
const {apilimiter} = require('./middleware/rate_limiting');
const {notFound, errorHandler} = require('./middleware/error_handler')

function createApp() {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(apilimiter);

    app.get('/health', (req, res) => res.status(200).json({status: 'ok'}));
    app.use('/api/auth', authRoutes);
    app.use('/api/dogs', dogRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

async function start() {
    await connectDB();
    const app = createApp();
    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`Dog Adoption Platform listentin on port ${port}`));
}

if (require.main === module) {
    start().catch((err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
}

module.exports = {createApp};
