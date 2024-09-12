const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

async function giveawayRun(interaction, options) {
  const giveawayImage = options.getAttachment('image');
  const giveawayTitle = options.getString('prize');
  const giveawayDescription = options.getString('description') || 'Nenhuma descrição foi fornecida ( ͡° ͜ʖ ͡°)';
  const giveawayDuration = options.getString('duration');
  const giveawayHost = options.getUser('host') || interaction.user;
  const specialRole = options.getRole('special_role');
  const specialRoleEntries = options.getInteger('entries');

  const currentTime = Math.floor(Date.now() / 1000);

  // Checando a duração
  let durationInSeconds = 0;
  const durationValue = parseInt(giveawayDuration.slice(0, -1));
  const durationUnit = giveawayDuration.slice(-1); // Pegar a última letra da duração

  // Checar se termina em m, d ou h
  if (durationUnit === 'm') {
    durationInSeconds = durationValue * 60; // Converter os segundos pra minutos
  } else if (durationUnit === 'h') {
    durationInSeconds = durationValue * 60 * 60; // Converter os segundos pra horas
  } else if (durationUnit === 'd') {
    durationInSeconds = durationValue * 24 * 60 * 60; // Converter os segundos pra dias
  } else {
    durationInSeconds = durationValue * 60; // Se não colocar m, d nem h vai settar como padrão minutos
  }

  const endTime = currentTime + durationInSeconds; // Definir quando o sorteio acaba

  const imageUrl = giveawayImage ? giveawayImage.url : null; // Pegar o url do anexo

  let embed = new EmbedBuilder({
    "title": `**${giveawayTitle}**`,
    "description": `${giveawayDescription}\n\nAcaba <t:${endTime}:R>.\n\nHost: ${giveawayHost}`,
    "color": 0x9ab8d1,
    "footer": {
      "text": `Participe clicando no botão abaixo.`,
    }
  }); // Criar o embed

  if (imageUrl) {
    embed.setImage(imageUrl);
  } // Só colocar a imagem se o usuário colocar uma imagem

  // Criar os botões
  const joinButton = new ButtonBuilder()
    .setCustomId('joinGiveaway')
    .setLabel('🎉 Entrar 🎊')
    .setStyle(ButtonStyle.Success); // Botão verde

  const participantsButton = new ButtonBuilder()
    .setCustomId('participants')
    .setLabel('🧑 Participantes')
    .setStyle(ButtonStyle.Secondary); // Botão cinza

  const row = new ActionRowBuilder().addComponents(joinButton, participantsButton);

  const message = await interaction.reply({ embeds: [embed], components: [row] }); // Enviar o embed com os botões

  // Carregar o JSON
  let participantsData = {};
  const filePath = './giveaway_participants.json';
  if (fs.existsSync(filePath)) {
    participantsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  // Listener para o botão
  const filter = (i) => i.customId === 'joinGiveaway' || i.customId === 'participants';
  const collector = message.createMessageComponentCollector({ filter, time: durationInSeconds * 1000 });

  collector.on('collect', async (i) => {
    const participant = i.user;
    const giveawayId = message.id;

    if (i.customId === 'joinGiveaway') {
      // Criar entrada para o sorteio, se ainda não existir
      if (!participantsData[giveawayId]) {
        participantsData[giveawayId] = {
          title: giveawayTitle,
          participants: []
        };
      }

      // Verificar se o participante já tá no sorteio
      if (!participantsData[giveawayId].participants.includes(participant.id)) {
        participantsData[giveawayId].participants.push(participant.id); // Adicionar o participante
        fs.writeFileSync(filePath, JSON.stringify(participantsData, null, 2)); // Salvar o JSON

        await i.reply({ content: 'Você entrou no sorteio com sucesso!', ephemeral: true }); // Responder ao usuário
      } else {
        participantsData[giveawayId].participants = participantsData[giveawayId].participants.filter(id => id !== participant.id); // Remover o participante
        fs.writeFileSync(filePath, JSON.stringify(participantsData, null, 2)); // Salvar o JSON

        await i.reply({ content: 'Você saiu do sorteio!', ephemeral: true });
      }
    } else if (i.customId === 'participants') {
      const isGiveawayEnded = currentTime >= endTime;
      const participants = participantsData[giveawayId]?.participants || [];

      const participantsList = participants.map(id => `<@${id}>`).join('\n') || 'Nenhum participante ainda.';

      const messageContent = isGiveawayEnded
        ? `Este sorteio acabou, mas pouco antes dele acabar, os participantes eram:\n${participantsList}`
        : `Os participantes do sorteio são:\n${participantsList}`;

      await i.reply({ content: messageContent, ephemeral: true }); // Responder ao usuário
    }
  });

  collector.on('end', async () => {
    // Notificar que o sorteio terminou
    const giveawayId = message.id;
    const participants = participantsData[giveawayId]?.participants || [];
    const winner = participants[Math.floor(Math.random() * participants.length)];

    await interaction.followUp({ content: `O sorteio terminou! O vencedor foi ${winner ? `<@${winner}>` : 'ninguém!'} - ${giveawayTitle}`, ephemeral: false });
  });
}

module.exports = { giveawayRun }; // Exportar a função pro bot.js usá-la