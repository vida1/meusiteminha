const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dblogin'
});

// Exponha a função de consulta
function query(sql, params) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });
}

// Função para registrar um usuário
async function registerUser(userData) {
    const { username, nome, sobrenome, password, discordId } = userData;

    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO users (username, nome, sobrenome, password, discord_id, nivel_permissao) VALUES (?, ?, ?, ?, ?, ?)', 
        [username, nome, sobrenome, password, discordId, 1], (error, results) => {
            if (error) return reject(error);
            resolve(results.insertId);
        });
    });
}

// Função para verificar se o usuário existe
async function userExists(discordId) {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM users WHERE discord_id = ?', [discordId], (error, results) => {
            if (error) return reject(error);
            resolve(results.length > 0);
        });
    });
}

// Função para atualizar o ID do canal
async function updateChannelId(discordId, channelId) {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE users SET channel_id = ? WHERE discord_id = ?', [channelId, discordId], (error, results) => {
            if (error) return reject(error);
            resolve(results.affectedRows);
        });
    });
}

// Nova função para contar o número de usuários
async function countUsers() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT COUNT(*) AS total FROM users', (error, results) => {
            if (error) return reject(error);
            resolve(results[0].total);
        });
    });
}

// Nova função para registrar uma loja
async function registerStore(storeData) {
    const { description, latitude, longitude } = storeData;

    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO lojas (description, latitude, longitude) VALUES (?, ?, ?)', 
        [description, latitude, longitude], (error, results) => {
            if (error) return reject(error);
            resolve(results.insertId);
        });
    });
}

// Função para atualizar o pixe (opcional, se você quiser encapsular a lógica)
async function updatePixe(nome, pixe) {
    return query('UPDATE sprays SET pixe = ? WHERE nome = ?', [pixe, nome]);
}

// Função para atualizar o tempo restante
async function updateTempoRestante(nome, tempo) {
    return query('UPDATE sprays SET tempo_restante = ? WHERE nome = ?', [tempo, nome]);
}

module.exports = {
    registerUser,
    userExists,
    query,
    updateChannelId,
    countUsers,
    registerStore,
    updatePixe, // Exponha a função se necessário
    updateTempoRestante
};