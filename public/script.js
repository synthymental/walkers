let socket;
let playerId;
let players = {};
let velocity; // Используем p5.Vector
let charSpeed = 5; // Базовая скорость
let ping = 0; // Переменная для хранения текущего пинга
let lastPingTime = 0; // Время отправки последнего сообщения для измерения пинга
let keysPressed = false; 

function setup() {
  createCanvas(800, 800);
  background(220);

  velocity = createVector(0, 0); // Инициализация вектора скорости

  // Подключение к WebSocket
  socket = new WebSocket(window.location.origin.replace(/^http/, "ws"));

  socket.onopen = () => {
    console.log("Соединение установлено");

    // Периодически измеряем пинг
    setInterval(() => {
      lastPingTime = Date.now();
      socket.send(JSON.stringify({ type: "ping" })); // Отправляем ping-запрос на сервер
    }, 1000); // Каждую секунду
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "init") {
      // Сохраняем ID текущего игрока и список всех существующих игроков
      playerId = data.id;
      players = data.players;
    } else if (data.type === "update") {
      // Обновляем положение игрока
      if (players[data.id]) {
        players[data.id].x = data.x;
        players[data.id].y = data.y;
      } else {
        // Если игрока ещё нет в списке, добавляем его
        players[data.id] = { x: data.x, y: data.y, color: data.color };
      }
    } else if (data.type === "remove") {
      // Удаляем игрока из списка
      delete players[data.id];
    } else if (data.type === "pong") {
      // Рассчитываем пинг как разницу между текущим временем и временем отправки
      ping = Date.now() - lastPingTime;
    }
  };
}

function draw() {
  background(220);

  // Обновляем позицию текущего игрока с учетом вектора скорости
  if (playerId) {
    if (players[playerId]) {
      players[playerId].x += velocity.x;
      players[playerId].y += velocity.y;

      // Отправляем обновление позиции игрока на сервер
      socket.send(
        JSON.stringify({
          type: "move",
          id: playerId,
          dx: velocity.x,
          dy: velocity.y,
        })
      );
    }
  }

  if (!keysPressed) {
    velocity.mult(0.98); // Уменьшаем скорость каждый кадр
  }

  // Рисуем всех игроков
  for (const id in players) {
    const player = players[id];
    fill(player.color);
    ellipse(player.x, player.y, 20, 20);
    textSize(12);
    text(`${round(player.x)}, ${round(player.y)}`, player.x + 22, player.y + 22);
  }

  // Отображаем пинг
  fill(0);
  textSize(16);
  text(`Ping: ${ping} ms`, 10, height - 10);
}

function keyPressed() {
  if (!playerId) return;
  keysPressed = true;

  // Обновляем вектор скорости в зависимости от нажатой клавиши
  if (key === "w" || key === "ц" || key === "W") velocity.y = -charSpeed;
  if (key === "s"|| key === "ы"|| key === "S") velocity.y = charSpeed;
  if (key === "a"|| key === "ф"|| key === "A") velocity.x = -charSpeed;
  if (key === "d"|| key === "в"|| key === "D") velocity.x = charSpeed;
}
function keyReleased() {
keysPressed = false;
}
// // function keyReleased() {
// //   // Останавливаем движение игрока, когда клавиша отпускается
// //   if (key === "w" || key === "s") velocity.y = 0;
// //   if (key === "a" || key === "d") velocity.x = 0;
// // }
