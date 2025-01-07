class Player {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vel = { x: 0, y: 0 };
    this.hp = 3;
    this.maxHp = 3;
    this.color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    this.keysPressed = [0, 0];
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.deaths++;
      this.hp = 3; // Респавн или сброс HP
      this.x = 450;
      this.y = 450;
      return true; // Игрок умер
    }
    return false; // Игрок жив
  }

  respawn(screenSize) {
    console.log("respawned");
    this.hp = this.maxHp;
    this.x = Math.random() * screenSize;
    this.y = Math.random() * screenSize;
    this.deaths++;
    this.vel = { x: 0, y: 0 };
  }

  addKill() {
    this.kills++;
    this.score += 100;
  }
}

module.exports = Player;