const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};

// Обработчик нового подключения
io.on("connection", (socket) => {
    console.log("Новый игрок подключился:", socket.id);

    // Создаём игрока
    players[socket.id] = { x: 100, y: 100 }; // Начальная позиция

    // Отправляем всем игрокам нового участника
    io.emit("updatePlayers", players);

    // Обработка отключения игрока
    socket.on("disconnect", () => {
        console.log("Игрок отключился:", socket.id);
        delete players[socket.id];
        io.emit("updatePlayers", players); // Уведомляем всех об удалении игрока
    });

    // Обработка движения
    socket.on("move", (data) => {
        if (players[socket.id]) {
            players[socket.id].x += data.x;
            players[socket.id].y += data.y;
            io.emit("updatePlayers", players); // Обновляем данные для всех
        }
    });
});

const port = process.env.PORT || 8080;
server.listen(port, "0.0.0.0", () => {
    console.log(`Сервер запущен на порту ${port}`);
});
