const express = require("express");
const http = require("http");
const WebSocket = require("ws");

// Создаем Express приложение
const app = express();
const server = http.createServer(app);

// Создаем WebSocket сервер на основе HTTP сервера
const wss = new WebSocket.Server({ server });

const PLAYERS = [];
const SHOOTS = [];
let nextId = 1;
const charSpeed = 5; // Базовая скорость
const fps = 60;
const INTERVAL = 1000 / fps;
const SCREENSIZE = 900;

app.use(express.static("public"));






// когда подключился новенький
wss.on("connection", (newClient) => {
  //создали ему игрока
  const newPlayer = {
    id: nextId,
    x: 100,
    y: 100,
    vel: {
      x: 0,
      y: 0
    },
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    keysPressed: [0,0]
  }
  nextId ++;
  PLAYERS.push(newPlayer);

  console.log(`Игрок подключился: ${newPlayer.id}`);

  // Отправляем новому игроку его ID и список всех игроков
newClient.send(
  JSON.stringify({
    type: "init",
    id: newPlayer.id,
    players: PLAYERS,
    shoots: SHOOTS  // Add this line to send initial shoots state
  })
);


  // обработка сообщений от новичка
  newClient.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "press") {
        //если игрок что-то нажал или отпустил — обновляем массивчик с кнопками
        const player = PLAYERS.find(player => player.id === data.id);
        player.keysPressed = data.keys;

      } else if (data.type === "ping") {
        // Отправляем ответ на ping-запрос
        newClient.send(JSON.stringify({ type: "pong" }));
      }  else if (data.type === "shoot") {
        console.log("Received shoot data:", data);
  // Добавляем информацию о выстреле в общий массив
  SHOOTS.push({
    id: data.id,
    x: data.x,
    y: data.y,
    dirX: data.dirX,
    dirY: data.dirY
  });
      }
      
      // Дополнительные типы сообщений можно обработать здесь
    } catch (error) {
      console.error("Ошибка при обработке сообщения:", error);
    }
  });

  // Удаляем игрока при отключении
  newClient.on("close", () => {
    console.log(`Игрок отключился: ${newPlayer.id}`);
    const index = PLAYERS.findIndex(player => player.id === newPlayer.id);
    if (index !== -1) {
      PLAYERS.splice(index, 1);
    }
  });



  // Обработка ошибок WebSocket
  newClient.on("error", (error) => {
    console.error("WebSocket ошибка:", error);
  });
});



setInterval(() => {
  updatePlayersPositions();
  updateShotsPositions(); // Обновляем позиции выстрелов

  broadcastAsync({
    type: "update",
    players: PLAYERS,
    shoots: SHOOTS  // Передаем обновленные выстрелы
  });

  //SHOOTS.length = 0;
}, INTERVAL);











// Утилита для асинхронной отправки данных всем клиентам
async function broadcastAsync(data, exclude=null) {
  const message = JSON.stringify(data);
  const sendPromises = [];

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== exclude) {
      sendPromises.push(client.send(message));
    }
  });

  try {
    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Ошибка при отправке сообщений:", error);
  }
}


// Запускаем Express сервер
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});


function updatePlayersPositions(){
  for(const pl of PLAYERS){

    // X
    if (pl.keysPressed[0] == 0) pl.vel.x *= 0.96; 
    else pl.vel.x = pl.keysPressed[0] * charSpeed;
    // Y
    if (pl.keysPressed[1] == 0) pl.vel.y *= 0.96; 
    else pl.vel.y = pl.keysPressed[1] * charSpeed;
    

    pl.x += pl.vel.x;
    pl.y += pl.vel.y;

    // Ограничиваем координаты игрока в пределах экрана
    pl.x = Math.max(0, Math.min(SCREENSIZE, pl.x));
    pl.y = Math.max(0, Math.min(SCREENSIZE, pl.y));

    
  }
}
function updateShotsPositions() {
  for (let i = SHOOTS.length - 1; i >= 0; i--) {
    const shoot = SHOOTS[i];
    // Increase speed multiplier for more visible movement
    shoot.x += shoot.dirX * 10; // Increased from 0.5 to 2
    shoot.y += shoot.dirY * 10; // Increased from 0.5 to 2

    // Remove if out of bounds
    if (shoot.x < 0 || shoot.x > SCREENSIZE || 
        shoot.y < 0 || shoot.y > SCREENSIZE) {
      SHOOTS.splice(i, 1);
    }
  }
}
