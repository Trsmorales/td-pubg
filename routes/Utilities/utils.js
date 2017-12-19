
module.exports = {

    isEmpty: function (obj){
        return JSON.stringify(obj) === JSON.stringify({})
    },

    normalizePort: function (val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }
        return false;
    },

    checkAuth: function(req, res, next) {
        console.log('checkAuth for ' + req.url);
        
        // don't serve /secure to those not logged in
        // you should add to this list, for each and every secure url
        if (!req.session || !req.session.authenticated) {
        console.log('unauthorized');
            res.status(403).send('unauthorized');
            return;
        }
    
        next();
    },

    onError: function (error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof port === 'string'
            ? 'Pipe ' + port
            : 'Port ' + port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
            case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
            default:
            throw error;
        }
    }   
};
