const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const { giveawayRun } = require('./commands/giveaway.js');

const app = express();
const clientId = process.env.clientId;
const token = process.env.token;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

app.listen(1104, () => {
  console.log("Eu sou o Forxz! Um bot para o discord que vai te ajudar a se divertir!");
});

app.get("/", (req, res) => {
  res.send("Eu sou o Forxz! Um bot para o discord que vai te ajudar a se divertir!");
});

const rest = new REST({ version: "10" }).setToken(token);

client.on("ready", async () => {
  console.log(`Olá! Eu tô online!`);
  client.user.setActivity("falar de que você recebe ajuda ao executar /ajuda", {
    type: "LISTENING",
  });

  const commands = [
    {
      name: "giveaway",
      description: "Inicie um sorteio facilmente e do seu jeito.",
      options: [
        {
          name: "duration",
          description: "Qual é a duração do sorteio? (1m, 1h, 1d)",
          type: 3,
          required: true
        },
        {
          name: "prize",
          description: "O prêmio do sorteio.",
          type: 3,
          required: true
        },
        {
          name: "host",
          description: "Qual pessoa é a host do sorteio?.",
          type: 6,
          required: false
        },
        {
          name: "special_role",
          description: "Qual é o cargo especial que terá mais entradas?",
          type: 8,
          required: false
        },
        {
          name: "entries",
          description: "Quantas entradas você quer para o cargo especial?",
          type: 4,
          required: false
        },
        {
          name: "image",
          description: "A imagem que vai aparecer no sorteio.",
          type: 11,
          required: false
        },
        {
          name: "description",
          description: "A descrição do sorteio.",
          type: 3,
          required: false
        }
      ]
    },
  ];

  try {
    console.log("Comecei a atualizar os comandos barra.");

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log("Terminei de atualizar os comandos barra.");
  } catch (error) {
    console.error(error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  switch (commandName) {
    case "giveaway":
      giveawayRun(interaction, options)
      break;
  }
});

client.login(token)