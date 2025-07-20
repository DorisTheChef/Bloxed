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
    closet: null,
    showColorPicker: false,
    pets: [],
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
        if (!this.chopped) {
            // Tree trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 10, this.y + 20, 10, 30);
            
            // Tree foliage
            ctx.fillStyle = '#228B22';
            ctx.beginPath();
            ctx.arc(this.x + 15, this.y + 15, 20, 0, 2 * Math.PI);
            ctx.fill();
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

class Pet {
    constructor(x, y, type, name) {
        this.x = x;
        this.y = y;
        this.type = type; // 'dog' or 'cat'
        this.name = name;
        this.width = 30;
        this.height = 25;
        this.direction = Math.random() * 2 * Math.PI;
        this.speed = 0.3;
        this.idleTime = 0;
    }

    update() {
        // Simple pet movement inside house
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
        }
        
        // Draw name
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width/2, this.y - 20);
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
    document.getElementById('chop-btn').addEventListener('click', chopTree);
    document.getElementById('fish-btn').addEventListener('click', catchFish);
    document.getElementById('collect-btn').addEventListener('click', collectBerries);
    document.getElementById('eat-btn').addEventListener('click', eatFish);
    document.getElementById('trade-btn').addEventListener('click', tradeItem);
    document.getElementById('build-btn').addEventListener('click', buildHouse);
    
    // Set up inventory item click listeners
    setupInventoryListeners();
    
    // Start game loop
    gameLoop();
}

function handleClick(event) {
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
    
    // Handle inside house interactions
    if (game.insideHouse) {
        // Exit house (click anywhere except closet)
        if (!game.closet.isClicked(x, y)) {
            game.insideHouse = false;
            game.fred.x = game.house.x + 10;
            game.fred.y = game.house.y + 30;
            updateMessage("Exited the house!");
            return;
        }
        
        // Click on closet
        if (game.closet.isClicked(x, y)) {
            game.showColorPicker = true;
            updateMessage("Choose a color for Fred's shirt!");
            return;
        }
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
            if (tree.isClicked(x, y)) {
                game.fred.moveTo(tree.x, tree.y);
                game.selectedObject = tree;
                updateActionButtons();
                updateMessage("Move to tree to chop it!");
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
    
    chopBtn.disabled = !(game.selectedObject instanceof Tree && game.fred.isNear(game.selectedObject) && !game.selectedObject.chopped);
    fishBtn.disabled = !(game.selectedObject instanceof River && game.fred.selected);
    buildBtn.disabled = !(game.inventory.wood >= 10 && !game.house);
    
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
    // Pet shop area background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(500, 150, 250, 150);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(500, 150, 250, 150);
    
    // Pet shop title
    ctx.fillStyle = '#000';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐾 Pet Shop 🐾', 625, 175);
    
    // Purchase Dog Button
    const dogBtn = {x: 520, y: 190, width: 100, height: 40};
    ctx.fillStyle = game.inventory.coins >= 3 ? '#27ae60' : '#bdc3c7';
    ctx.fillRect(dogBtn.x, dogBtn.y, dogBtn.width, dogBtn.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(dogBtn.x, dogBtn.y, dogBtn.width, dogBtn.height);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐕 Buy Dog', dogBtn.x + dogBtn.width/2, dogBtn.y + 20);
    ctx.fillText('3 coins', dogBtn.x + dogBtn.width/2, dogBtn.y + 35);
    
    // Purchase Cat Button
    const catBtn = {x: 630, y: 190, width: 100, height: 40};
    ctx.fillStyle = game.inventory.coins >= 3 ? '#27ae60' : '#bdc3c7';
    ctx.fillRect(catBtn.x, catBtn.y, catBtn.width, catBtn.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(catBtn.x, catBtn.y, catBtn.width, catBtn.height);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐱 Buy Cat', catBtn.x + catBtn.width/2, catBtn.y + 20);
    ctx.fillText('3 coins', catBtn.x + catBtn.width/2, catBtn.y + 35);
    
    // Pet count info
    const dogCount = game.pets.filter(pet => pet.type === 'dog').length;
    const catCount = game.pets.filter(pet => pet.type === 'cat').length;
    
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.fillText(`Dogs owned: ${dogCount}`, 570, 260);
    ctx.fillText(`Cats owned: ${catCount}`, 680, 260);
    
    // Instructions
    ctx.font = '12px Arial';
    ctx.fillText('Click buttons to purchase pets!', 625, 285);
}

function isPetButtonClicked(x, y) {
    const dogBtn = {x: 520, y: 190, width: 100, height: 40};
    const catBtn = {x: 630, y: 190, width: 100, height: 40};
    
    if (x >= dogBtn.x && x <= dogBtn.x + dogBtn.width && y >= dogBtn.y && y <= dogBtn.y + dogBtn.height) {
        return 'dog';
    }
    if (x >= catBtn.x && x <= catBtn.x + catBtn.width && y >= catBtn.y && y <= catBtn.y + catBtn.height) {
        return 'cat';
    }
    return null;
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
    
    if (game.insideHouse) {
        // Draw house interior
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
        
        // Draw pets
        game.pets.forEach(pet => pet.draw(game.ctx));
        
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