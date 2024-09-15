const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

async function giveawayRun(interaction, options) {
  const giveawayImage = options.getAttachment('image');
  const giveawayTitle = options.getString('prize');
  const giveawayDescription = options.getString('description') || '( ͡° ͜ʖ ͡°) Nenhuma descrição foi fornecida ( ͡° ͜ʖ ͡°)';
  const giveawayDuration = options.getString('duration');
  const giveawayHost = options.getUser('host') || interaction.user;
  const specialRole = options.getRole('special_role');
  const specialRoleEntries = options.getInteger('entries');

  const currentTime = Math.floor(Date.now() / 1000);
  const filePath = './data/giveaway_participants.json';

  if (specialRole && !specialRoleEntries) {
    await interaction.reply({ content: 'Você colocou o cargo especial, mas não especificou a quantidade de entradas. Por favor, especifique a quantidade de entradas.', ephemeral: true});
  }

  // Lidar com o reroll
  if (options.getSubcommand() === 'reroll') {
    const giveawayId = options.getString('giveaway_id');  // Usar giveaway_id em vez de message_id

    // Carregar os dados dos participantes do sorteio
    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: 'Nenhum sorteio encontrado para rerolar.', ephemeral: true });
    }

    const participantsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Obter participantes para o giveaway_id específico
    const participants = participantsData[giveawayId]?.participants || [];

    if (participants.length === 0) {
      return interaction.reply({ content: 'Nenhum participante para rerolar.', ephemeral: true });
    }

    // Escolher um novo vencedor aleatoriamente
    const newWinner = participants[Math.floor(Math.random() * participants.length)];
    return interaction.reply({ content: `🎉 O novo vencedor é <@${newWinner}>! 🎉`, ephemeral: false });
  }

  if (options.getSubcommand() === 'start') {
    // Calcular a duração do sorteio
    let durationInSeconds = 0;
    const durationValue = parseInt(giveawayDuration.slice(0, -1));
    const durationUnit = giveawayDuration.slice(-1);

    if (durationUnit === 'm') {
      durationInSeconds = durationValue * 60; 
    } else if (durationUnit === 'h') {
      durationInSeconds = durationValue * 60 * 60; 
    } else if (durationUnit === 'd') {
      durationInSeconds = durationValue * 24 * 60 * 60; 
    } else {
      durationInSeconds = durationValue * 60;
    }

    const endTime = currentTime + durationInSeconds; 
    const imageUrl = giveawayImage ? giveawayImage.url : null;

    let description = `${giveawayDescription}\n\nAcaba <t:${endTime}:R>.\n\nHost: ${giveawayHost}`;

    if (specialRole && specialRoleEntries) {
      description += `\n\n<@&${specialRole.id}> tem ${specialRoleEntries}X mais chance de ganhar!`;
    }
    
    let embed = new EmbedBuilder({
      "title": `**${giveawayTitle}**`,
      "description": description,
      "color": 0x9ab8d1,
      "footer": {
        "text": `Participe clicando no botão abaixo.`,
      }
    });

    if (imageUrl) {
      embed.setImage(imageUrl);
    }

    const joinButton = new ButtonBuilder()
      .setCustomId('joinGiveaway')
      .setLabel('🎉 Entrar 🎊')
      .setStyle(ButtonStyle.Success);

    const participantsButton = new ButtonBuilder()
      .setCustomId('participants')
      .setLabel('🧑 Participantes')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(joinButton, participantsButton);

    const message = await interaction.reply({ embeds: [embed], components: [row] });

    let participantsData = {};
    if (fs.existsSync(filePath)) {
      participantsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const filter = (i) => i.customId === 'joinGiveaway' || i.customId === 'participants';
    const collector = message.createMessageComponentCollector({ filter, time: durationInSeconds * 1000 });

    collector.on('collect', async (i) => {
      const participant = i.user;
      const giveawayId = message.id;

      if (i.customId === 'joinGiveaway') {
        if (!participantsData[giveawayId]) {
          participantsData[giveawayId] = {
            title: giveawayTitle,
            participants: []
          };
        }

        if (!participantsData[giveawayId].participants.includes(participant.id)) {
          participantsData[giveawayId].participants.push(participant.id); 
          fs.writeFileSync(filePath, JSON.stringify(participantsData, null, 2)); 

          await i.reply({ content: 'Você entrou no sorteio com sucesso!', ephemeral: true });
        } else {
          participantsData[giveawayId].participants = participantsData[giveawayId].participants.filter(id => id !== participant.id);
          fs.writeFileSync(filePath, JSON.stringify(participantsData, null, 2)); 

          await i.reply({ content: 'Você saiu do sorteio!', ephemeral: true });
        }
      } else if (i.customId === 'participants') {
        const isGiveawayEnded = currentTime >= endTime;
        const participants = participantsData[giveawayId]?.participants || [];

        const participantsList = participants.map(id => `<@${id}>`).join('\n') || 'Nenhum participante ainda.';

        const messageContent = isGiveawayEnded
          ? `Este sorteio acabou, mas pouco antes dele acabar, os participantes eram:\n${participantsList}`
          : `Os participantes do sorteio são:\n${participantsList}`;

        await i.reply({ content: messageContent, ephemeral: true });
      }
    });

    collector.on('end', async () => {
      const giveawayId = message.id;
      const participants = participantsData[giveawayId]?.participants || [];
      const winner = participants[Math.floor(Math.random() * participants.length)];

      await interaction.followUp({ content: `O sorteio **${giveawayTitle}** terminou! O vencedor foi ${winner ? `<@${winner}>` : 'ninguém! Não participaram... 😭'}`, ephemeral: false });
    });
  }  
}

module.exports = { giveawayRun };