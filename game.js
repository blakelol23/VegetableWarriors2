// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game Variables
let vegetables = [];
let splatters = [];
let powerUps = [];
let bombs = [];
let score = 0;
let gameRunning = true;
let comboCounter = 0;
let missedCounter = 0;
let maxCombo = 0;
let isDoubleScoreActive = false;
let doubleScoreTimer = null;
let isSlowMotionActive = false;
let slowMotionTimer = null;
let originalSpeed = 1;
let gameSpeed = 1;
let lastColorChangeTime = Date.now();
let activePowerUp = null;
let powerUpExpiration = null;

// Constants
const comboThreshold = 5;
const comboMultiplier = 2;
const highComboThreshold = 1;
const missThreshold = 3;
const powerUpDisplayDuration = 10000;
const beams = [];

// Vegetable Data
const vegetableData = [
    { image: './images/carrot.png', color: 'rgba(255, 165, 0, 0.6)' },
    { image: './images/tomato.png', color: 'rgba(255, 0, 0, 0.6)' },
    { image: './images/broccoli.png', color: 'rgba(0, 255, 0, 0.6)' },
    { image: './images/pepper.png', color: 'rgba(255, 255, 0, 0.6)' }
   // { image: './images/devonDaBomb.png', color: 'rgba(255, 155, 0, 0.6'}
];

// Power-up Data
const powerUpData = [
    { type: 'doubleScore', image: './images/power_double.png' },
    { type: 'slowMotion', image: './images/power_slow.png' },
    { type: 'instantCombo', image: './images/power_combo.png' }
];

const bombData = [
    { image: './images/devonDaBomb.png' }
];

const loadedBombImages = [];
bombData.forEach(bomb => {
    const img = new Image();
    img.src = bomb.image;
    img.onload = () => {
        loadedBombImages.push(img);
    };
});

// Preload Images
const loadedImages = [];
vegetableData.forEach(veg => {
    const img = new Image();
    img.src = veg.image;
    img.onload = () => {
        loadedImages.push({
            img: img,
            color: veg.color
        });
    };
});

const loadedPowerUpImages = [];
powerUpData.forEach(pu => {
    const img = new Image();
    img.src = pu.image;
    img.onload = () => {
        loadedPowerUpImages.push({
            type: pu.type,
            img: img
        });
    };
});

// Vegetable Class
class Vegetable {
    constructor(x, y, img, color, isPowerUp = false) {
        this.x = x;
        this.y = y;
        this.img = img;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 2 * gameSpeed;
        this.vy = -Math.random() * 8 * gameSpeed - 10;
        this.gravity = 0.2 * gameSpeed;
        this.width = 75;
        this.height = 75;
        this.active = true;
        this.sliced = false;
        this.sliceOffsetX = 0;
        this.sliceOffsetY = 0;
        this.rotationAngleLeft = 0;
        this.rotationAngleRight = 0;
        this.isPowerUp = isPowerUp;
    }

