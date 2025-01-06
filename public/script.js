let socket;
let MY_ID = 99999;
let players = []; 
let keysPressed = [ 0, 0] ;// vertical & horizontal & brake

let shoot;
let direction;
let shootDirection;

                                          
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
}



function mousePressed(){

shoot = createVector(player.x,player.y);
direction = createVector(mouseX,mouseY); 
shootDirection = shoot.add(direction);
  text("*",shootDirection.x,shootDirection.y);
  console.log("shoot");
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

