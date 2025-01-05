const express = require("express");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Раздача статических файлов
app.use(express.static(path.join(__dirname, "public")));

// Запуск HTTP-сервера
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Сервер запущен на порту ${port}`);
});


// WebSocket-сервер
const wss = new WebSocket.Server({ server });

// Состояние игроков
const players = {};

wss.on("connection", (ws) => {
  const playerId = Date.now(); // Уникальный ID игрока
  players[playerId] = { x: Math.random() * 400, y: Math.random() * 400, color: getRandomColor() };

  console.log(`Игрок ${playerId} подключен`);
  ws.send(JSON.stringify({ type: "init", id: playerId, players }));

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "move") {
      const player = players[data.id];
      if (player) {
        player.x += data.dx;
        player.y += data.dy;

        // Уведомляем всех клиентов об изменении состояния
        broadcast({ type: "update", id: data.id, x: player.x, y: player.y });
      }
    }
  });

  ws.on("close", () => {
    console.log(`Игрок ${playerId} отключен`);
    delete players[playerId];
    broadcast({ type: "remove", id: playerId });
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function getRandomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}
