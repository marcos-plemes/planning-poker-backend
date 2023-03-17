const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: true,
        credentials: true
    }
});


app.get('/', (req, res) => {
    res.send('hola mundo')
})

io.on('connection', socket => {
    console.log(socket.id)

    socket.emit("teste", "Teste enviado pelo servidor!");

})

server.listen(process.env.PORT || 3000)


