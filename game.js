const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const restartBtn = document.getElementById('restartBtn');

const W = canvas.width, H = canvas.height;

let keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.code] = false);

class Player {
  constructor() {
    this.w = 40; this.h = 20;
    this.x = W/2 - this.w/2; this.y = H - 40;
    this.speed = 5;
    this.cooldown = 0;
  }
  update() {
    if (keys['ArrowLeft']) this.x -= this.speed;
    if (keys['ArrowRight']) this.x += this.speed;
    this.x = Math.max(0, Math.min(W - this.w, this.x));
    if (this.cooldown > 0) this.cooldown--;
    if (keys['Space'] && this.cooldown === 0) {
      bullets.push({ x: this.x + this.w/2 - 2, y: this.y, w: 4, h: 12, dy: -7, friendly: true });
      this.cooldown = 15;
    }
  }
  draw() {
    ctx.fillStyle = '#0f0';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillRect(this.x + this.w/2 - 3, this.y - 8, 6, 8);
  }
}

class Invader {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.w = 30; this.h = 20;
    this.type = type;
    this.alive = true;
  }
  draw() {
    if (!this.alive) return;
    const colors = ['#f55', '#ff5', '#5cf'];
    ctx.fillStyle = colors[this.type];
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 6, this.y + 6, 4, 4);
    ctx.fillRect(this.x + this.w - 10, this.y + 6, 4, 4);
  }
}

let player, invaders, bullets, invaderDir, invaderSpeed, score, lives, gameOver, gameWon, frame;

function initGame() {
  player = new Player();
  invaders = [];
  bullets = [];
  invaderDir = 1;
  invaderSpeed = 0.6;
  score = 0;
  lives = 3;
  gameOver = false;
  gameWon = false;
  frame = 0;

  const rows = 4, cols = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      invaders.push(new Invader(60 + c * 55, 50 + r * 40, r === 0 ? 2 : (r < 3 ? 1 : 0)));
    }
  }
  overlay.style.display = 'none';
  updateHUD();
}

function updateHUD() {
  scoreEl.textContent = score;
  livesEl.textContent = lives;
}

function invaderShoot() {
  const alive = invaders.filter(inv => inv.alive);
  if (alive.length === 0) return;
  if (Math.random() < 0.02) {
    const shooter = alive[Math.floor(Math.random() * alive.length)];
    bullets.push({ x: shooter.x + shooter.w/2 - 2, y: shooter.y + shooter.h, w: 4, h: 10, dy: 4, friendly: false });
  }
}

function update() {
  if (gameOver || gameWon) return;
  frame++;

  player.update();

  bullets.forEach(b => b.y += b.dy);
  bullets = bullets.filter(b => b.y > -20 && b.y < H + 20);

  const alive = invaders.filter(inv => inv.alive);
  let hitEdge = false;
  alive.forEach(inv => {
    inv.x += invaderDir * invaderSpeed;
    if (inv.x <= 0 || inv.x + inv.w >= W) hitEdge = true;
  });
  if (hitEdge) {
    invaderDir *= -1;
    invaders.forEach(inv => inv.y += 15);
  }

  invaderSpeed = 0.6 + (1 - alive.length / invaders.length) * 2;
  invaderShoot();

  bullets.forEach(b => {
    if (b.friendly) {
      invaders.forEach(inv => {
        if (inv.alive && b.x < inv.x + inv.w && b.x + b.w > inv.x && b.y < inv.y + inv.h && b.y + b.h > inv.y) {
          inv.alive = false;
          b.y = -999;
          score += (inv.type + 1) * 10;
          updateHUD();
        }
      });
    } else {
      if (b.x < player.x + player.w && b.x + b.w > player.x && b.y < player.y + player.h && b.y + b.h > player.y) {
        b.y = H + 999;
        lives--;
        updateHUD();
        if (lives <= 0) endGame(false);
      }
    }
  });

  invaders.forEach(inv => {
    if (inv.alive && inv.y + inv.h >= player.y) endGame(false);
  });

  if (invaders.every(inv => !inv.alive)) endGame(true);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#0a0a1a';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect((i * 53) % W, (i * 97 + frame * 0.3) % H, 2, 2);
  }

  player.draw();
  invaders.forEach(inv => inv.draw());
  bullets.forEach(b => {
    ctx.fillStyle = b.friendly ? '#0ff' : '#f0f';
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

function endGame(won) {
  gameOver = !won;
  gameWon = won;
  overlay.style.display = 'block';
  overlayText.innerHTML = won
    ? `<h2 style="color:#0f0">HAI VINTO!</h2><p>Punteggio finale: ${score}</p>`
    : `<h2 style="color:#f55">GAME OVER</h2><p>Punteggio finale: ${score}</p>`;
}

restartBtn.addEventListener('click', initGame);

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

initGame();
loop();
