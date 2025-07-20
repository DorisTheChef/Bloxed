// Game state
const game = {
    canvas: null,
    ctx: null,
    fred: null,
    trees: [],
    rivers: [],
    fish: [],
    berries: [],
    eggs: [],
    selectedObject: null,
    inventory: {
        wood: 0,
        fish: 0,
        food: 100,
        purpleBerries: 0,
        pinkBerries: 0,
        coins: 1
    },
    selectedTradeItem: null,
    house: null,
    insideHouse: false,
    insidePetHouse: false,
    currentPetHouse: null,
    lastClickTime: 0,
    lastClickedPetHouse: null,
    isDragging: false,
    draggedTree: null,
    dragStartX: 0,
    dragStartY: 0,
    mouseX: 0,
    mouseY: 0,
    closet: null,
    showColorPicker: false,
    pets: [],
    petHouses: [],
    availableColors: ['#8B4513', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'],
    gameMessage: "Welcome to the forest! Help Fred build his house!"
};

// Game objects
class Fred {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.selected = false;
        this.isMoving = false;
        this.targetX = x;
        this.targetY = y;
        this.speed = 2;
        this.shirtColor = '#8B4513'; // Default brown shirt
    }

    update() {
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.speed) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }

    draw(ctx) {
        // Draw Fred as a simple character (body/shirt)
        ctx.fillStyle = this.selected ? '#ff6b6b' : this.shirtColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Pants
        ctx.fillStyle = '#000080'; // Dark blue pants
        ctx.fillRect(this.x, this.y + 25, this.width, 15);
        
        // Head
        ctx.fillStyle = '#ffdbac';
        ctx.fillRect(this.x + 8, this.y - 15, 24, 20);
        
        // Selection indicator
        if (this.selected) {
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 5, this.y - 20, this.width + 10, this.height + 25);
        }
        
        // Label
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Fred', this.x + this.width/2, this.y - 25);
    }

    moveTo(x, y) {
        this.targetX = x - this.width/2;
        this.targetY = y - this.height/2;
        this.isMoving = true;
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y - 20 && y <= this.y + this.height;
    }

    isNear(object) {
        const distance = Math.sqrt(
            Math.pow(this.x + this.width/2 - (object.x + object.width/2), 2) +
            Math.pow(this.y + this.height/2 - (object.y + object.height/2), 2)
        );
        return distance < 60;
    }
}

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 50;
        this.chopped = false;
        this.regrowthTime = 0;
        this.maxRegrowthTime = 3600; // 1 minute at 60fps
    }

    update() {
        if (this.chopped && this.regrowthTime < this.maxRegrowthTime) {
            this.regrowthTime++;
            if (this.regrowthTime >= this.maxRegrowthTime) {
                this.chopped = false;
                this.regrowthTime = 0;
            }
        }
    }

    draw(ctx) {
        // Check if this tree is being dragged
        const isBeingDragged = game.isDragging && game.draggedTree === this;
        
        if (!this.chopped) {
            // Tree trunk
            ctx.fillStyle = isBeingDragged ? '#A0522D' : '#8B4513'; // Lighter brown when dragging
            ctx.fillRect(this.x + 10, this.y + 20, 10, 30);
            
            // Tree foliage
            ctx.fillStyle = isBeingDragged ? '#32CD32' : '#228B22'; // Brighter green when dragging
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 15, 20, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add drag indicator
            if (isBeingDragged) {
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(this.x + 15, this.y + 15, 25, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.setLineDash([]); // Reset line dash
            }
        } else {
            // Tree stump
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + 10, this.y + 35, 10, 15);
            
            // Show regrowth progress
            if (this.regrowthTime > 0) {
                const progress = this.regrowthTime / this.maxRegrowthTime;
                const foliageSize = progress * 20;
                
                if (foliageSize > 3) {
                    ctx.fillStyle = `rgba(34, 139, 34, ${progress})`;
                    ctx.beginPath();
                    ctx.arc(this.x + 15, this.y + 15, foliageSize, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }

    isClicked(x, y) {
        return !this.chopped && x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }
}

class River {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some water effect
        ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(this.x + i * 20, this.y + Math.sin(Date.now() * 0.005 + i) * 5, 15, 3);
        }
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }
}

class Berry {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.type = type; // 'purple' or 'pink'
        this.collected = false;
        this.regrowthTime = 0;
        this.maxRegrowthTime = 1800; // 30 seconds at 60fps
    }

    update() {
        if (this.collected && this.regrowthTime < this.maxRegrowthTime) {
            this.regrowthTime++;
            if (this.regrowthTime >= this.maxRegrowthTime) {
                this.collected = false;
                this.regrowthTime = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.collected) {
            ctx.fillStyle = this.type === 'purple' ? '#800080' : '#FFC0CB';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Small highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2 - 2, this.y + this.height/2 - 2, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    isClicked(x, y) {
        return !this.collected && x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }
}

class Egg {
    constructor(x, y, riverId) {
        this.x = x;
        this.y = y;
        this.riverId = riverId;
        this.width = 8;
        this.height = 8;
        this.hatchTime = 0;
        this.maxHatchTime = 180; // 3 seconds at 60fps
    }

    update() {
        this.hatchTime++;
        return this.hatchTime >= this.maxHatchTime;
    }

    draw(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

class Closet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
    }

    draw(ctx) {
        // Closet body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Closet doors
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 5, this.y + 5, 25, this.height - 10);
        ctx.fillRect(this.x + 30, this.y + 5, 25, this.height - 10);
        
        // Door handles
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y + this.height/2, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 35, this.y + this.height/2, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Closet', this.x + this.width/2, this.y - 5);
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }
}

class FoodBag {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.selected = false;
    }

    draw(ctx) {
        // Food bag
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Bag opening
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 5, this.y, this.width - 10, 15);
        
        // Food spilling out
        ctx.fillStyle = '#DEB887';
        for (let i = 0; i < 8; i++) {
            const dotX = this.x + 8 + (i % 3) * 8;
            const dotY = this.y + 12 + Math.floor(i / 3) * 6;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Selection indicator
        if (this.selected) {
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
        }
        
        // Label
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pet Food', this.x + this.width/2, this.y - 5);
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }
}

class FoodBowl {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 15;
        this.hasFood = false;
        this.foodAmount = 0;
    }

    draw(ctx) {
        // Bowl
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Bowl rim
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Food in bowl
        if (this.hasFood && this.foodAmount > 0) {
            ctx.fillStyle = '#DEB887';
            const foodSize = Math.min(this.foodAmount / 10, 1) * 0.7; // Scale food size
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/2, 
                       this.width/2 * foodSize, this.height/2 * foodSize, 0, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Label
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Food Bowl', this.x + this.width/2, this.y - 5);
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }

    addFood() {
        this.hasFood = true;
        this.foodAmount = 10; // Full bowl
    }

    eatFood() {
        if (this.foodAmount > 0) {
            this.foodAmount--;
            if (this.foodAmount <= 0) {
                this.hasFood = false;
            }
            return true;
        }
        return false;
    }
}

class PetBed {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 20;
        this.occupiedBy = null; // Pet currently sleeping in this bed
    }

    draw(ctx) {
        // Bed frame
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Bed mattress
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        
        // Pillow
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x + this.width - 12, this.y + 3, 8, 6);
        
        // Label
        ctx.fillStyle = '#000';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pet Bed', this.x + this.width/2, this.y - 3);
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }

    isOccupied() {
        return this.occupiedBy !== null;
    }
}

