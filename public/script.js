let socket;
let MY_ID = 99999;
let players = []; 
let keysPressed = [ 0, 0] // vertical & horizontal & brake
                                          
let ping = 0; // Переменная для хранения текущего пинга
let lastPingTime = 0; // Время отправки последнего сообщения для измерения пинга


function setup() {
  createCanvas(700, 700);
  background(220);

  // Подключение к WebSocket
  socket = new WebSocket(window.location.origin.replace(/^http/, "ws"));

  //пинг
  socket.onopen = () => {
    console.log("Соединение установлено");
    setInterval(() => {
      lastPingTime = Date.now();
      socket.send(JSON.stringify({ type: "ping" })); // Отправляем ping-запрос на сервер
    }, 1000); // Каждую секунду
  };

  // обработка сообщений от сервера
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "init") {
      // Сохраняем ID текущего игрока и список всех существующих игроков
      MY_ID = data.id;
      players = data.players;

    } else if (data.type === "update") {
      //обновляем данные игроков
      players = data.players;
    } else if (data.type === "pong") {
      // Рассчитываем пинг как разницу между текущим временем и временем отправки
      ping = Date.now() - lastPingTime;
    }
  };
}

function draw() {
  background(220);
                                
  // Рисуем всех игроков
  
  for (const player of players) {
    console.log(player);
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
  if (!MY_ID) return;
  if (!"wWцЦaAфФsSыЫdDвВ".includes(key)) return;
  
  if      (key === "w" || key === "W" || key === "ц" || key === "Ц") keysPressed[1] --;
  else if (key === "a" || key === "A" || key === "ф" || key === "Ф") keysPressed[0] --;
  else if (key === "s" || key === "S" || key === "ы" || key === "Ы") keysPressed[1] ++;
  else if (key === "d" || key === "D" || key === "в" || key === "В") keysPressed[0] ++;

  socket.send(
    JSON.stringify({
      type: "press",
      id: MY_ID,
      keys: keysPressed
    })
  );
}






function keyReleased() {
  if (!MY_ID) return;
  if (!"wWцЦaAфФsSыЫdDвВ".includes(key)) return;

  if      (key === "w" || key === "W" || key === "ц" || key === "Ц") keysPressed[1] ++;
  else if (key === "a" || key === "A" || key === "ф" || key === "Ф") keysPressed[0] ++;
  else if (key === "s" || key === "S" || key === "ы" || key === "Ы") keysPressed[1] --;
  else if (key === "d" || key === "D" || key === "в" || key === "В") keysPressed[0] --;

  socket.send(
    JSON.stringify({
      type: "press",
      id: MY_ID,
      keys: keysPressed
    })
  );
}

