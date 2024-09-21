const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
require('dotenv').config();

const categoryID = '1279502523509510247'; // Substitua pelo ID da sua categoria
const categoryIDRegister = '1279512453000069192'; // Substitua pelo ID da sua categoria

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (!message || !message.content || message.author.bot) return; // Verifica se a mensagem e o conteúdo estão definidos
    if (message.content === '!createEmbedRegister') {
        const embed = new EmbedBuilder()
            .setColor(0xa20ab9) // Cor azul, pode ser alterada conforme necessário
            .setTitle('BALLAS - RK STORE')
            .setURL('https://discord.js.org/') // URL ao clicar no título
            .setDescription('Clique no botão para iniciar o Registro!')
            .addFields(
                { name: 'Observações:', value: 'O Registro é único então cuidado!' }
            )
            .setTimestamp()
            .setFooter({ text: 'RK STORE © Todos os direitos reservados', iconURL: 'https://cdn.discordapp.com/attachments/799447356957130814/1278876390179082273/869ccaad-4050-4a8a-a4f4-24e486b6f775.jpg' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('register')
                    .setLabel('REGISTRO')
                    .setStyle(ButtonStyle.Primary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.isButton() || interaction.customId !== 'register') return;

        await interaction.deferReply({ ephemeral: true }); // Garante que a resposta é diferida imediatamente ao iniciar o processamento

        const member = interaction.member;
        const discordId = member.user.id; // Obtém o ID do Discord do usuário
        const username = `${member.user.username}-register`;

        // Verifica se o usuário já está registrado
        const alreadyRegistered = await db.userExists(discordId);
        if (alreadyRegistered) {
            return await interaction.editReply({ content: "Você já foi registrado.", ephemeral: true });
        }

        // Cria um canal temporário para o registro na categoria especificada
        const registerChannel = await interaction.guild.channels.create({
            name: username,
            type: ChannelType.GuildText,
            parent: categoryIDRegister, // Adiciona o canal à categoria especificada
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });

        // Menciona o usuário no canal temporário com um embed
        const registerEmbed = new EmbedBuilder()
            .setColor(0xa20ab9)
            .setDescription(`<@${member.id}> seu canal de registro foi criado.`);

        await registerChannel.send({ embeds: [registerEmbed] });

        // Envia uma mensagem ephemeral no canal original informando que o canal de registro foi criado
        await interaction.editReply({ content: `Seu canal de registro foi criado: ${registerChannel}`, ephemeral: true });

        // Processo de coleta de informações e registro
        try {
            const nomeMessage = await collectUserInfo(member, 'Qual é o seu primeiro nome?', registerChannel);
            if (!nomeMessage) throw new Error('Primeiro nome não fornecido.');

            const nome = nomeMessage.content; // Acessa o conteúdo da mensagem

            const sobrenomeMessage = await collectUserInfo(member, 'Qual é o seu sobrenome?', registerChannel);
            if (!sobrenomeMessage) throw new Error('Sobrenome não fornecido.');

            const sobrenome = sobrenomeMessage.content; // Acessa o conteúdo da mensagem

            const userMessage = await collectUserInfo(member, 'Escolha um nome de usuário:', registerChannel);
            const user = userMessage.content;

            const passwordMessage = await collectUserInfo(member, 'Crie uma senha:', registerChannel);
            const password = passwordMessage.content;

            // Salva os dados no banco de dados
            await db.registerUser({ username: user, nome, sobrenome, password, discordId });

            // Apaga o canal de registro
            await registerChannel.delete();

            // Cria o canal final
            const personalChannel = await interaction.guild.channels.create({
                name: `📂┆${nome}-${sobrenome}`, // Nome do canal formatado
                type: ChannelType.GuildText,
                parent: categoryID, // Usa o ID da categoria diretamente
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel], // Ninguém pode ver o canal
                    },
                    {
                        id: member.id,
                        allow: [PermissionsBitField.Flags.ViewChannel], // Apenas o usuário pode ver
                    },
                ],
            });

            // Salva o ID do canal no banco de dados
            await db.updateChannelId(discordId, personalChannel.id);

            // Altera o apelido do usuário
            await member.setNickname(`${nome} ${sobrenome}`);

            // Menciona o usuário no canal final com um embed
            const finalEmbed = new EmbedBuilder()
                .setColor(0xa20ab9)
                .setDescription(`<@${member.id}> seu canal final foi criado.`);

            await personalChannel.send({ embeds: [finalEmbed] });

            // Responde à interação após o processamento completo
            await interaction.editReply({ content: 'Registro concluído com sucesso!', ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "Ocorreu um erro durante o registro.", ephemeral: true });
        }
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "Ocorreu um erro desconhecido durante o registro.", ephemeral: true });
    }
});

async function collectUserInfo(member, question, registerChannel) {
    const embed = new EmbedBuilder()
        .setColor(0xa20ab9)
        .setDescription(question);

    await registerChannel.send({ embeds: [embed] }); // Envia a pergunta como um embed no canal de registro

    const filter = response => response.author.id === member.id && response.content; // Verifica se a resposta é do usuário e tem conteúdo

    const collected = await registerChannel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
        .catch(async () => {
            await registerChannel.send('Você não respondeu a tempo!');
            await registerChannel.delete(); // Apaga o canal de registro se não houver resposta
            return null; // Retorna null se não houver resposta
        });

    return collected ? collected.first() : null; // Retorna a primeira mensagem ou null
}

client.login(process.env.BOT_TOKEN);