class PetHouse {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 40;
        this.petsInside = []; // Each pet house tracks its own pets
        this.foodBag = new FoodBag(150, 200);
        this.foodBowl = new FoodBowl(400, 300);
        this.beds = []; // Pet beds in this house (max 4)
    }

    draw(ctx) {
        // Pet house base
        ctx.fillStyle = '#CD853F'; // Tan color
        ctx.fillRect(this.x, this.y + 15, this.width, this.height - 15);
        
        // Roof
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 15);
        ctx.lineTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width + 5, this.y + 15);
        ctx.closePath();
        ctx.fill();
        
        // Door opening
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 15, this.y + 30, 20, 15);
        
        // "Pet House" label
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pet House', this.x + this.width/2, this.y - 5);
        
        // Show pet indicators when pets are inside
        if (this.petsInside.length > 0) {
            ctx.fillStyle = '#FFD700';
            for (let i = 0; i < this.petsInside.length; i++) {
                const pet = this.petsInside[i];
                let emoji = '🐾';
                if (pet.type === 'dog') emoji = '🐕';
                else if (pet.type === 'cat') emoji = '🐱';
                else if (pet.type === 'bird') emoji = '🐦';
                else if (pet.type === 'rabbit') emoji = '🐰';
                
                ctx.font = '10px Arial';
                // Arrange pets in a 2x2 grid inside the house
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = this.x + 10 + col * 15;
                const y = this.y + 20 + row * 12;
                ctx.fillText(emoji, x, y);
            }
        }
        
        // Click hint based on current state
        const availablePets = game.pets.filter(pet => !pet.inPetHouse);
        if (this.petsInside.length > 0) {
            // Pets are inside, show options
            ctx.fillStyle = '#FFD700';
            ctx.font = '7px Arial';
            ctx.fillText('Click: release pets', this.x + this.width/2, this.y + this.height + 8);
            ctx.fillText('Double-click: enter & feed', this.x + this.width/2, this.y + this.height + 18);
        } else if (availablePets.length > 0) {
            // Pets available to house
            ctx.fillStyle = '#FFD700';
            ctx.font = '8px Arial';
            ctx.fillText('Click to house pets', this.x + this.width/2, this.y + this.height + 10);
        }
        
        // Show capacity info
        if (this.petsInside.length < 4 || availablePets.length > 0) {
            ctx.fillStyle = '#666';
            ctx.font = '6px Arial';
            ctx.fillText(`${this.petsInside.length}/4 pets`, this.x + this.width/2, this.y + this.height + 28);
        }
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }
}

class Pet {
    constructor(x, y, type, name) {
        this.x = x;
        this.y = y;
        this.type = type; // 'dog', 'cat', 'bird', or 'rabbit'
        this.name = name;
        this.width = 30;
        this.height = 25;
        this.direction = Math.random() * 2 * Math.PI;
        this.speed = 0.3;
        this.idleTime = 0;
        this.inPetHouse = false;
        this.isSleeping = false;
        this.sleepTimer = 0;
        this.sleepDuration = 600; // 10 seconds at 60fps
        this.bedTarget = null;
        this.zzzOpacity = 1;
        this.zzzTimer = 0;
    }

