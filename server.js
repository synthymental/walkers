const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

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

console.log("Сервер запущен на порту 8080");
