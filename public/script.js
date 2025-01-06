let socket;
let MY_ID = 99999;
let players = []; 
let keysPressed = [ 0, 0] ;// vertical & horizontal & brake

let shoots = []; 

                                          
let ping = 0; // Переменная для хранения текущего пинга
let lastPingTime = 0; // Время отправки последнего сообщения для измерения пинга

const character = `
  o
 /|\\
 / \\
`;

function setup() {
  createCanvas(900, 900);
  background(0);

  // shoot = createVector(0,0);
  // direction = createVector(0,0); 
  // shootDirection = createVector(0,0);

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
      shoots = data.shoots;

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
  background(0);
                                
  // Рисуем всех игроков
  
  for (const player of players) {
   // console.log(player);
    fill(player.color);
    textLeading(15);
    //ellipse(player.x, player.y, 20, 20);
    //textSize(12);
    text( character, player.x + 22, player.y + 22);
    

    
    textSize(16);
    text("x", mouseX-8,mouseY-8);
  }

  // Отображаем пинг
  fill(200);
  textSize(16);
  text(`Ping: ${ping} ms`, 10, height - 10);


  if (shoots && shoots.length > 0) {
  for (const shoot of shoots) {
    let shootPos = createVector(shoot.x, shoot.y);
    let direction = createVector(shoot.dirX, shoot.dirY);
    shootPos.add(direction.mult(50)); // Перемещаем пулю по направлению

    // Рисуем пулю как точку
    text("*", shootPos.x, shootPos.y);
  }
}

}



function mousePressed() {
  if (MY_ID === undefined) return;

  // Находим текущего игрока по его ID
  const player = players.find(p => p.id === MY_ID);
  if (!player) return;

  // Начальная позиция (точка, откуда будет идти "выстрел")
  let shoot = createVector(player.x, player.y);

  // Вектор направления (цель мыши относительно игрока)
  let direction = createVector(mouseX - player.x, mouseY - player.y);
  direction.normalize(); // Нормализуем вектор, чтобы выстрел был на одинаковой скорости во всех направлениях

  // Отправляем данные о выстреле на сервер
  socket.send(JSON.stringify({
    type: 'shoot',
    id: MY_ID,
    x: shoot.x,
    y: shoot.y,
    dirX: direction.x,
    dirY: direction.y
  }));

  // Выводим текст "*" в конечной точке на экране
  let shootDirection = p5.Vector.add(shoot, direction.mult(50)); // Умножаем направление, чтобы получить точку вдали
  text("*", shootDirection.x, shootDirection.y);
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

