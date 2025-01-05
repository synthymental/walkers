const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");

// Чтение SSL-сертификатов (необходимы для работы с HTTPS)
const server = https.createServer({
  key: fs.readFileSync('path/to/your/private-key.pem'),
  cert: fs.readFileSync('path/to/your/certificate.pem'),
});

const wss = new WebSocket.Server({ server });

// Игроки и их данные
let players = {};
let nextId = 1;

wss.on("connection", (ws) => {
  const playerId = nextId++;
  const playerColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  players[playerId] = { x: 100, y: 100, color: playerColor }; // Добавляем игрока

  console.log(`Игрок подключился: ${playerId}`);

  // Отправляем новому игроку его ID и список всех игроков
  ws.send(
    JSON.stringify({
      type: "init",
      id: playerId,
      players,
    })
  );

  // Уведомляем остальных игроков о новом участнике
  broadcast({
    type: "update",
    id: playerId,
    x: players[playerId].x,
    y: players[playerId].y,
    color: playerColor,
  }, ws);

  // Обработка сообщений от клиента
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "move" && players[data.id]) {
      players[data.id].x += data.dx;
      players[data.id].y += data.dy;

      // Уведомляем всех об обновлении позиции
      broadcast({
        type: "update",
        id: data.id,
        x: players[data.id].x,
        y: players[data.id].y,
      });
    }
  });

  // Удаляем игрока при отключении
  ws.on("close", () => {
    console.log(`Игрок отключился: ${playerId}`);
    delete players[playerId];

    // Уведомляем всех об удалении игрока
    broadcast({
      type: "remove",
      id: playerId,
    });
  });

  // Обработка ошибок WebSocket
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Утилита для отправки данных всем клиентам
function broadcast(data, exclude) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== exclude) {
      client.send(message);
    }
  });
}

// Запуск HTTPS-сервера на порту, определённом платформой (например, Railway)
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
