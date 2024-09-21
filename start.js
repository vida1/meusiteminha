const { spawn } = require('child_process');

// Função para iniciar um processo
function startProcess(command, args, name) {
    const process = spawn(command, args, { stdio: 'inherit' });

    // Escuta eventos de erro
    process.on('error', (err) => {
        console.error(`Erro ao iniciar ${name}: ${err}`);
    });

    // Escuta eventos de saída
    process.on('exit', (code) => {
        console.log(`${name} encerrado com o código ${code}`);
        // Reinicia o processo se ele falhar
        if (code !== 0) {
            console.log(`Reiniciando ${name}...`);
            startProcess(command, args, name);
        }
    });

    return process;
}

// Inicia o servidor Express
const app = startProcess('node', ['app.js'], 'Servidor Express');

// Inicia o bot do Discord
const bot = startProcess('node', ['./discord-bot/index.js'], 'Bot do Discord');