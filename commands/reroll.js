const fs = require('fs');

async function rerollGiveaway(interaction, options) {
  const giveawayId = options.getString('giveaway_id');

  const filePath = './data/giveaway_participants.json';

  if (!fs.existsSync(filePath)) {
    return interaction.reply({ content: 'Nenhum sorteio encontrado para rerolar.', ephemeral: true });
  }

  const participantsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const participants = participantsData[giveawayId]?.participants || [];

  if (participants.length === 0) {
    return interaction.reply({ content: 'Nenhum participante para rerolar.', ephemeral: true });
  }

  const newWinner = participants[Math.floor(Math.random() * participants.length)];
  return interaction.reply({ content: `🎉 O novo vencedor é <@${newWinner}>! 🎉`, ephemeral: false });
}

module.exports = { rerollGiveaway };