    draw() {
        if (!this.sliced) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.save();
            ctx.translate(this.x + this.width / 4, this.y + this.height / 2);
            ctx.rotate(this.rotationAngleLeft);
            ctx.drawImage(this.img, 0, 0, this.img.width / 2, this.img.height, -this.width / 4 - this.sliceOffsetX, -this.height / 2 - this.sliceOffsetY, this.width / 2, this.height);
            ctx.restore();

            ctx.save();
            ctx.translate(this.x + (3 * this.width) / 4, this.y + this.height / 2);
            ctx.rotate(this.rotationAngleRight);
            ctx.drawImage(this.img, this.img.width / 2, 0, this.img.width / 2, this.img.height, -this.width / 4 + this.sliceOffsetX, -this.height / 2 + this.sliceOffsetY, this.width / 2, this.height);
            ctx.restore();
        }
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.sliced) {
            this.sliceOffsetX += 2;
            this.sliceOffsetY += 1;
            this.rotationAngleLeft -= 0.05;
            this.rotationAngleRight += 0.05;
        }
    // Check if the vegetable hits the bottom
    if (this.y - this.height > canvas.height) {
        if (!this.sliced) {
            comboCounter = 0; // Reset combo if the vegetable is unsliced
        }
    }
        if (this.y - this.height > canvas.height) {
            this.active = false;
        }
    }

    isSliced(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + this.width && mouseY >= this.y && mouseY <= this.y + this.height;
    }

    slice(mouseX, mouseY) {
        if (this.isPowerUp) {
            // If it's a power-up, don't count as a miss
            this.sliced = true;
            this.applyPowerUpEffect();
            return;
        }
    
        this.sliced = true;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const angle = Math.atan2(mouseY - centerY, mouseX - centerY);
        this.sliceOffsetX = Math.cos(angle) * 5;
        this.sliceOffsetY = Math.sin(angle) * 5;
        addSplatterEffect(this.x + this.width / 2, this.y + this.height / 2, this.color);
    
        comboCounter++;
        if (comboCounter > maxCombo) {
            maxCombo = comboCounter;
        }
        const points = 10 * (comboCounter >= comboThreshold ? comboMultiplier : 1);
        score += points;

            // Calculate points
    const basePoints = 10 * (comboCounter >= comboThreshold ? comboMultiplier : 1);
    const finalPoints = isDoubleScoreActive ? basePoints * 5 : basePoints; // Apply double score
    score += finalPoints; // Update score
    }

    applyPowerUpEffect() {
        switch (this.img.src) {
            case './images/power_double.png':
                activateDoubleScore();
                break;
            case './images/power_slow.png':
                activateSlowMotion();
                break;
            case './images/power_combo.png':
                comboCounter += 10;
                break;
        }
    }
}

// Power-up Class
class PowerUp {
    constructor(x, y, type, img) {
        this.x = x;
        this.y = y;
        this.img = img;
        this.type = type;
        this.vy = -Math.random() * 8 - 5;
        this.gravity = 0.2 * gameSpeed;
        this.width = 75;
        this.height = 75;
        this.active = true;
        this.collected = false; // Flag for collection
    }

    draw() {
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }

    update() {
        this.vy += this.gravity;
        this.y += this.vy;

        if (this.y - this.height > canvas.height) {
            this.active = false;
        }
    }

    isSliced(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + this.width && mouseY >= this.y && mouseY <= this.y + this.height;
    }

    applyEffect() {
        if (!this.collected) {
            this.collected = true; // Mark as collected
            switch (this.type) {
                case 'doubleScore':
                    activateDoubleScore();
                    break;
                case 'slowMotion':
                    activateSlowMotion();
                    break;
                case 'instantCombo':
                    comboCounter += 10;
                    break;
            }
            this.active = false; // Remove from screen
        }
    }
}

