const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function autoresposta(interaction, options) {
  const subcommand = options.getSubcommand();
  const messageToSeek = options.getString("mensagem");
  const messageToReplyWith = options.getString("resposta");
  
  if (subcommand === "criar") {
    client.on("messageCreate", async (message) => {
      if (message.content === messageToSeek) {
        await interaction.reply(messageToReplyWith);
      }
    });
  }

  if (subcommand === "começo") {
    client.on("messageCreate", async (message) => {
      if (message.content.startsWith(messageToSeek)) {
        await interaction.reply(messageToReplyWith);
      }
    });
  }
}

module.exports = { autoresposta }