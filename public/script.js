let socket;
let playerId;
let players = {};

function setup() {
  createCanvas(400, 400);
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

  // Рисуем всех игроков
  for (const id in players) {
    const player = players[id];
    fill(player.color);
    rect(player.x, player.y, 20, 20);
  }
}

function keyPressed() {
  if (!playerId) return;

  let dx = 0, dy = 0;

  if (key === "w") dy = -5;
  if (key === "s") dy = 5;
  if (key === "a") dx = -5;
  if (key === "d") dx = 5;

  socket.send(JSON.stringify({ type: "move", id: playerId, dx, dy }));
}