    update() {
        if (this.inPetHouse) {
            // Pets in pet house stay near their assigned pet house
            const myPetHouse = game.petHouses.find(house => house.petsInside.includes(this));
            if (myPetHouse) {
                // Check if we're viewing the inside of this pet house
                if (game.insidePetHouse && game.currentPetHouse === myPetHouse) {
                    // Pet behavior inside the pet house
                    this.idleTime++;
                    
                    if (this.isSleeping) {
                        // Sleeping behavior
                        this.sleepTimer++;
                        this.zzzTimer++;
                        
                        // Animate ZZZ opacity
                        this.zzzOpacity = 0.5 + 0.5 * Math.sin(this.zzzTimer * 0.1);
                        
                        if (this.sleepTimer >= this.sleepDuration) {
                            // Wake up naturally
                            this.wakeUp();
                        }
                    } else {
                        // Awake behavior
                        // Check if there's food and pet is hungry
                        if (myPetHouse.foodBowl.hasFood && this.idleTime > 60) {
                            // Move towards food bowl
                            const bowlCenterX = myPetHouse.foodBowl.x + myPetHouse.foodBowl.width / 2;
                            const bowlCenterY = myPetHouse.foodBowl.y + myPetHouse.foodBowl.height / 2;
                            
                            const dx = bowlCenterX - (this.x + this.width / 2);
                            const dy = bowlCenterY - (this.y + this.height / 2);
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance > 20) {
                                // Move towards bowl
                                this.x += (dx / distance) * 0.8;
                                this.y += (dy / distance) * 0.8;
                            } else if (Math.random() < 0.05) { // 5% chance per frame to eat
                                // Eat food
                                if (myPetHouse.foodBowl.eatFood()) {
                                    this.idleTime = 0; // Reset idle time after eating
                                }
                            }
                        } else if (this.bedTarget) {
                            // Moving to bed
                            const bedCenterX = this.bedTarget.x + this.bedTarget.width / 2;
                            const bedCenterY = this.bedTarget.y + this.bedTarget.height / 2;
                            
                            const dx = bedCenterX - (this.x + this.width / 2);
                            const dy = bedCenterY - (this.y + this.height / 2);
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < 15) {
                                // Reached bed, start sleeping
                                this.x = this.bedTarget.x + 5;
                                this.y = this.bedTarget.y + 2;
                                this.isSleeping = true;
                                this.sleepTimer = 0;
                                this.bedTarget.occupiedBy = this;
                                this.bedTarget = null;
                            } else {
                                // Move towards bed
                                this.x += (dx / distance) * 0.5;
                                this.y += (dy / distance) * 0.5;
                            }
                        } else {
                            // Check if pet wants to sleep (random chance)
                            if (Math.random() < 0.001 && myPetHouse.beds.length > 0) { // 0.1% chance per frame
                                const availableBeds = myPetHouse.beds.filter(bed => !bed.isOccupied());
                                if (availableBeds.length > 0) {
                                    this.bedTarget = availableBeds[Math.floor(Math.random() * availableBeds.length)];
                                }
                            }
                            
                            // Random movement inside pet house
                            if (this.idleTime > 120) {
                                this.direction = Math.random() * 2 * Math.PI;
                                this.idleTime = 0;
                            }
                            
                            this.x += Math.cos(this.direction) * 0.3;
                            this.y += Math.sin(this.direction) * 0.3;
                            
                            // Keep pets inside pet house interior bounds
                            this.x = Math.max(50, Math.min(game.canvas.width - 50 - this.width, this.x));
                            this.y = Math.max(100, Math.min(game.canvas.height - 50 - this.height, this.y));
                        }
                    }
                } else {
                    // Pet house exterior behavior (hidden)
                    const houseX = myPetHouse.x + myPetHouse.width / 2;
                    const houseY = myPetHouse.y + myPetHouse.height / 2;
                    
                    // Small random movement around pet house
                    this.idleTime++;
                    if (this.idleTime > 180) { // 3 seconds
                        this.direction = Math.random() * 2 * Math.PI;
                        this.idleTime = 0;
                    }
                    
                    this.x += Math.cos(this.direction) * 0.2;
                    this.y += Math.sin(this.direction) * 0.2;
                    
                    // Keep pets near their pet house
                    this.x = Math.max(houseX - 40, Math.min(houseX + 40, this.x));
                    this.y = Math.max(houseY - 30, Math.min(houseY + 30, this.y));
                }
            }
        } else if (game.insideHouse) {
            // Simple pet movement inside main house
            this.idleTime++;
            
            // Change direction occasionally
            if (this.idleTime > 120) { // 2 seconds
                this.direction = Math.random() * 2 * Math.PI;
                this.idleTime = 0;
            }
            
            // Move slowly
            this.x += Math.cos(this.direction) * this.speed;
            this.y += Math.sin(this.direction) * this.speed;
            
            // Keep pets inside house area
            this.x = Math.max(50, Math.min(game.canvas.width - 80, this.x));
            this.y = Math.max(100, Math.min(game.canvas.height - 100, this.y));
        } else {
            // Follow Fred when outside
            const fredCenterX = game.fred.x + game.fred.width / 2;
            const fredCenterY = game.fred.y + game.fred.height / 2;
            const petCenterX = this.x + this.width / 2;
            const petCenterY = this.y + this.height / 2;
            
            const dx = fredCenterX - petCenterX;
            const dy = fredCenterY - petCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Follow Fred if he's far enough away (but not too close)
            if (distance > 60) {
                const followSpeed = 1.5; // Faster than indoor movement
                this.x += (dx / distance) * followSpeed;
                this.y += (dy / distance) * followSpeed;
            } else if (distance > 30) {
                // Slower following when close
                const followSpeed = 0.5;
                this.x += (dx / distance) * followSpeed;
                this.y += (dy / distance) * followSpeed;
            }
            
            // Keep pets within canvas bounds
            this.x = Math.max(0, Math.min(game.canvas.width - this.width, this.x));
            this.y = Math.max(0, Math.min(game.canvas.height - this.height, this.y));
        }
    }

    wakeUp() {
        this.isSleeping = false;
        this.sleepTimer = 0;
        this.zzzTimer = 0;
        
        // Free up the bed
        if (this.bedTarget) {
            this.bedTarget.occupiedBy = null;
            this.bedTarget = null;
        }
        
        // Find the bed this pet was sleeping in and free it
        const myPetHouse = game.petHouses.find(house => house.petsInside.includes(this));
        if (myPetHouse) {
            myPetHouse.beds.forEach(bed => {
                if (bed.occupiedBy === this) {
                    bed.occupiedBy = null;
                }
            });
        }
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }

    draw(ctx) {
        if (this.type === 'dog') {
            // Draw dog
            ctx.fillStyle = '#8B4513'; // Brown body
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Dog head
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(this.x + 5, this.y - 10, 20, 15);
            
            // Dog ears
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + 3, this.y - 8, 6, 8);
            ctx.fillRect(this.x + 21, this.y - 8, 6, 8);
            
            // Dog tail
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y + 5);
            ctx.lineTo(this.x + this.width + 8, this.y - 5);
            ctx.stroke();
            
        } else if (this.type === 'cat') {
            // Draw cat
            ctx.fillStyle = '#696969'; // Gray body
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Cat head
            ctx.fillStyle = '#808080';
            ctx.fillRect(this.x + 5, this.y - 10, 20, 15);
            
            // Cat ears (triangular)
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.moveTo(this.x + 8, this.y - 10);
            ctx.lineTo(this.x + 12, this.y - 18);
            ctx.lineTo(this.x + 16, this.y - 10);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 18, this.y - 10);
            ctx.lineTo(this.x + 22, this.y - 18);
            ctx.lineTo(this.x + 26, this.y - 10);
            ctx.fill();
            
            // Cat tail (curved)
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y + 10);
            ctx.quadraticCurveTo(this.x + this.width + 10, this.y - 5, this.x + this.width + 5, this.y + 15);
            ctx.stroke();
            
        } else if (this.type === 'bird') {
            // Draw bird
            ctx.fillStyle = '#FFD700'; // Yellow body
            ctx.beginPath();
            ctx.ellipse(this.x + this.width/2, this.y + this.height/2, this.width/2, this.height/2, 0, 0, 2 * Math.PI);
            ctx.fill();
            
            // Bird head
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + 8, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            // Bird beak
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2 + 8, this.y + 8);
            ctx.lineTo(this.x + this.width/2 + 15, this.y + 8);
            ctx.lineTo(this.x + this.width/2 + 8, this.y + 12);
            ctx.closePath();
            ctx.fill();
            
            // Bird wings
            ctx.fillStyle = '#FFB347';
            ctx.beginPath();
            ctx.ellipse(this.x + 8, this.y + 15, 8, 4, -0.3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + 22, this.y + 15, 8, 4, 0.3, 0, 2 * Math.PI);
            ctx.fill();
            
        } else if (this.type === 'rabbit') {
            // Draw rabbit
            ctx.fillStyle = '#F5F5DC'; // Beige body
            ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
            
            // Rabbit head
            ctx.fillStyle = '#FFFAF0';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + 8, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            // Rabbit ears
            ctx.fillStyle = '#F5F5DC';
            ctx.beginPath();
            ctx.ellipse(this.x + 8, this.y - 5, 4, 12, -0.2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + 22, this.y - 5, 4, 12, 0.2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Inner ears
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.ellipse(this.x + 8, this.y - 5, 2, 8, -0.2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + 22, this.y - 5, 2, 8, 0.2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Rabbit tail
            ctx.fillStyle = '#FFFAF0';
            ctx.beginPath();
            ctx.arc(this.x + this.width - 2, this.y + this.height/2, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Draw name
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width/2, this.y - 20);
        
        // Draw ZZZ if sleeping
        if (this.isSleeping) {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.zzzOpacity})`;
            ctx.font = '14px Arial';
            ctx.fillText('Z', this.x + this.width/2 - 5, this.y - 30);
            ctx.font = '12px Arial';
            ctx.fillText('Z', this.x + this.width/2, this.y - 40);
            ctx.font = '10px Arial';
            ctx.fillText('Z', this.x + this.width/2 + 5, this.y - 50);
        }
    }
}

class Fish {
    constructor(x, y, riverId) {
        this.x = x;
        this.y = y;
        this.riverId = riverId;
        this.caught = false;
        this.direction = Math.random() * 2 * Math.PI;
        this.speed = 0.5;
        this.size = 8;
    }

    update() {
        if (!this.caught) {
            // Simple fish movement
            this.x += Math.cos(this.direction) * this.speed;
            this.y += Math.sin(this.direction) * this.speed;
            
            // Change direction occasionally
            if (Math.random() < 0.02) {
                this.direction = Math.random() * 2 * Math.PI;
            }
            
            // Keep fish in river bounds
            const river = game.rivers[this.riverId];
            if (this.x < river.x || this.x > river.x + river.width) {
                this.direction = Math.PI - this.direction;
            }
            if (this.y < river.y || this.y > river.y + river.height) {
                this.direction = -this.direction;
            }
            
            this.x = Math.max(river.x, Math.min(river.x + river.width, this.x));
            this.y = Math.max(river.y, Math.min(river.y + river.height, this.y));
        }
    }

    draw(ctx) {
        if (!this.caught) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size/2, this.direction, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

class House {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 80;
        this.height = 60;
    }

    draw(ctx) {
        // House base
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(this.x, this.y + 20, this.width, this.height - 20);
        
        // Roof
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y + 20);
        ctx.lineTo(this.x + this.width/2, this.y);
        ctx.lineTo(this.x + this.width + 10, this.y + 20);
        ctx.closePath();
        ctx.fill();
        
        // Door
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 30, this.y + 40, 20, 20);
        
        // Windows
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(this.x + 10, this.y + 35, 15, 15);
        ctx.fillRect(this.x + 55, this.y + 35, 15, 15);
        
        // Click hint
        if (game.fred && game.fred.isNear(this)) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click to Enter', this.x + this.width/2, this.y - 5);
        }
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.width && 
               y >= this.y && y <= this.y + this.height;
    }
}

// Initialize game
function initGame() {
    game.canvas = document.getElementById('game-canvas');
    game.ctx = game.canvas.getContext('2d');
    
    // Create Fred
    game.fred = new Fred(100, 300);
    
    // Create trees
    for (let i = 0; i < 15; i++) {
        game.trees.push(new Tree(
            Math.random() * 700 + 50,
            Math.random() * 400 + 50
        ));
    }
    
    // Create rivers
    game.rivers.push(new River(200, 450, 400, 100));
    game.rivers.push(new River(650, 200, 100, 200));
    
    // Create fish
    game.rivers.forEach((river, index) => {
        for (let i = 0; i < 8; i++) {
            game.fish.push(new Fish(
                river.x + Math.random() * river.width,
                river.y + Math.random() * river.height,
                index
            ));
        }
    });
    
    // Create berries
    for (let i = 0; i < 20; i++) {
        const type = Math.random() < 0.5 ? 'purple' : 'pink';
        game.berries.push(new Berry(
            Math.random() * 750 + 25,
            Math.random() * 450 + 25,
            type
        ));
    }
    
    // Create closet (will be used when inside house)
    game.closet = new Closet(350, 200);
    
    // Set up event listeners
    game.canvas.addEventListener('click', handleClick);
    game.canvas.addEventListener('mousedown', handleMouseDown);
    game.canvas.addEventListener('mousemove', handleMouseMove);
    game.canvas.addEventListener('mouseup', handleMouseUp);
    document.getElementById('chop-btn').addEventListener('click', chopTree);
    document.getElementById('fish-btn').addEventListener('click', catchFish);
    document.getElementById('collect-btn').addEventListener('click', collectBerries);
    document.getElementById('eat-btn').addEventListener('click', eatFish);
    document.getElementById('trade-btn').addEventListener('click', tradeItem);
    document.getElementById('build-btn').addEventListener('click', buildHouse);
    document.getElementById('build-pethouse-btn').addEventListener('click', buildPetHouse);
    
    // Set up inventory item click listeners
    setupInventoryListeners();
    
    // Start game loop
    gameLoop();
}

function getMousePos(event) {
    const rect = game.canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function handleMouseDown(event) {
    const pos = getMousePos(event);
    
    // Only allow tree dragging when outside and Fred is selected
    if (!game.insideHouse && !game.insidePetHouse && game.fred.selected) {
        // Check if clicking on a tree
        for (let tree of game.trees) {
            if (tree.isClicked(pos.x, pos.y) && !tree.chopped) {
                game.isDragging = true;
                game.draggedTree = tree;
                game.dragStartX = pos.x;
                game.dragStartY = pos.y;
                event.preventDefault(); // Prevent normal click behavior
                return;
            }
        }
    }
}

function handleMouseMove(event) {
    const pos = getMousePos(event);
    game.mouseX = pos.x;
    game.mouseY = pos.y;
    
    if (game.isDragging && game.draggedTree) {
        // Update tree position during drag
        game.draggedTree.x = pos.x - game.draggedTree.width/2;
        game.draggedTree.y = pos.y - game.draggedTree.height/2;
        
        // Keep tree within canvas bounds
        game.draggedTree.x = Math.max(0, Math.min(game.canvas.width - game.draggedTree.width, game.draggedTree.x));
        game.draggedTree.y = Math.max(0, Math.min(game.canvas.height - game.draggedTree.height, game.draggedTree.y));
    }
}

function handleMouseUp(event) {
    if (game.isDragging && game.draggedTree) {
        const pos = getMousePos(event);
        
        // Check if dragged a reasonable distance (to distinguish from clicks)
        const dragDistance = Math.sqrt(
            Math.pow(pos.x - game.dragStartX, 2) + 
            Math.pow(pos.y - game.dragStartY, 2)
        );
        
        if (dragDistance > 10) {
            // Successful replant
            updateMessage(`Replanted tree at new location! 🌲`);
        }
        
        game.isDragging = false;
        game.draggedTree = null;
    }
}

function handleClick(event) {
    // Skip click handling if we just finished dragging
    if (game.isDragging) {
        return;
    }
    
    const rect = game.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Handle color picker clicks
    if (game.showColorPicker) {
        const colorIndex = Math.floor((x - 250) / 60);
        if (colorIndex >= 0 && colorIndex < game.availableColors.length && y >= 250 && y <= 300) {
            game.fred.shirtColor = game.availableColors[colorIndex];
            game.showColorPicker = false;
            updateMessage(`Fred's shirt is now ${game.availableColors[colorIndex]}!`);
            return;
        }
        // Click outside color picker to close
        game.showColorPicker = false;
        return;
    }
    
    // Handle inside main house interactions
    if (game.insideHouse) {
        // Check for pet purchase button clicks
        const petButtonClicked = isPetButtonClicked(x, y);
        if (petButtonClicked) {
            purchasePet(petButtonClicked);
            return;
        }
        
        // Click on closet
        if (game.closet.isClicked(x, y)) {
            game.showColorPicker = true;
            updateMessage("Choose a color for Fred's shirt!");
            return;
        }
        
        // Exit house (click anywhere else)
        if (!game.closet.isClicked(x, y)) {
            game.insideHouse = false;
            game.fred.x = game.house.x + 10;
            game.fred.y = game.house.y + 30;
            updateMessage("Exited the house!");
            return;
        }
        return;
    }
    
    // Handle inside pet house interactions
    if (game.insidePetHouse) {
        const petHouse = game.currentPetHouse;
        
        // Click on sleeping pets to wake them up
        for (let pet of petHouse.petsInside) {
            if (pet.isSleeping && pet.isClicked(x, y)) {
                pet.wakeUp();
                updateMessage(`Woke up ${pet.name}! 😴`);
                return;
            }
        }
        
        // Click on food bag
        if (petHouse.foodBag.isClicked(x, y)) {
            petHouse.foodBag.selected = !petHouse.foodBag.selected;
            if (petHouse.foodBag.selected) {
                updateMessage("Selected pet food! Now click on the bowl to fill it.");
            } else {
                updateMessage("Deselected pet food.");
            }
            return;
        }
        
        // Click on food bowl
        if (petHouse.foodBowl.isClicked(x, y)) {
            if (petHouse.foodBag.selected) {
                petHouse.foodBowl.addFood();
                petHouse.foodBag.selected = false;
                updateMessage("Filled the food bowl! Watch your pets come to eat! 🍽️");
            } else {
                updateMessage("Select the food bag first, then click the bowl to fill it!");
            }
            return;
        }
        
        // Click on bed building button
        if (isBedButtonClicked(x, y, petHouse)) {
            buildPetBed(petHouse);
            return;
        }
        
        // Exit pet house (click anywhere else)
        game.insidePetHouse = false;
        game.currentPetHouse = null;
        game.fred.x = petHouse.x + 10;
        game.fred.y = petHouse.y + petHouse.height + 20;
        updateMessage("Exited the pet house!");
        return;
    }
    
    // Check if Fred is clicked
    if (game.fred.isClicked(x, y)) {
        game.fred.selected = !game.fred.selected;
        game.selectedObject = game.fred.selected ? 'fred' : null;
        updateActionButtons();
        updateMessage("Fred selected! Click on trees to chop or rivers to fish!");
        return;
    }
    
    // If Fred is selected, move him or interact with objects
    if (game.fred.selected) {
        // Check for house interaction
        if (game.house && game.house.isClicked(x, y) && game.fred.isNear(game.house)) {
            game.insideHouse = true;
            game.fred.x = 400;
            game.fred.y = 300;
            game.fred.selected = false;
            game.selectedObject = null;
            updateMessage("Entered the house! Click on the closet to change clothes, or click anywhere else to exit.");
            return;
        }
        
        // Check for pet house interactions
        for (let petHouse of game.petHouses) {
            if (petHouse.isClicked(x, y)) {
                const currentTime = Date.now();
                
                // Check for double-click (within 500ms of last click on same pet house)
                if (game.lastClickedPetHouse === petHouse && currentTime - game.lastClickTime < 500) {
                    // Double-click: Enter pet house
                    game.insidePetHouse = true;
                    game.currentPetHouse = petHouse;
                    game.fred.x = 300;
                    game.fred.y = 400;
                    updateMessage("Entered the pet house! Click food bag then bowl to feed pets, or click anywhere to exit.");
                } else {
                    // Single-click: House/release pets
                    housePets(petHouse);
                }
                
                game.lastClickTime = currentTime;
                game.lastClickedPetHouse = petHouse;
                return;
            }
        }
        
        // Check for berry interaction
        for (let berry of game.berries) {
            if (berry.isClicked(x, y)) {
                game.fred.moveTo(berry.x, berry.y);
                game.selectedObject = berry;
                updateActionButtons();
                updateMessage("Move to berry to collect it!");
                return;
            }
        }
        
        // Check for tree interaction
        for (let tree of game.trees) {
            if (tree.isClicked(x, y) && !tree.chopped) {
                game.fred.moveTo(tree.x, tree.y);
                game.selectedObject = tree;
                updateActionButtons();
                updateMessage("Move to tree to chop it, or drag it to replant!");
                return;
            }
        }
        
        // Check for river interaction
        for (let river of game.rivers) {
            if (river.isClicked(x, y)) {
                game.fred.moveTo(x, y);
                game.selectedObject = river;
                updateActionButtons();
                updateMessage("Move to river to fish!");
                return;
            }
        }
        
        // Just move Fred
        game.fred.moveTo(x, y);
        game.selectedObject = null;
        updateActionButtons();
    }
}

