let socket;
let playerId;
let players = {};

let velocity = { x: 0, y: 0 };  // Вектор скорости игрока
let charSpeed = 5;  // Скорость перемещения игрока

function setup() {
  createCanvas(800, 800);
  frameRate(60);
  background(220);

  // Подключение к WebSocket
  socket = new WebSocket(window.location.origin.replace(/^http/, "ws"));

  socket.onopen = () => {
    console.log("Соединение установлено");
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
    }
  };
}

function draw() {
  background(220);

  // Обновляем позицию текущего игрока с учетом вектора скорости
  if (playerId) {
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

  // Рисуем всех игроков
  for (const id in players) {
    const player = players[id];
    fill(player.color);
    rect(player.x, player.y, 20, 20);
  }
}

// На клиенте
function keyPressed() {
  if (!playerId) return;

  // Обновляем вектор скорости в зависимости от нажатой клавиши
  if (key === "w") velocity.y = -charSpeed;
  if (key === "s") velocity.y = charSpeed;
  if (key === "a") velocity.x = -charSpeed;
  if (key === "d") velocity.x = charSpeed;
}

function keyReleased() {
  // Останавливаем движение игрока, когда клавиша отпускается
  if (key === "w" || key === "s") velocity.y = 0;
  if (key === "a" || key === "d") velocity.x = 0;
}
