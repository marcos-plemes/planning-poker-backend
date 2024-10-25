const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

let jogadoresConectados = [];

let jogadoresComCartas = [];


app.get('/', (req, res) => {
    res.send('Ola, Mundo')
})

io.on('connection', socket => {
    console.log(`Usuário conectado: ${socket.id}`);
    socket.emit("jogadoresConectados", jogadoresComCartas ? jogadoresComCartas : jogadoresConectados);

    socket.on('nomeDoJogador', nome => {
        const jogador = {id: socket.id, nome: nome};
        jogadoresConectados.push(jogador)
        io.emit('jogadorConectado', jogador)
    })

    socket.on('tituloDaCarta', tituloDaCarta => {
        const jogadorIndex = jogadoresConectados.findIndex(jogador => jogador.id === socket.id);
        if (jogadorIndex !== -1) {
            if(tituloDaCarta) {
                jogadoresConectados[jogadorIndex].isCartaSelecionada = true;

            } else {
                jogadoresConectados[jogadorIndex].isCartaSelecionada = false;
            }
            
            jogador = JSON.parse(JSON.stringify(jogadoresConectados[jogadorIndex]));
            jogador.tituloDaCarta = tituloDaCarta;

            jogadoresComCartas = jogadoresComCartas.filter(jogador => jogador.id !== socket.id);
            jogadoresComCartas.push(jogador)
            console.log(jogadoresConectados)
            io.emit('jogadorEscolheuUmaCarta', jogador)
        }

    })

    socket.on('revelar-cartas', () => {
        io.emit('cartas-escolhidas', jogadoresComCartas)
    })

    socket.on('reiniciar-jogo', () => {
        jogadoresComCartas = [];
        io.emit('reiniciar-jogo', {})
    })

    socket.on('disconnect', () => {
        const jogadorDesconectado = jogadoresConectados.find(jogador => jogador.id === socket.id);

        if (jogadorDesconectado) {
            console.log(`Jogador desconectado: ${jogadorDesconectado.nome} (${socket.id})`);
            jogadoresConectados = jogadoresConectados.filter(jogador => jogador.id !== socket.id);
            io.emit('jogadorDesconectado', { id: jogadorDesconectado.id, nome: jogadorDesconectado.nome });
        }
    });

})

server.listen(process.env.PORT || 3000)