function chopTree() {
    if (game.selectedObject instanceof Tree && game.fred.isNear(game.selectedObject)) {
        game.selectedObject.chopped = true;
        game.inventory.wood++;
        game.inventory.food -= 10;
        updateInventoryDisplay();
        updateActionButtons();
        updateMessage("Chopped a tree! Got 1 wood. Energy decreased by 10.");
        
        if (game.inventory.wood >= 10) {
            updateMessage("You have enough wood to build a house!");
        }
    }
}

function catchFish() {
    if (game.selectedObject instanceof River) {
        // Find fish in this river
        const riverFish = game.fish.filter(fish => 
            !fish.caught && game.rivers[fish.riverId] === game.selectedObject &&
            game.fred.isNear({x: fish.x, y: fish.y, width: 10, height: 10})
        );
        
        if (riverFish.length > 0) {
            const caughtFish = riverFish[0];
            caughtFish.caught = true;
            game.inventory.fish++;
            game.inventory.food -= 5;
            
            // Spawn an egg where the fish was caught
            game.eggs.push(new Egg(caughtFish.x, caughtFish.y, caughtFish.riverId));
            
            updateInventoryDisplay();
            updateMessage("Caught a fish! Energy decreased by 5. The fish laid an egg!");
        } else {
            updateMessage("No fish nearby! Get closer to the fish in the river.");
        }
    }
}

