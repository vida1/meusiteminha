const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Para analisar JSON no corpo da requisição
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (user.length > 0) {
            req.session.user = user[0];
            res.redirect('/dashboard');
        } else {
            res.send('Invalid username or password');
        }
    } catch (error) {
        console.error(error);
        res.send('An error occurred');
    }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const totalUsers = await db.countUsers();
        res.render('dashboard', { user: req.session.user, totalUsers });
    } catch (error) {
        console.error(error);
        res.send('An error occurred');
    }
});

app.get('/map', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redireciona se o usuário não estiver autenticado
    }
    res.render('map'); // Renderiza o mapa se o usuário estiver autenticado
});

// Rota para registrar uma nova loja
app.post('/register-store', async (req, res) => {
    const { nome, description, latitude, longitude } = req.body;
    try {
        await db.registerStore({ nome, description, latitude, longitude });
        res.redirect('/map'); // Redireciona para o mapa após registrar a loja
    } catch (error) {
        console.error(error);
        res.send('An error occurred while registering the store');
    }
});

app.post('/update-user', async (req, res) => {
    const { username, nome, sobrenome } = req.body;
    try {
        await db.query('UPDATE users SET nome = ?, sobrenome = ? WHERE username = ?', [nome, sobrenome, username]);
        req.session.user.nome = nome;
        req.session.user.sobrenome = sobrenome;
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.send('An error occurred');
    }
});

app.get('/locations', async (req, res) => {
    try {
        const sprays = await db.query('SELECT latitude, longitude, description, nome, pixe FROM sprays');
        const lojas = await db.query('SELECT latitude, longitude, description, nome FROM lojas');

        const locations = [
            ...sprays.map(spray => ({
                coords: [spray.latitude, spray.longitude],
                nome: spray.nome,
                description: spray.description,
                pixe: spray.pixe // Mantém o valor original de pixe para sprays
            })),
            ...lojas.map(loja => ({
                coords: [loja.latitude, loja.longitude],
                nome: loja.nome,
                description: loja.description,
                pixe: null // Define pixe como null para lojas
            }))
        ];

        res.json(locations); // Retorna as localizações como JSON
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Rota para atualizar o pixe e iniciar o timer
app.post('/updatePixe', async (req, res) => {
    const { nome, pixe, tempo } = req.body; // Adicione o tempo aqui
    try {
        await db.updatePixe(nome, pixe); // Atualiza o pixe
        await db.updateTempoRestante(nome, tempo); // Atualiza o tempo restante
        res.status(200).send('Pixe e timer atualizados com sucesso');
    } catch (error) {
        console.error('Erro ao atualizar pixe e timer:', error);
        res.status(500).send('Erro ao atualizar pixe e timer');
    }
});

setInterval(async () => {
    try {
        const sprays = await db.query('SELECT * FROM sprays WHERE tempo_restante >= 0'); // Inclui sprays com tempo 0
        for (const spray of sprays) {
            if (spray.tempo_restante > 0) {
                // Decrementa o tempo restante
                await db.query('UPDATE sprays SET tempo_restante = tempo_restante - 1 WHERE nome = ?', [spray.nome]);
            } 
            // Verifica se o tempo chegou a zero
            if (spray.tempo_restante === 0) {
                // Muda pixe para 0
                await db.query('UPDATE sprays SET pixe = 0 WHERE nome = ?', [spray.nome]);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar timers:', error);
    }
}, 1000); // Verifica a cada segundo

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
