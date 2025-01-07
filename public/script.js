let socket;
let MY_ID = 99999;
let players = [];
let keysPressed = [0, 0];// vertical & horizontal & brake

let shoots = [];
let idle = true;
let playerStats = {
  kills: 0,
  deaths: 0
};

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
 \\o
  |\\
 / \\
`
};

let character = characterStates.hi;


function setup() {
  createCanvas(900, 900);
  background(0);
 
  

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
      shoots = data.shoots || [];
      console.log("Players received on init:", players);
    } else if (data.type === "update") {
      players = data.players;
      shoots = data.shoots;
    } else if (data.type === "playerHit") {
      const hitPlayer = players.find(p => p.id === data.playerId);
      if (hitPlayer) {
        hitPlayer.hp = data.hp;
        if (hitPlayer.id === MY_ID) {
          playerStats.deaths = data.deaths;
        }
      }

      const killer = players.find(p => p.id === data.killerId);
      if (killer && killer.id === MY_ID) {
        playerStats.kills = data.kills;
      }
    } else if (data.type === "pong") {
      ping = Date.now() - lastPingTime;
    }
  };
  
  // function draw() {
  //   background(0);
  //   if (!players) {
  //     console.log("Players array is undefined or null.");
  //   } else if (players.length === 0) {
  //     console.log("Players array is empty.");
  //   } else {
  //     for (const player of players) {
  //       console.log("Player being drawn:", player);
  //     }
  //   }
  //   for (const player of players) {
  //     // Рисуем персонажа игрока
      
  //     console.log("Player being drawn:", player);
  //     fill(player.color);
  //     textLeading(15);
  //     text(character, player.x, player.y);
  //     console.log(character + player.x +" "+ player.y);

  //     // Рисуем шкалу здоровья
  //     const hpWidth = 30;
  //     const hpHeight = 5;
  //     fill(255, 0, 0); // Красный фон для шкалы здоровья
  //     rect(player.x - hpWidth / 2, player.y - 30, hpWidth, hpHeight);
  //     fill(0, 255, 0); // Зелёный цвет для оставшегося здоровья
  //     rect(
  //       player.x - hpWidth / 2,
  //       player.y - 30,
  //       (player.hp / player.maxHp) * hpWidth,
  //       hpHeight
  //     );
  //     console.log("Players array:", players);
  //   }
  //   console.log("Players array:", players);
  //   // Рисуем все пули
  //   if (shoots && shoots.length > 0) {
  //     for (let i = shoots.length - 1; i >= 0; i--) {
  //       let shoot = shoots[i];
  //       let shootPos = createVector(shoot.x, shoot.y);
  //       let direction = createVector(shoot.dirX, shoot.dirY);
  //       shootPos.add(direction.mult(0.5)); // Перемещаем пулю по направлению

  //       // Если пуля выходит за пределы экрана, удаляем её
  //       if (shootPos.x < 0 || shootPos.x > width || shootPos.y < 0 || shootPos.y > height) {
  //         shoots.splice(i, 1);
  //       } else {
  //         // Рисуем пулю
  //         textSize(35);
  //         fill(255);
  //         text("*", shootPos.x, shootPos.y);

  //         // Обновляем координаты пули
  //         shoot.x = shootPos.x;
  //         shoot.y = shootPos.y;
  //       }
  //     }

  //   }

  //   //stats
  //   fill(255);
  //   textSize(16);
  //   text(`Ping: ${ping} ms`, 10, height - 10);
  //   text(`Kills: ${playerStats.kills}  Deaths: ${playerStats.deaths}`, 10, height - 30);

  // }
  function draw() {
    fill(255);
  rect(mouseX,mouseY,100,100);
  }
  

  // function updatePlayers(newPlayers) {
  //   players = newPlayers;
  //   console.log("Players updated:", players);
  // }
  function loadPlayers() {
    // Имитируем асинхронную загрузку
    setTimeout(() => {
      players = [
        { id: 1, x: 100, y: 100, color: "#FF0000", hp: 3, maxHp: 3 },
        // Добавьте других игроков
      ];
      console.log("Players loaded:", players);
    }, 1000);
  }

  function mousePressed() {
    idle = false;
    character = characterStates.handsUp;
    if (MY_ID === undefined) return;

    // Находим текущего игрока по его ID
    const player = players.find(p => p.id === MY_ID);
    if (!player) return;

    // Начальная позиция (точка, откуда будет идти "выстрел")
    let shoot = createVector(player.x, player.y + 30);

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
    setTimeout(() => {
      idle = true;
    }, 5400);
  }




  function keyPressed() {

    if (!MY_ID) return;
    if (!"wWцЦaAфФsSыЫdDвВ".includes(key)) return;

    if (key === "w" || key === "W" || key === "ц" || key === "Ц") keysPressed[1]--;
    else if (key === "a" || key === "A" || key === "ф" || key === "Ф") keysPressed[0]--;
    else if (key === "s" || key === "S" || key === "ы" || key === "Ы") keysPressed[1]++;
    else if (key === "d" || key === "D" || key === "в" || key === "В") keysPressed[0]++;

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

    if (key === "w" || key === "W" || key === "ц" || key === "Ц") keysPressed[1]++;
    else if (key === "a" || key === "A" || key === "ф" || key === "Ф") keysPressed[0]++;
    else if (key === "s" || key === "S" || key === "ы" || key === "Ы") keysPressed[1]--;
    else if (key === "d" || key === "D" || key === "в" || key === "В") keysPressed[0]--;

    socket.send(
      JSON.stringify({
        type: "press",
        id: MY_ID,
        keys: keysPressed
      })
    );
  }
}