function collectBerries() {
    // Check if we have a selected berry and Fred is near it
    if (game.selectedObject instanceof Berry && game.fred.isNear(game.selectedObject) && !game.selectedObject.collected) {
        const berry = game.selectedObject;
        berry.collected = true;
        if (berry.type === 'purple') {
            game.inventory.purpleBerries++;
        } else {
            game.inventory.pinkBerries++;
        }
        game.inventory.food += 5;
        updateInventoryDisplay();
        updateActionButtons();
        updateMessage(`Collected a ${berry.type} berry! Food increased by 5.`);
        return;
    }
    
    // Fallback: check for any nearby berries
    const nearbyBerries = game.berries.filter(berry => 
        !berry.collected && game.fred.isNear(berry)
    );
    
    if (nearbyBerries.length > 0) {
        const berry = nearbyBerries[0];
        berry.collected = true;
        if (berry.type === 'purple') {
            game.inventory.purpleBerries++;
        } else {
            game.inventory.pinkBerries++;
        }
        game.inventory.food += 5;
        updateInventoryDisplay();
        updateMessage(`Collected a ${berry.type} berry! Food increased by 5.`);
    } else {
        updateMessage("No berries nearby! Get closer to berries to collect them.");
    }
}

function eatFish() {
    if (game.inventory.fish > 0) {
        game.inventory.fish--;
        game.inventory.food = Math.min(100, game.inventory.food + 30);
        updateInventoryDisplay();
        updateMessage("Ate a fish! Energy restored by 30.");
    } else {
        updateMessage("No fish to eat! Catch some fish first.");
    }
}

function buildHouse() {
    if (game.inventory.wood >= 10 && !game.house) {
        game.inventory.wood -= 10;
        game.house = new House(350, 250);
        updateInventoryDisplay();
        updateActionButtons();
        updateMessage("Congratulations! Fred built his house! 🎉");
    }
}

function buildPetHouse() {
    if (game.inventory.wood >= 5 && game.house) {
        game.inventory.wood -= 5;
        
        // Position new pet house in a spiral pattern around the main house
        const houseCount = game.petHouses.length;
        let petHouseX, petHouseY;
        
        if (houseCount === 0) {
            // First pet house goes to the right of main house
            petHouseX = game.house.x + 100;
            petHouseY = game.house.y + 10;
        } else {
            // Arrange pet houses in rows next to each other
            const housesPerRow = 4;
            const row = Math.floor(houseCount / housesPerRow);
            const col = houseCount % housesPerRow;
            
            petHouseX = game.house.x + 100 + (col * 60); // 60 pixels apart horizontally
            petHouseY = game.house.y + 10 + (row * 50); // 50 pixels apart vertically
            
            // Keep within canvas bounds
            petHouseX = Math.max(10, Math.min(game.canvas.width - 60, petHouseX));
            petHouseY = Math.max(10, Math.min(game.canvas.height - 50, petHouseY));
        }
        
        const newPetHouse = new PetHouse(petHouseX, petHouseY);
        game.petHouses.push(newPetHouse);
        
        updateInventoryDisplay();
        updateActionButtons();
        updateMessage(`Built pet house #${game.petHouses.length}! Click on it to house your pets! 🏠`);
    } else if (!game.house) {
        updateMessage("Build your main house first before building a pet house!");
    }
}

