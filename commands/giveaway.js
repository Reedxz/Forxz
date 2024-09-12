const { EmbedBuilder, Options } = require('discord.js');
const fs = require('fs');

async function giveawayRun (interaction, options) {
  const giveawayImage = options.getAttachment('image');
  const giveawayTitle = options.getString('prize');
  const giveawayDescription = options.getString('description') || 'Nenhuma descrição foi fornecida. ¯\_(ツ)_/¯';
  const giveawayDuration = options.getString('duration');
  const giveawayHost = options.getUser('host') || interaction.user; // Use 'host' option or default to the interaction executor

  // Calculate the timestamp for the end of the giveaway
  const currentTime = Math.floor(Date.now() / 1000); // Current Unix time in seconds
  const durationInSeconds = parseInt(giveawayDuration) * 60; // Assuming the duration is in minutes
  const endTime = currentTime + durationInSeconds;

  // Convert the attachment to a URL, if it exists
  const imageUrl = giveawayImage ? giveawayImage.url : null;

  // Build the embed object
  let embed = new EmbedBuilder({
    "title": `**${giveawayTitle}**`,
    "description": `${giveawayDescription}\n\nEnds in <t:${endTime}:R>.\n\nHost: ${giveawayHost}`, // Add the host at the end
    "color": 0x9ab8d1,
    "footer": {
      "text": `Participe clicando no botão abaixo.`,
    }
  });

  // Only add the image if a valid URL exists
  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  await interaction.reply({ embeds: [embed] });
}

module.exports = { giveawayRun };