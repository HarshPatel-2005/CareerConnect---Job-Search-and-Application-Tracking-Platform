const fs = require('fs');
const path = require('path');


function create404Middleware(options = {}) {
    const templatePath = options.templatePath || path.join(__dirname, '../../public/404.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    return function notFoundMiddleware(req, res) {
        const requestedPath = req.originalUrl;
        res.status(404);
        res.vary('Accept');

        switch (req.accepts(['html', 'json', 'text'])) {
            case 'html':
                return res.type('html').send(template);

            case 'json':
                return res.json({ 
                    error: 'Not found', 
                    status: 404,
                    message: `The requested path '${requestedPath}' could not be found.`,
                    path: requestedPath,
                });

            case 'text':
                return res.type('text').send(
                    `404 Not Found: ${requestedPath}`
                );
            default:
                return res.end();
        }
    }
}

module.exports = {
    create404Middleware
};