function housePets(petHouse) {
    // Check if pets are currently in this house - if so, release them
    if (petHouse.petsInside.length > 0) {
        // Check if any pets are sleeping
        const sleepingPets = petHouse.petsInside.filter(pet => pet.isSleeping);
        if (sleepingPets.length > 0) {
            const sleepingNames = sleepingPets.map(pet => pet.name).join(', ');
            updateMessage(`Cannot remove pets while ${sleepingNames} are sleeping! Wake them up first.`);
            return;
        }
        
        // Release all pets from this house
        const releasedPets = [...petHouse.petsInside];
        
        releasedPets.forEach(pet => {
            pet.inPetHouse = false;
            pet.wakeUp(); // Ensure pets are properly awoken
            // Position pets near the pet house when released
            pet.x = petHouse.x + Math.random() * 60 - 10;
            pet.y = petHouse.y + petHouse.height + 10 + Math.random() * 20;
        });
        
        // Clear this house's pets array
        petHouse.petsInside = [];
        
        const petNames = releasedPets.map(pet => pet.name).join(' and ');
        updateMessage(`${petNames} came out of the pet house! They'll follow you again! 🐾`);
        return;
    }
    
    // Otherwise, house available pets
    const availablePets = game.pets.filter(pet => !pet.inPetHouse);
    
    if (availablePets.length === 0) {
        updateMessage("No pets available to house! Buy some pets first.");
        return;
    }
    
    // House up to 4 pets of any type
    let petsToHouse = [];
    
    // Calculate how many more pets can fit
    const availableSpace = 4 - petHouse.petsInside.length;
    
    // Take pets up to available space
    petsToHouse = availablePets.slice(0, availableSpace);
    
    petsToHouse.forEach(pet => {
        pet.inPetHouse = true;
        // Position pets inside the house (they'll be hidden from view)
        pet.x = petHouse.x + 10 + Math.random() * 30;
        pet.y = petHouse.y + 15 + Math.random() * 20;
        petHouse.petsInside.push(pet);
    });
    
    const houseNumber = game.petHouses.indexOf(petHouse) + 1;
    const petNames = petsToHouse.map(pet => pet.name).join(' and ');
    updateMessage(`${petNames} went into pet house #${houseNumber}! Click again to release them. 🏠`);
}

function setupInventoryListeners() {
    // Add click listeners to tradeable inventory items
    const tradeableItems = ['wood', 'fish', 'purpleBerries', 'pinkBerries'];
    
    tradeableItems.forEach(item => {
        const countElement = document.getElementById(`${item === 'purpleBerries' ? 'purple-berries' : item === 'pinkBerries' ? 'pink-berries' : item}-count`);
        if (countElement) {
            const inventoryItem = countElement.parentElement;
            inventoryItem.addEventListener('click', () => selectTradeItem(item));
        }
    });
}

function selectTradeItem(itemType) {
    // Only allow selection if the item quantity is > 0
    const itemCount = game.inventory[itemType];
    if (itemCount > 0) {
        // Toggle selection
        if (game.selectedTradeItem === itemType) {
            game.selectedTradeItem = null;
            updateMessage("Trade item deselected.");
        } else {
            game.selectedTradeItem = itemType;
            const itemName = itemType === 'purpleBerries' ? 'Purple Berry' : 
                           itemType === 'pinkBerries' ? 'Pink Berry' : 
                           itemType.charAt(0).toUpperCase() + itemType.slice(1);
            updateMessage(`Selected ${itemName} for trading. Click Trade Item button to exchange for 1 coin.`);
        }
        updateInventoryDisplay();
        updateActionButtons();
    } else {
        updateMessage(`You don't have any ${itemType} to trade!`);
    }
}

function tradeItem() {
    if (game.selectedTradeItem && game.inventory[game.selectedTradeItem] > 0) {
        // Perform the trade
        game.inventory[game.selectedTradeItem]--;
        game.inventory.coins++;
        
        const itemName = game.selectedTradeItem === 'purpleBerries' ? 'Purple Berry' : 
                        game.selectedTradeItem === 'pinkBerries' ? 'Pink Berry' : 
                        game.selectedTradeItem.charAt(0).toUpperCase() + game.selectedTradeItem.slice(1);
        
        updateMessage(`Traded 1 ${itemName} for 1 coin! 💰`);
        
        // Clear selection if item count reaches 0
        if (game.inventory[game.selectedTradeItem] === 0) {
            game.selectedTradeItem = null;
        }
        
        updateInventoryDisplay();
        updateActionButtons();
    } else {
        updateMessage("Select an item from your inventory to trade first!");
    }
}

function updateActionButtons() {
    const chopBtn = document.getElementById('chop-btn');
    const fishBtn = document.getElementById('fish-btn');
    const collectBtn = document.getElementById('collect-btn');
    const tradeBtn = document.getElementById('trade-btn');
    const buildBtn = document.getElementById('build-btn');
    const buildPetHouseBtn = document.getElementById('build-pethouse-btn');
    
    chopBtn.disabled = !(game.selectedObject instanceof Tree && game.fred.isNear(game.selectedObject) && !game.selectedObject.chopped);
    fishBtn.disabled = !(game.selectedObject instanceof River && game.fred.selected);
    buildBtn.disabled = !(game.inventory.wood >= 10 && !game.house);
    buildPetHouseBtn.disabled = !(game.inventory.wood >= 5 && game.house);
    
    // Check if Fred is near any uncollected berries or has a berry selected
    const nearbyBerries = game.berries.filter(berry => 
        !berry.collected && game.fred.isNear(berry)
    );
    const hasSelectedBerry = game.selectedObject instanceof Berry && game.fred.isNear(game.selectedObject) && !game.selectedObject.collected;
    collectBtn.disabled = !(hasSelectedBerry || (nearbyBerries.length > 0 && game.fred.selected));
    
    // Trade button is enabled when an item is selected for trading
    tradeBtn.disabled = !(game.selectedTradeItem && game.inventory[game.selectedTradeItem] > 0);
}

function updateInventoryDisplay() {
    document.getElementById('wood-count').textContent = game.inventory.wood;
    document.getElementById('fish-count').textContent = game.inventory.fish;
    document.getElementById('food-count').textContent = game.inventory.food;
    document.getElementById('coins-count').textContent = game.inventory.coins;
    
    // Update berry counts if elements exist
    const purpleBerriesElement = document.getElementById('purple-berries-count');
    const pinkBerriesElement = document.getElementById('pink-berries-count');
    if (purpleBerriesElement) purpleBerriesElement.textContent = game.inventory.purpleBerries;
    if (pinkBerriesElement) pinkBerriesElement.textContent = game.inventory.pinkBerries;
    
    // Update visual selection for tradeable items
    updateTradeItemSelection();
    
    // Check if food is getting low
    if (game.inventory.food <= 20) {
        updateMessage("Energy is getting low! Eat some fish or berries to restore energy.");
    }
    
    // Game over if food reaches 0
    if (game.inventory.food <= 0) {
        updateMessage("Fred ran out of energy! Game Over. Refresh to try again.");
    }
}