class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.img = loadedBombImages[0]; // Assuming there's only one bomb image
        this.vy = -Math.random() * 8 - 5; // Initial vertical speed
        this.gravity = 0.2 * gameSpeed;
        this.width = 75;
        this.height = 75;
        this.active = true;
        this.flashInterval = 200; // Time in ms between flashes
        this.lastFlashTime = Date.now();
        this.flashColors = ['rgba(255, 0, 0, 0.5)', 'rgba(255, 165, 0, 0.5)', 'rgba(255, 255, 0, 0.5)']; // Red, Orange, Yellow
        this.currentFlashColor = this.flashColors[0];
        this.colorIndex = 0; // Track which color to use
        this.isFlashing = false; // Toggle for flashing effect
        this.isExploding = false; // New property to track explosion state
        this.explosionTimer = 0; // Timer for explosion animation
    }

    draw() {
        if (this.isExploding) {
            // Draw explosion animation
            this.drawExplosion();
            return; // Don't draw the bomb when exploding
        }

        const currentTime = Date.now();

        // Toggle flashing effect
        if (currentTime - this.lastFlashTime > this.flashInterval) {
            this.isFlashing = !this.isFlashing;
            this.lastFlashTime = currentTime;

            // Change to the next color in the array
            this.colorIndex = (this.colorIndex + 1) % this.flashColors.length;
            this.currentFlashColor = this.flashColors[this.colorIndex];
        }

        // Draw the bomb
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);

        // Apply flashing color effect
        if (this.isFlashing) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = this.currentFlashColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    update() {
        if (this.isExploding) {
            this.explosionTimer += 1; // Increment the explosion timer

            if (this.explosionTimer > 20) { // Remove explosion after 20 frames
                this.active = false; 
            }
        } else {
            this.vy += this.gravity;
            this.y += this.vy;

            if (this.y - this.height > canvas.height) {
                this.active = false; // Deactivate if it falls off the screen
            }
        }
    }

    explode() {
        this.isExploding = true; // Trigger explosion
        this.active = false; // Deactivate bomb visually

                // Create beams at different angles
                const angles = [0, Math.PI / 4, -Math.PI / 4]; // Angles for the beams
                angles.forEach(angle => {
                    beams.push(new Beam(this.x + this.width / 2, this.y + this.height / 2, angle));
                });
    }

    drawExplosion() {
        const explosionRadius = 200 + (this.explosionTimer * 2); // Dynamic explosion radius

        // Draw a circle for explosion
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, explosionRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 140, 0, ${1 - this.explosionTimer / 20})`; // Fade out effect
        ctx.fill();
        ctx.closePath();
    }
    

    isSliced(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + this.width && mouseY >= this.y && mouseY <= this.y + this.height;
    }
    
}

class Beam {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = 0; // Initial length
        this.maxLength = 200; // Maximum length of the beam
        this.speed = 10; // Speed of the beam expansion
        this.active = true; // To track if the beam is still active
    }

    update() {
        if (this.length < this.maxLength) {
            this.length += this.speed; // Expand the beam
        } else {
            this.active = false; // Deactivate once it reaches max length
        }
    }

    draw(ctx) {
        if (this.active) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 5; // Thickness of the beam
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(this.angle) * this.length,
                this.y + Math.sin(this.angle) * this.length
            );
            ctx.stroke();
        }
    }
}

// Add Splatter Effect
function addSplatterEffect(x, y, color) {
    for (let i = 0; i < 5; i++) { // Create 5 small splatters per slice
        splatters.push({
            x: x + (Math.random() - 0.5) * 20, // Randomize position a bit
            y: y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            color: color,
            size: Math.random() * 10 + 5, // Randomize size a bit
            alpha: 1
        });
    }
}

// Activate Double Score Power-Up
function activateDoubleScore() {
    if (doubleScoreTimer) clearTimeout(doubleScoreTimer);
    isDoubleScoreActive = true;
    doubleScoreTimer = setTimeout(() => {
        isDoubleScoreActive = false;
    }, 10000); // 10 seconds
}

// Activate Slow Motion Power-Up
function activateSlowMotion() {
    if (slowMotionTimer) clearTimeout(slowMotionTimer);
    originalSpeed = gameSpeed;
    gameSpeed = gameSpeed* 0.5;
    isSlowMotionActive = true;
    slowMotionTimer = setTimeout(() => {
        gameSpeed = originalSpeed;
        isSlowMotionActive = false;
    }, 10000); // 10 seconds
}

// Handle Mouse Slicing
canvas.addEventListener('mousemove', function (event) {
    if (gameRunning) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        vegetables.forEach(veg => {
            if (!veg.sliced && veg.isSliced(mouseX, mouseY)) {
                veg.slice(mouseX, mouseY);
            }
        });

        powerUps.forEach(pu => {
            if (pu.active && pu.isSliced(mouseX, mouseY)) {
                pu.applyEffect();
            }
        });

        bombs.forEach((bomb, index) => {
            if (bomb.active && bomb.isSliced(mouseX, mouseY)) {
                bomb.explode(); // Trigger explosion instead of removing the bomb directly
                handleBombSliced(); // Call bomb sliced handler
                // bombs.splice(index, 1); // Removed for explosion handling
            }
        });
    }
});
// Generate Random Vegetable
function generateVegetable() {
    const index = Math.floor(Math.random() * loadedImages.length);
    const vegData = loadedImages[index];
    vegetables.push(new Vegetable(Math.random() * canvas.width, canvas.height, vegData.img, vegData.color));
}

// Generate Random Power-Up
function generatePowerUp() {
    const index = Math.floor(Math.random() * loadedPowerUpImages.length);
    const powerUpData = loadedPowerUpImages[index];
    powerUps.push(new PowerUp(Math.random() * canvas.width, canvas.height, powerUpData.type, powerUpData.img));
}

function generateBomb() {
    bombs.push(new Bomb(Math.random() * canvas.width, canvas.height));
}

// Draw the Combo Counter
function drawComboCounter() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "yellow"
    ctx.fillText("Combo: " + comboCounter, 10, 50);
}

// Draw the Max Combo Counter
function drawMaxComboCounter() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "orange";
    ctx.fillText("Max Combo: " + maxCombo, 10, 70);
}

// Draw the Score
function drawScore() {
    ctx.font = "20px Arial";
    ctx.fillStyle = "yellow";
    ctx.fillText("Score: " + score, 10, 30);
}

// Draw Power-Up Effects
function drawPowerUpEffects() {
    if (isDoubleScoreActive) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "blue";
        ctx.fillText("Double Score Active!", canvas.width / 2, 50);
    }

    if (isSlowMotionActive) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "purple";
        ctx.fillText("Slow Motion Active!", canvas.width / 2, 90);
    }
}

// Game Loop
// Add bomb generation in the game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate vegetables, power-ups, and bombs with random intervals
    if (Math.random() < 0.03 * gameSpeed) generateVegetable();
    if (Math.random() < 0.005 * gameSpeed) generatePowerUp(); // Less frequent for power-ups
    if (Math.random() < 0.01 * gameSpeed) generateBomb(); // Adjust frequency as needed

    vegetables.forEach((veg, index) => {
        veg.update();
        veg.draw();
        if (!veg.active) vegetables.splice(index, 1);
    });

    powerUps.forEach((pu, index) => {
        pu.update();
        pu.draw();
        if (!pu.active) powerUps.splice(index, 1);
    });

    bombs.forEach((bomb, index) => {
        bomb.update();
        bomb.draw();
        if (!bomb.active) bombs.splice(index, 1);
    });

    splatters.forEach((splatter, index) => {
        splatter.x += splatter.vx;
        splatter.y += splatter.vy;
        splatter.alpha -= 0.01;
        if (splatter.alpha <= 0) {
            splatters.splice(index, 1);
        } else {
            ctx.beginPath();
            ctx.arc(splatter.x, splatter.y, splatter.size, 0, Math.PI * 2);
            ctx.fillStyle = splatter.color.replace('0.6', splatter.alpha.toString());
            ctx.fill();
        }
    });

    drawScore();
    drawComboCounter();
    drawMaxComboCounter();
    drawPowerUpEffects();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Handle Mouse Slicing (Updated to handle bombs)
canvas.addEventListener('mousemove', function (event) {
    if (gameRunning) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        vegetables.forEach(veg => {
            if (!veg.sliced && veg.isSliced(mouseX, mouseY)) {
                veg.slice(mouseX, mouseY);
            }
        });

        powerUps.forEach(pu => {
            if (pu.active && pu.isSliced(mouseX, mouseY)) {
                pu.applyEffect();
            }
        });

        bombs.forEach((bomb, index) => {
            if (bomb.active && bomb.isSliced(mouseX, mouseY)) {
                bomb.active = false;
                handleBombSliced(); // Call bomb sliced handler
                bombs.splice(index, 1); // Remove bomb from array
            }
        });
    }
});

// Handle Bomb Sliced (Lose condition or penalty)
function handleBombSliced() {
    comboCounter = 0; // Reset combo
    score -= 50; // Penalty for slicing a bomb
    if (score < 0) score = 0; // Ensure score doesn't go negative
   // alert("Game Over")
}


// Start the Game
gameLoop();