const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

async function giveawayRun(interaction, options) {
  const giveawayImage = options.getAttachment('image');
  const giveawayTitle = options.getString('prize');
  const giveawayDescription = options.getString('description') || 'Nenhuma descrição foi fornecida ( ͡° ͜ʖ ͡°)';
  const giveawayDuration = options.getString('duration');
  const giveawayHost = options.getUser('host') || interaction.user;

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

  // Criar o botão pra entrar no sorteio
  const button = new ButtonBuilder()
    .setCustomId('joinGiveaway')
    .setLabel('🎉 Entrar 🎊')
    .setStyle(ButtonStyle.Success); // Botão verde

  const row = new ActionRowBuilder().addComponents(button);

  const message = await interaction.reply({ embeds: [embed], components: [row] }); // Enviar o embed com o botão

  // Listener para o botão
  const filter = (i) => i.customId === 'joinGiveaway';
  const collector = message.createMessageComponentCollector({ filter, time: durationInSeconds * 1000 });

  collector.on('collect', async (i) => {
    const participant = i.user;
    const giveawayId = message.id;

    // Carregar o JSON
    let participantsData = {};
    const filePath = './giveaway_participants.json';
    if (fs.existsSync(filePath)) {
      participantsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    // Criar entrada para o sorteio, se ainda não existir
    if (!participantsData[giveawayId]) {
      participantsData[giveawayId] = {
        title: giveawayTitle,
        participants: []
      };
    }

    const participantIndex = participantsData[giveawayId].participants.indexOf(participant.id);

    // Verificar se o participante já tá no sorteio
    if (participantIndex === -1) {
      participantsData[giveawayId].participants.push(participant.id); // Adicionar o participante
      await i.reply({ content: 'Você entrou no sorteio com sucesso!', ephemeral: true }); // Responder ao usuário
    } else {
      participantsData[giveawayId].participants.splice(participantIndex, 1); // Remover o participante
      await i.reply({ content: 'Você saiu do sorteio!', ephemeral: true });
    }

    // Salvar o JSON
    fs.writeFileSync(filePath, JSON.stringify(participantsData, null, 2)); // Salvar o JSON
  });

  // Sortear o vencedor quando o sorteio terminar
  collector.on('end', async () => {
    const filePath = './giveaway_participants.json';
    if (fs.existsSync(filePath)) {
      const participantsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Verificar se existem participantes
      const participants = participantsData[giveawayId]?.participants || [];
      if (participants.length > 0) {
        const winnerId = participants[Math.floor(Math.random() * participants.length)]; // Escolher um vencedor
        const winner = await interaction.client.users.fetch(winnerId); // Buscar o usuário pelo ID

        // Anunciar o vencedor publicamente
        await interaction.channel.send(`🎉 O sorteio **${giveawayTitle}** acabou! O vencedor é ${winner}. Parabéns! 🎉`);
      } else {
        await interaction.channel.send(`O sorteio **${giveawayTitle}** acabou, mas ninguém participou.`);
      }
    }
  });
}

module.exports = { giveawayRun }; // Exportar a função pro bot.js usá-la