const app = require('./backend/app');
const http = require('http');

const PORT = process.env.PORT || 3000;

app.set('port', PORT);

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});