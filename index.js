const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios'); // Importando o axios
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

app.use(cors())

let jogadoresConectados = [];

let jogadoresComCartas = [];

let jogoIniciado = true;


app.get('/buscar-nome-do-usuario', async (req, res) => {
    const authHeader = req.headers.authorization;    

    try {
        const response = await axios.get('https://redmine.cloudmega.com.br/users/current.json', {
            headers: {
                Authorization: authHeader
            }
        })
        res.json(response.data.user.firstname);
    } catch(error) {
        res.status(500).send("erro")
    }
})

io.on('connection', socket => {
    console.log(`Usuário conectado: ${socket.id}`);
    if(jogoIniciado) {
        socket.emit("jogadoresConectados", jogadoresConectados);    
    } else {
        let jogadores = []
        for(let i = 0; i<jogadoresConectados.length; i++) {
            const jogadorComCarta = jogadoresComCartas.find(jogador => jogador.id === jogadoresConectados[i].id);
            jogadores.push(jogadorComCarta ? jogadorComCarta : jogadoresConectados[i])
        }
        socket.emit("jogadoresConectados", jogadores);    
    }
    socket.emit('jogoIniciado', jogoIniciado);
    

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
        jogoIniciado = false;
    })

    socket.on('reiniciar-jogo', () => {
        jogoIniciado = true;
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


