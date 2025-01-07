let socket;
let MY_ID = 99999;
let players = []; 
let keysPressed = [ 0, 0] ;// vertical & horizontal & brake

let shoots = []; 

                                          
let ping = 0; // Переменная для хранения текущего пинга
let lastPingTime = 0; // Время отправки последнего сообщения для измерения пинга

const characterStates = {
  normal: `
  o
 /|\\
 / \\
`,
    hi: `
 (o
  |\\
 / \\
`,
  handsUp: `
  \\o/
   |
  / \\
`,
  waving: `
   o/
   |
  / \\
`
};

let character = characterStates.hi;

function setup() {
  createCanvas(900, 900);
  background(0);

;

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
    MY_ID = data.id;
    players = data.players;
    shoots = data.shoots || []; // Handle case when shoots are undefined
  } else if (data.type === "update") {
    players = data.players;
    shoots = data.shoots; // Add this line to sync shoots with server
  } else if (data.type === "pong") {
    ping = Date.now() - lastPingTime;
  }
};
}

function draw() {
  background(0);
   setTimeout(() => {
      character = characterStates.hi;
    }, 200);
   setTimeout(() => {
      character = characterStates.normal;
    }, 100);
  // Рисуем всех игроков
  for (const player of players) {
    fill(player.color);
    textLeading(15);
    text(character, player.x, player.y);
  }

  // Рисуем все пули
  if (shoots && shoots.length > 0) {
    for (let i = shoots.length - 1; i >= 0; i--) {
      let shoot = shoots[i];
      let shootPos = createVector(shoot.x, shoot.y);
      let direction = createVector(shoot.dirX, shoot.dirY);
      shootPos.add(direction.mult(0.5)); // Перемещаем пулю по направлению

      // Если пуля выходит за пределы экрана, удаляем её
      if (shootPos.x < 0 || shootPos.x > width || shootPos.y < 0 || shootPos.y > height) {
        shoots.splice(i, 1);
      } else {
        // Рисуем пулю
        textSize(35);
        fill(255);
        text("*", shootPos.x, shootPos.y);
        
        // Обновляем координаты пули
        shoot.x = shootPos.x;
        shoot.y = shootPos.y;
      }
    }
    
  }

  // Отображаем пинг
  fill(200);
  textSize(16);
  text(`Ping: ${ping} ms`, 10, height - 10);
}




function mousePressed() {
  character = characterStates.handsUp;
  if (MY_ID === undefined) return;

  // Находим текущего игрока по его ID
  const player = players.find(p => p.id === MY_ID);
  if (!player) return;

  // Начальная позиция (точка, откуда будет идти "выстрел")
  let shoot = createVector(player.x, player.y+30);

  // Вектор направления (цель мыши относительно игрока)
  let direction = createVector(mouseX - player.x, mouseY - player.y);
  direction.normalize(); // Нормализуем вектор, чтобы выстрел был на одинаковой скорости во всех направлениях

  // Проверяем перед добавлением
  if (shoot && direction) {
    // Добавляем новый выстрел в массив
    shoots.push({
      x: shoot.x,
      y: shoot.y,
      dirX: direction.x,
      dirY: direction.y,
    });

    // Отправляем данные о выстреле на сервер
    socket.send(JSON.stringify({
      type: 'shoot',
      id: MY_ID,
      x: shoot.x,
      y: shoot.y,
      dirX: direction.x,
      dirY: direction.y,
    }));
  }
      setTimeout(() => {
      character = characterStates.handsUp;
    }, 200);
   setTimeout(() => {
      character = characterStates.waving;
    }, 100);

    setTimeout(() => {
      character = characterStates.normal;
    }, 400);
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