function updateTradeItemSelection() {
    // Remove all previous selections
    document.querySelectorAll('.inventory-item').forEach(item => {
        item.classList.remove('selected-trade-item');
    });
    
    // Highlight selected trade item
    if (game.selectedTradeItem) {
        const itemElement = document.getElementById(`${game.selectedTradeItem}-count`).parentElement;
        itemElement.classList.add('selected-trade-item');
    }
}

function updateMessage(message) {
    game.gameMessage = message;
    document.getElementById('game-message').textContent = message;
}

function drawPetShopButtons(ctx) {
    // First Pet Shop (Dogs & Cats)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(50, 150, 250, 150);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 150, 250, 150);
    
    // First pet shop title
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐾 Furry Friends Shop 🐾', 175, 175);
    
    // Purchase Dog Button
    const dogBtn = {x: 70, y: 190, width: 90, height: 35};
    ctx.fillStyle = game.inventory.coins >= 3 ? '#27ae60' : '#bdc3c7';
    ctx.fillRect(dogBtn.x, dogBtn.y, dogBtn.width, dogBtn.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(dogBtn.x, dogBtn.y, dogBtn.width, dogBtn.height);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐕 Buy Dog', dogBtn.x + dogBtn.width/2, dogBtn.y + 18);
    ctx.fillText('3 coins', dogBtn.x + dogBtn.width/2, dogBtn.y + 30);
    
    // Purchase Cat Button
    const catBtn = {x: 180, y: 190, width: 90, height: 35};
    ctx.fillStyle = game.inventory.coins >= 3 ? '#27ae60' : '#bdc3c7';
    ctx.fillRect(catBtn.x, catBtn.y, catBtn.width, catBtn.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(catBtn.x, catBtn.y, catBtn.width, catBtn.height);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐱 Buy Cat', catBtn.x + catBtn.width/2, catBtn.y + 18);
    ctx.fillText('3 coins', catBtn.x + catBtn.width/2, catBtn.y + 30);
    
    // Pet count info for first shop
    const dogCount = game.pets.filter(pet => pet.type === 'dog').length;
    const catCount = game.pets.filter(pet => pet.type === 'cat').length;
    
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText(`Dogs: ${dogCount}`, 115, 250);
    ctx.fillText(`Cats: ${catCount}`, 215, 250);
    
    // Second Pet Shop (Birds & Rabbits)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(500, 150, 250, 150);
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 3;
    ctx.strokeRect(500, 150, 250, 150);
    
    // Second pet shop title
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🌿 Nature\'s Corner 🌿', 625, 175);
    
    // Purchase Bird Button
    const birdBtn = {x: 520, y: 190, width: 90, height: 35};
    ctx.fillStyle = game.inventory.coins >= 3 ? '#27ae60' : '#bdc3c7';
    ctx.fillRect(birdBtn.x, birdBtn.y, birdBtn.width, birdBtn.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(birdBtn.x, birdBtn.y, birdBtn.width, birdBtn.height);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐦 Buy Bird', birdBtn.x + birdBtn.width/2, birdBtn.y + 18);
    ctx.fillText('3 coins', birdBtn.x + birdBtn.width/2, birdBtn.y + 30);
    
    // Purchase Rabbit Button
    const rabbitBtn = {x: 630, y: 190, width: 90, height: 35};
    ctx.fillStyle = game.inventory.coins >= 3 ? '#27ae60' : '#bdc3c7';
    ctx.fillRect(rabbitBtn.x, rabbitBtn.y, rabbitBtn.width, rabbitBtn.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(rabbitBtn.x, rabbitBtn.y, rabbitBtn.width, rabbitBtn.height);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐰 Buy Rabbit', rabbitBtn.x + rabbitBtn.width/2, rabbitBtn.y + 18);
    ctx.fillText('3 coins', rabbitBtn.x + rabbitBtn.width/2, rabbitBtn.y + 30);
    
    // Pet count info for second shop
    const birdCount = game.pets.filter(pet => pet.type === 'bird').length;
    const rabbitCount = game.pets.filter(pet => pet.type === 'rabbit').length;
    
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText(`Birds: ${birdCount}`, 560, 250);
    ctx.fillText(`Rabbits: ${rabbitCount}`, 670, 250);
    
    // Instructions
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Click buttons to purchase pets!', 400, 285);
}

function isPetButtonClicked(x, y) {
    // First pet shop buttons
    const dogBtn = {x: 70, y: 190, width: 90, height: 35};
    const catBtn = {x: 180, y: 190, width: 90, height: 35};
    
    // Second pet shop buttons  
    const birdBtn = {x: 520, y: 190, width: 90, height: 35};
    const rabbitBtn = {x: 630, y: 190, width: 90, height: 35};
    
    if (x >= dogBtn.x && x <= dogBtn.x + dogBtn.width && y >= dogBtn.y && y <= dogBtn.y + dogBtn.height) {
        return 'dog';
    }
    if (x >= catBtn.x && x <= catBtn.x + catBtn.width && y >= catBtn.y && y <= catBtn.y + catBtn.height) {
        return 'cat';
    }
    if (x >= birdBtn.x && x <= birdBtn.x + birdBtn.width && y >= birdBtn.y && y <= birdBtn.y + birdBtn.height) {
        return 'bird';
    }
    if (x >= rabbitBtn.x && x <= rabbitBtn.x + rabbitBtn.width && y >= rabbitBtn.y && y <= rabbitBtn.y + rabbitBtn.height) {
        return 'rabbit';
    }
    return null;
}

function drawBedBuildingInterface(ctx, petHouse) {
    // Bed building area background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(550, 450, 200, 100);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(550, 450, 200, 100);
    
    // Title
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🛏️ Pet Bed Shop', 650, 470);
    
    // Build bed button
    const bedBtn = {x: 580, y: 480, width: 140, height: 30};
    const canBuild = game.inventory.purpleBerries + game.inventory.pinkBerries >= 3 && petHouse.beds.length < 4;
    
    ctx.fillStyle = canBuild ? '#27ae60' : '#bdc3c7';
    ctx.fillRect(bedBtn.x, bedBtn.y, bedBtn.width, bedBtn.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(bedBtn.x, bedBtn.y, bedBtn.width, bedBtn.height);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.fillText('🛏️ Build Pet Bed', bedBtn.x + bedBtn.width/2, bedBtn.y + 20);
    
    // Cost and status info
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.fillText('Cost: 3 berries (any color)', 650, 525);
    ctx.fillText(`Beds: ${petHouse.beds.length}/4`, 650, 540);
}

function isBedButtonClicked(x, y, petHouse) {
    const bedBtn = {x: 580, y: 480, width: 140, height: 30};
    return x >= bedBtn.x && x <= bedBtn.x + bedBtn.width && 
           y >= bedBtn.y && y <= bedBtn.y + bedBtn.height;
}

function buildPetBed(petHouse) {
    const totalBerries = game.inventory.purpleBerries + game.inventory.pinkBerries;
    
    if (totalBerries >= 3 && petHouse.beds.length < 4) {
        // Deduct berries (prefer purple first)
        let berriesNeeded = 3;
        if (game.inventory.purpleBerries >= berriesNeeded) {
            game.inventory.purpleBerries -= berriesNeeded;
        } else {
            berriesNeeded -= game.inventory.purpleBerries;
            game.inventory.purpleBerries = 0;
            game.inventory.pinkBerries -= berriesNeeded;
        }
        
        // Position bed in available space
        const bedPositions = [
            {x: 600, y: 200}, {x: 600, y: 300},
            {x: 200, y: 350}, {x: 300, y: 350}
        ];
        
        const newBed = new PetBed(bedPositions[petHouse.beds.length].x, bedPositions[petHouse.beds.length].y);
        petHouse.beds.push(newBed);
        
        updateInventoryDisplay();
        updateMessage(`Built a cozy pet bed! Pets can now sleep here. 🛏️`);
    } else if (petHouse.beds.length >= 4) {
        updateMessage("This pet house already has the maximum of 4 beds!");
    } else {
        updateMessage("You need 3 berries (any color) to build a pet bed!");
    }
}

function purchasePet(petType) {
    if (game.inventory.coins >= 3) {
        const petName = prompt(`What would you like to name your ${petType}?`);
        if (petName && petName.trim() !== '') {
            // Deduct coins
            game.inventory.coins -= 3;
            
            // Create new pet at random position in house
            const newPet = new Pet(
                200 + Math.random() * 300,
                200 + Math.random() * 200,
                petType,
                petName.trim()
            );
            
            game.pets.push(newPet);
            updateInventoryDisplay();
            updateMessage(`Welcome ${petName} the ${petType}! 🎉`);
        } else {
            updateMessage("Pet purchase cancelled - no name provided.");
        }
    } else {
        updateMessage(`You need 3 coins to buy a ${petType}! Trade some items first.`);
    }
}

function render() {
    // Clear canvas
    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
    
    if (game.insidePetHouse) {
        // Draw pet house interior
        game.ctx.fillStyle = '#F0E68C'; // Khaki interior for pet house
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        
        // Draw floor pattern
        game.ctx.strokeStyle = '#DDD';
        game.ctx.lineWidth = 1;
        for (let i = 0; i < game.canvas.width; i += 30) {
            game.ctx.beginPath();
            game.ctx.moveTo(i, 0);
            game.ctx.lineTo(i, game.canvas.height);
            game.ctx.stroke();
        }
        for (let i = 0; i < game.canvas.height; i += 30) {
            game.ctx.beginPath();
            game.ctx.moveTo(0, i);
            game.ctx.lineTo(game.canvas.width, i);
            game.ctx.stroke();
        }
        
        // Draw food bag and bowl
        game.currentPetHouse.foodBag.draw(game.ctx);
        game.currentPetHouse.foodBowl.draw(game.ctx);
        
        // Draw pet beds
        game.currentPetHouse.beds.forEach(bed => bed.draw(game.ctx));
        
        // Draw pets that are in this pet house
        game.currentPetHouse.petsInside.forEach(pet => pet.draw(game.ctx));
        
        // Draw Fred
        game.fred.draw(game.ctx);
        
        // Draw bed building interface
        drawBedBuildingInterface(game.ctx, game.currentPetHouse);
        
        // Draw instructions
        game.ctx.fillStyle = '#000';
        game.ctx.font = '16px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.fillText('Pet House Interior - Click anywhere to exit', game.canvas.width/2, 50);
        game.ctx.font = '12px Arial';
        game.ctx.fillText('Click food bag then bowl to feed pets!', game.canvas.width/2, 70);
        game.ctx.fillText('Click sleeping pets to wake them up!', game.canvas.width/2, 85);
        
    } else if (game.insideHouse) {
        // Draw main house interior
        game.ctx.fillStyle = '#ADD8E6'; // Light blue interior
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        
        // Draw floor pattern
        game.ctx.strokeStyle = '#DDD';
        game.ctx.lineWidth = 1;
        for (let i = 0; i < game.canvas.width; i += 40) {
            game.ctx.beginPath();
            game.ctx.moveTo(i, 0);
            game.ctx.lineTo(i, game.canvas.height);
            game.ctx.stroke();
        }
        for (let i = 0; i < game.canvas.height; i += 40) {
            game.ctx.beginPath();
            game.ctx.moveTo(0, i);
            game.ctx.lineTo(game.canvas.width, i);
            game.ctx.stroke();
        }
        
        // Draw closet
        game.closet.draw(game.ctx);
        
        // Draw pets inside main house (only pets not in pet house)
        game.pets.filter(pet => !pet.inPetHouse).forEach(pet => pet.draw(game.ctx));
        
        // Draw Fred
        game.fred.draw(game.ctx);
        
        // Draw pet purchase buttons
        drawPetShopButtons(game.ctx);
        
        // Draw exit instructions
        game.ctx.fillStyle = '#000';
        game.ctx.font = '16px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.fillText('Click anywhere to exit the house', game.canvas.width/2, 50);
        
    } else {
        // Draw outdoor scene
        // Draw background
        game.ctx.fillStyle = '#90EE90';
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        
        // Draw rivers
        game.rivers.forEach(river => river.draw(game.ctx));
        
        // Draw trees
        game.trees.forEach(tree => tree.draw(game.ctx));
        
        // Draw berries
        game.berries.forEach(berry => berry.draw(game.ctx));
        
        // Draw eggs
        game.eggs.forEach(egg => egg.draw(game.ctx));
        
        // Draw fish
        game.fish.forEach(fish => fish.draw(game.ctx));
        
        // Draw house if built
        if (game.house) {
            game.house.draw(game.ctx);
        }
        
        // Draw all pet houses
        game.petHouses.forEach(petHouse => petHouse.draw(game.ctx));
        
        // Draw pets outside (only pets not in pet house)
        game.pets.filter(pet => !pet.inPetHouse).forEach(pet => pet.draw(game.ctx));
        
        // Draw Fred
        game.fred.draw(game.ctx);
    }
    
    // Draw color picker if showing
    if (game.showColorPicker) {
        // Semi-transparent overlay
        game.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        
        // Color picker background
        game.ctx.fillStyle = '#FFF';
        game.ctx.fillRect(240, 240, 320, 70);
        game.ctx.strokeStyle = '#000';
        game.ctx.lineWidth = 2;
        game.ctx.strokeRect(240, 240, 320, 70);
        
        // Title
        game.ctx.fillStyle = '#000';
        game.ctx.font = '16px Arial';
        game.ctx.textAlign = 'center';
        game.ctx.fillText('Choose Shirt Color', 400, 260);
        
        // Color swatches
        for (let i = 0; i < game.availableColors.length; i++) {
            game.ctx.fillStyle = game.availableColors[i];
            game.ctx.fillRect(250 + i * 30, 270, 25, 25);
            game.ctx.strokeStyle = '#000';
            game.ctx.lineWidth = 1;
            game.ctx.strokeRect(250 + i * 30, 270, 25, 25);
        }
    }
}

function update() {
    // Update Fred
    game.fred.update();
    
    // Update fish
    game.fish.forEach(fish => fish.update());
    
    // Update trees (regrowth)
    game.trees.forEach(tree => tree.update());
    
    // Update berries (regrowth)
    game.berries.forEach(berry => berry.update());
    
    // Update pets
    game.pets.forEach(pet => pet.update());
    
    // Update eggs (hatching)
    for (let i = game.eggs.length - 1; i >= 0; i--) {
        const egg = game.eggs[i];
        if (egg.update()) {
            // Egg hatched, spawn new fish
            const river = game.rivers[egg.riverId];
            game.fish.push(new Fish(
                egg.x,
                egg.y,
                egg.riverId
            ));
            // Remove the egg
            game.eggs.splice(i, 1);
        }
    }
    
    // Update action buttons
    updateActionButtons();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.addEventListener('load', initGame); 