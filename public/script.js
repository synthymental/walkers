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
      playerId = data.id;
      players = data.players;
    } else if (data.type === "update") {
      if (players[data.id]) {
        players[data.id].x = data.x;
        players[data.id].y = data.y;
      }
    } else if (data.type === "remove") {
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

  if (key === "W") dy = -5;
  if (key === "S") dy = 5;
  if (key === "A") dx = -5;
  if (key === "D") dx = 5;

  socket.send(JSON.stringify({ type: "move", id: playerId, dx, dy }));
}
