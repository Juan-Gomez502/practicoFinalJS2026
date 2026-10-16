// Variables globales y configuración básica
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// Carga el sonido que se reproducirá cada 100 puntos
const sonidoRecord = new Audio("aud/point.wav");
const sonidoGameOver = new Audio("aud/die.wav");
const sonidoSalto = new Audio("aud/jump.wav");

let gameSpeed = 5;           // Velocidad constante (los cambios se harán en la modificación)
let gravity = 0.5;           // Fuerza de gravedad
let gameOver = false;
let score = 0;
const savedHighScore = Number(localStorage.getItem("dinoHighScore"));
let highScore = Number.isFinite(savedHighScore) && savedHighScore > 0 ? savedHighScore : 0;

// Objeto dinosaurio
let dino = {
    x: 50,
    y: canvas.height - 47,   // La altura del dino es de 47 px (se alinea al "suelo")
    width: 44,
    height: 47,
    vy: 0,
    isJumping: false,
    image: null
};

// Obstáculo activo: puede ser un cacto o un pájaro
let obstacle = {
    x: canvas.width,
    y: canvas.height - 40,
    width: 25,
    height: 40,
    type: "cactus"
};

// Carga de imágenes (ajusta las rutas según tu estructura)
let dino_amarilloImg = new Image();
dino_amarilloImg.src = "img/dino_amarillo.png";
let dino_verdeImg = new Image();
dino_verdeImg.src = "img/dino_verde.png";
let dinoImg = new Image();
dinoImg.src = "img/dino.png";     
let cactusImg = new Image();
cactusImg.src = "img/cactus.png"; 
let birdImg = new Image();
birdImg.src = "img/pajarito.png";

function randomizeObstacle() {
    obstacle.type = Math.random() < 0.5 ? "cactus" : "bird";
    if (obstacle.type === "bird") {
        obstacle.y = canvas.height - 65;
        obstacle.width = 38;
        obstacle.height = 28;
    } else {
        obstacle.y = canvas.height - 40;
        obstacle.width = 25;
        obstacle.height = 40;
    }
}

randomizeObstacle();

// Lista de dinosaurios que se irán alternando
const dinoImages = [dinoImg, dino_verdeImg, dino_amarilloImg];
let dinoIndex = 0;
dino.image = dinoImages[dinoIndex];

// Función principal del ciclo de juego
function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Actualiza posiciones y controla la lógica del juego
function update() {
    score++;  // Suma puntos continuamente (1 punto por frame)
    highScore = Math.max(highScore, score);
    
    // Física del salto del dinosaurio
    if (dino.isJumping) {
        dino.vy += gravity;
        dino.y += dino.vy;
        // Cuando el dino aterriza en el "suelo"
        if (dino.y >= canvas.height - dino.height) {
            dino.y = canvas.height - dino.height;
            dino.isJumping = false;
            dino.vy = 0;
        }
    }
    
    // Mueve el obstáculo de derecha a izquierda
    obstacle.x -= gameSpeed;
    if (score % 100 === 0 && score !== 0) {
        gameSpeed += 0.5; // Aumenta la velocidad del juego cada 100 puntos
        sonidoRecord.play(); // Reproduce el sonido del record
    }
    if (gameOver) {
        gameSpeed = 0; // Detiene el movimiento del obstáculo si el juego termina
    }
    // Cuando el obstáculo sale por la izquierda, se reubica a la derecha con un espacio aleatorio
    if (obstacle.x + obstacle.width < 0) {
        obstacle.x = canvas.width + Math.random() * 200;
        randomizeObstacle();
    }
    
    // Detección simple de colisiones (rectángulos)
    if (collision(dino, obstacle)) {
        gameOver = true;
        sonidoGameOver.play(); // Reproduce el sonido de game over
        localStorage.setItem("dinoHighScore", highScore);
        document.getElementById("restartBtn").style.display = "block";
    }
}

// Función de detección de colisiones
function collision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Dibuja el juego: fondo, puntaje, dinosaurio y obstáculo
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibuja el puntaje
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 25);
    ctx.fillText("High score: " + highScore, canvas.width - 170, 25);
    
    
    // Dibuja el dinosaurio con la imagen actual
    if (dino.image && dino.image.complete) {
        ctx.drawImage(dino.image, dino.x, dino.y, dino.width, dino.height);
    } else {
        ctx.fillStyle = "green";
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    }
    
    // Dibuja el obstáculo activo, usando una forma simple mientras carga su imagen
    const obstacleImg = obstacle.type === "bird" ? birdImg : cactusImg;
    if (obstacleImg.complete && obstacleImg.naturalWidth > 0) {
        ctx.drawImage(obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    } else {
        ctx.fillStyle = obstacle.type === "bird" ? "#333" : "brown";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
}

// Maneja el salto al presionar la barra espaciadora
document.addEventListener("keydown", function(e) {
    if ((e.code === "Space" || e.code === "ArrowUp") && !dino.isJumping && !gameOver) {
        dino.isJumping = true;
        dino.vy = -10;  // Velocidad inicial de salto
        dino.image = dinoImages[dinoIndex];
        dinoIndex = (dinoIndex + 1) % dinoImages.length;
        sonidoSalto.play(); // Reproduce el sonido del salto
        e.preventDefault();
    }
});

// Función para reiniciar el juego al hacer clic en el botón
document.getElementById("restartBtn").addEventListener("click", function() {
    gameOver = false;
    score = 0;
    dino.y = canvas.height - dino.height;
    dino.isJumping = false;
    dino.vy = 0;
    dinoIndex = 0;
    dino.image = dinoImages[dinoIndex];
    obstacle.x = canvas.width;
    randomizeObstacle();
    this.style.display = "none";
    obstacle.x -= gameSpeed;
    gameLoop();
});

// Inicia el juego cuando la ventana carga
window.onload = function() {
    gameLoop();
};