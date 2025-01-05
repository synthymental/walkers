const express = require("express");
const http = require("http");
const WebSocket = require("ws");

// Создаем Express приложение
const app = express();
const server = http.createServer(app);

// Создаем WebSocket сервер на основе HTTP сервера
const wss = new WebSocket.Server({ server });

let players = {};
let nextId = 1;

// Статический сервер для отдачи файлов (если у тебя есть фронтенд в виде HTML/JS)
app.use(express.static("public"));

// Обработка WebSocket соединений
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
      const player = players[data.id];

      // Проверяем, изменились ли координаты
      const newX = player.x + data.dx;
      const newY = player.y + data.dy;

      // Если позиция изменилась, обновляем
      if (player.x !== newX || player.y !== newY) {
        players[data.id].x = newX;
        players[data.id].y = newY;

        // Уведомляем всех об обновлении позиции
        broadcast({
          type: "update",
          id: data.id,
          x: newX,
          y: newY,
        });
      }
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
    console.error("WebSocket ошибка:", error);
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

// Запускаем Express сервер
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
