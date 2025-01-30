// 游戏常量
const GRID_SIZE = 30;
let GRID_COUNT_X;
let GRID_COUNT_Y;
const GAME_SPEED = 300;

// 游戏变量
let snake = [
    {x: 10, y: 10}
];
let food = null;
let direction = 'right';
let gameLoop = null;

// 添加游戏状态变量
let isGameRunning = false;
let foodEatenCount = 0;      // 吃到食物的次数
let canPassTree = false;     // 是否可以穿越树木
let hasReviveChance = false; // 是否有重生机会

// 获取画布上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 添加树和农夫的数据结构
let trees = [];
let farmer = {
    x: 10,
    y: 10,
    width: 3,  // 从2改为3
    height: 3, // 从2改为3
    direction: 'right',
    moveTimer: 0
};

// 添加计算网格数量的函数
function calculateGridCounts() {
    GRID_COUNT_X = Math.floor(window.innerWidth / GRID_SIZE);
    GRID_COUNT_Y = Math.floor(window.innerHeight / GRID_SIZE);
}

// 生成食物
function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * GRID_COUNT_X),
            y: Math.floor(Math.random() * GRID_COUNT_Y)
        };
    } while (
        snake.some(segment => segment.x === food.x && segment.y === food.y) ||
        isObstacle(food.x, food.y, 'tree') ||
        isObstacle(food.x, food.y, 'farmer')
    );
}

// 修改树木初始化函数
function initTrees() {
    trees = [];
    
    // 将地图分成四个区域（前后左右）
    const areas = [
        { name: 'front', y: 0.2 },           // 前部
        { name: 'back', y: 0.8 },            // 后部
        { name: 'left', x: 0.2 },            // 左侧
        { name: 'right', x: 0.8 },           // 右侧
        { name: 'center', x: 0.5, y: 0.5 }   // 中间
    ];

    // 每个区域放置2-3棵树
    areas.forEach(area => {
        const treesInArea = 2 + Math.floor(Math.random() * 2); // 2-3棵树
        
        for (let i = 0; i < treesInArea; i++) {
            let x, y;
            let attempts = 0;
            let placed = false;
            
            while (!placed && attempts < 10) {
                if (area.name === 'left' || area.name === 'right') {
                    // 左右区域的树
                    x = Math.floor(GRID_COUNT_X * area.x + (Math.random() - 0.5) * 10);
                    y = Math.floor(Math.random() * (GRID_COUNT_Y - 4));
                } else if (area.name === 'front' || area.name === 'back') {
                    // 前后区域的树
                    x = Math.floor(Math.random() * (GRID_COUNT_X - 4));
                    y = Math.floor(GRID_COUNT_Y * area.y + (Math.random() - 0.5) * 10);
                } else {
                    // 中间区域的树
                    x = Math.floor(GRID_COUNT_X * area.x + (Math.random() - 0.5) * 10);
                    y = Math.floor(GRID_COUNT_Y * area.y + (Math.random() - 0.5) * 10);
                }
                
                // 确保树不会太靠近边界
                if (x >= 2 && x < GRID_COUNT_X - 4 && 
                    y >= 2 && y < GRID_COUNT_Y - 4) {
                    if (!isPositionOccupied(x, y, 2, 2)) {
                        trees.push({
                            x: x,
                            y: y,
                            width: 2,
                            height: 2
                        });
                        placed = true;
                    }
                }
                attempts++;
            }
        }
    });
}

// 检查位置是否被占用
function isPositionOccupied(x, y, width, height) {
    // 检查是否与其他树重叠
    for (let tree of trees) {
        if (x < tree.x + tree.width && x + width > tree.x &&
            y < tree.y + tree.height && y + height > tree.y) {
            return true;
        }
    }
    return false;
}

// 绘制蛇的新函数
function drawSnake(segment, index) {
    const snakeSize = GRID_SIZE * 1.5;
    const x = segment.x * GRID_SIZE;
    const y = segment.y * GRID_SIZE;
    
    // 蛇身基本形状（红色）
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    if (index === 0) {  // 蛇头
        // S形曲线绘制蛇头
        ctx.beginPath();
        ctx.moveTo(x, y + snakeSize * 0.5);
        ctx.bezierCurveTo(
            x + snakeSize * 0.3,
            y,
            x + snakeSize * 0.7,
            y,
            x + snakeSize,
            y + snakeSize * 0.5
        );
        ctx.bezierCurveTo(
            x + snakeSize * 0.7,
            y + snakeSize,
            x + snakeSize * 0.3,
            y + snakeSize,
            x,
            y + snakeSize * 0.5
        );
    } else {  // 蛇身
        // 圆形蛇身节段
        ctx.arc(
            x + snakeSize * 0.5,
            y + snakeSize * 0.5,
            snakeSize * 0.4,
            0,
            Math.PI * 2
        );
    }
    ctx.fill();

    // 装饰花纹（白色）
    if (index === 0) {  // 蛇头装饰
        // 眼睛
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(
            x + snakeSize * 0.3,
            y + snakeSize * 0.3,
            snakeSize * 0.1,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 眼珠
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(
            x + snakeSize * 0.3,
            y + snakeSize * 0.3,
            snakeSize * 0.05,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // 花纹装饰
        ctx.fillStyle = '#FFFFFF';
        // 头部卷曲纹路
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
                x + snakeSize * (0.4 + i * 0.2),
                y + snakeSize * 0.6,
                snakeSize * 0.08,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    } else {  // 蛇身装饰
        ctx.fillStyle = '#FFFFFF';
        // 花形装饰
        const centerX = x + snakeSize * 0.5;
        const centerY = y + snakeSize * 0.5;
        const petalSize = snakeSize * 0.15;
        
        // 绘制花瓣
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const petalX = centerX + Math.cos(angle) * petalSize;
            const petalY = centerY + Math.sin(angle) * petalSize;
            
            ctx.beginPath();
            ctx.arc(petalX, petalY, petalSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 花蕊
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX, centerY, petalSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // 添加波浪形轮廓
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 2;
    if (index === 0) {
        // 蛇头轮廓
        ctx.beginPath();
        ctx.moveTo(x + snakeSize * 0.2, y + snakeSize * 0.3);
        ctx.quadraticCurveTo(
            x + snakeSize * 0.1,
            y + snakeSize * 0.5,
            x + snakeSize * 0.2,
            y + snakeSize * 0.7
        );
        ctx.stroke();
    }

    // 添加光泽效果
    const gradient = ctx.createRadialGradient(
        x + snakeSize * 0.3,
        y + snakeSize * 0.3,
        0,
        x + snakeSize * 0.3,
        y + snakeSize * 0.3,
        snakeSize * 0.8
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
}

// 在 draw 函数中修改绘制树木的部分
function drawTree(tree) {
    const size = GRID_SIZE * 2;  // 树的基础大小
    const x = tree.x * GRID_SIZE;
    const y = tree.y * GRID_SIZE;

    // 绘制树干（棕色，剪纸风格）
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    // 树干主体，略微弧形
    ctx.moveTo(x + size * 0.3, y + size);
    ctx.quadraticCurveTo(
        x + size * 0.4,
        y + size * 0.6,
        x + size * 0.5,
        y + size * 0.4
    );
    ctx.quadraticCurveTo(
        x + size * 0.6,
        y + size * 0.6,
        x + size * 0.7,
        y + size
    );
    ctx.closePath();
    ctx.fill();

    // 树干上的年轮纹理（剪纸风格）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
        x + size * 0.5,
        y + size * 0.7,
        size * 0.1,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    // 绘制树冠（绿色，剪纸风格）
    ctx.fillStyle = '#228B22';
    
    // 绘制主要树冠（三层叠加的云形）
    // 底层
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y + size * 0.4, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y + size * 0.4, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // 中层
    ctx.beginPath();
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.25, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y + size * 0.2, size * 0.25, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 顶层
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 添加剪纸风格的装饰（白色点缀）
    ctx.fillStyle = '#FFFFFF';
    // 在树冠上添加装饰性圆点
    const decorationPoints = [
        {x: 0.3, y: 0.2},
        {x: 0.7, y: 0.2},
        {x: 0.5, y: 0.1},
        {x: 0.4, y: 0.3},
        {x: 0.6, y: 0.3}
    ];

    decorationPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(
            x + size * point.x,
            y + size * point.y,
            size * 0.05,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // 添加树叶的轮廓线条
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 1;
    // 在树冠边缘添加一些弧线装饰
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
            x + size * (0.3 + i * 0.1),
            y + size * 0.3,
            size * 0.1,
            0,
            Math.PI
        );
        ctx.stroke();
    }
}

// 画蛇和食物
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#90EE90';  // 浅绿色背景
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新诗句位置（可选，如果想在游戏暂停时也移动）
    updatePoemPosition();
    
    // 绘制树木
    trees.forEach(tree => {
        drawTree(tree);
    });
    
    // 绘制农夫
    drawFarmer(farmer.x, farmer.y);
    
    // 绘制蛇
    snake.forEach((segment, index) => {
        drawSnake(segment, index);
    });
    
    // 绘制食物
    if (food) {
        drawInsect(food.x, food.y);
    }
}

// 绘制昆虫
function drawInsect(x, y) {
    // 画昆虫身体
    ctx.fillStyle = '#e74c3c';  // 红色身体
    const bodyWidth = GRID_SIZE - 6;
    const bodyHeight = GRID_SIZE - 10;
    ctx.fillRect(
        x * GRID_SIZE + (GRID_SIZE - bodyWidth) / 2,
        y * GRID_SIZE + (GRID_SIZE - bodyHeight) / 2,
        bodyWidth,
        bodyHeight
    );
    
    // 画昆虫腿
    ctx.beginPath();
    ctx.strokeStyle = '#c0392b';  // 深红色腿
    ctx.lineWidth = 1;
    
    // 左边四条腿
    for (let i = 0; i < 4; i++) {
        const startY = y * GRID_SIZE + (GRID_SIZE - bodyHeight) / 2 + (i + 1) * (bodyHeight / 5);
        ctx.moveTo(x * GRID_SIZE + (GRID_SIZE - bodyWidth) / 2, startY);
        ctx.lineTo(x * GRID_SIZE + 2, startY - 2);
    }
    
    // 右边四条腿
    for (let i = 0; i < 4; i++) {
        const startY = y * GRID_SIZE + (GRID_SIZE - bodyHeight) / 2 + (i + 1) * (bodyHeight / 5);
        ctx.moveTo(x * GRID_SIZE + (GRID_SIZE - bodyWidth) / 2 + bodyWidth, startY);
        ctx.lineTo(x * GRID_SIZE + GRID_SIZE - 2, startY - 2);
    }
    
    ctx.stroke();
    
    // 画昆虫眼睛
    ctx.fillStyle = 'black';
    const eyeSize = 2;
    ctx.fillRect(
        x * GRID_SIZE + (GRID_SIZE - bodyWidth) / 2 + 2,
        y * GRID_SIZE + (GRID_SIZE - bodyHeight) / 2 + 2,
        eyeSize,
        eyeSize
    );
    ctx.fillRect(
        x * GRID_SIZE + (GRID_SIZE - bodyWidth) / 2 + bodyWidth - 4,
        y * GRID_SIZE + (GRID_SIZE - bodyHeight) / 2 + 2,
        eyeSize,
        eyeSize
    );
}

// 移动蛇
function moveSnake() {
    const head = {...snake[0]};
    
    // 每次只移动一格
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // 检查碰撞
    const collisionType = checkCollision(head);
    if (collisionType === 'fatal') {
        gameOver();
        return;
    } else if (collisionType === 'block') {
        // 如果碰到树木，不移动
        return;
    }
    
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (food && head.x === food.x && head.y === food.y) {
        generateFood();
        updateScore();
    } else {
        snake.pop();
    }
}

// 碰撞检测
function checkCollision(head) {
    // 检查墙壁碰撞（致命）
    if (head.x < 0 || head.x >= GRID_COUNT_X || head.y < 0 || head.y >= GRID_COUNT_Y) {
        return 'fatal';
    }
    
    // 检查自身碰撞（致命）
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        return 'fatal';
    }

    // 检查农夫碰撞（可能致命）
    if (isObstacle(head.x, head.y, 'farmer')) {
        if (hasReviveChance) {
            hasReviveChance = false;
            showMessage("使用重生机会！继续游戏...");
            // 将蛇移动到安全位置
            resetSnakePosition();
            return 'none';
        }
        return 'fatal';
    }

    // 检查树木碰撞（可能阻挡）
    if (isObstacle(head.x, head.y, 'tree')) {
        if (canPassTree) {
            return 'none';  // 可以穿越
        }
        return 'block';
    }

    return 'none';
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    alert(`游戏结束！\n最终得分: ${score}\n吃到食物: ${foodEatenCount}个`);
    isGameRunning = false;
    score = 0;
    foodEatenCount = 0;
    canPassTree = false;
    hasReviveChance = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}

// 重置游戏
function resetGame() {
    snake = [{x: 10, y: 10}];
    direction = 'right';
    generateFood();
    gameLoop = setInterval(gameStep, GAME_SPEED);
}

// 游戏步骤
function gameStep() {
    if (isGameRunning) {
        updateFarmer();
        moveSnake();
        draw();
    }
}

// 键盘控制
document.addEventListener('keydown', (event) => {
    if (!isGameRunning) return;
    
    if (event.code === 'Space' && canPassTree) {
        canPassTree = false;
        showMessage("使用穿越能力！");
    }
    
    switch(event.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
});

// 修改开始游戏函数
function startGame() {
    if (!isGameRunning) {
        isGameRunning = true;
        foodEatenCount = 0;
        canPassTree = false;
        hasReviveChance = false;
        direction = 'right';
        initTrees();  // 初始化树木
        
        // 初始化农夫位置
        farmer = {
            x: Math.floor(GRID_COUNT_X / 4),
            y: Math.floor(GRID_COUNT_Y / 4),
            width: 3,  // 添加宽度
            height: 3, // 添加高度
            direction: 'right',
            moveTimer: 0
        };
        
        // 初始化蛇的位置
        let startX, startY;
        do {
            startX = Math.floor(GRID_COUNT_X / 2);
            startY = Math.floor(GRID_COUNT_Y / 2);
        } while (isPositionOccupied(startX, startY, 1, 1));
        
        snake = [{x: startX, y: startY}];
        generateFood();
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, GAME_SPEED);
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
        
        // 重置并启动诗句动画
        const poemText = document.getElementById('poemText');
        poemText.style.animation = 'none';
        poemText.offsetHeight; // 触发重排
        poemText.style.animation = 'scrollPoem 20s linear infinite';
    }
}

// 添加停止游戏函数
function stopGame() {
    isGameRunning = false;
    clearInterval(gameLoop);
    gameLoop = null;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    
    // 暂停诗句动画（可选）
    const poemText = document.getElementById('poemText');
    poemText.style.animationPlayState = 'paused';
}

// 修改 resizeCanvas 函数
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    calculateGridCounts();
    // 如果游戏正在运行，检查蛇和食物的位置是否有效
    if (isGameRunning) {
        // 检查蛇是否超出新边界
        if (snake.some(segment => segment.x >= GRID_COUNT_X || segment.y >= GRID_COUNT_Y)) {
            gameOver();
            return;
        }
        // 检查食物是否超出新边界
        if (food.x >= GRID_COUNT_X || food.y >= GRID_COUNT_Y) {
            generateFood();
        }
    }
    draw();
}

// 修改障碍物检测函数
function isObstacle(x, y, type = 'all') {
    if (type === 'tree' || type === 'all') {
        // 检查树木碰撞（精确碰撞）
        if (trees.some(tree => 
            x >= tree.x && x < tree.x + tree.width &&
            y >= tree.y && y < tree.y + tree.height)) {
            return true;
        }
    }
    
    if (type === 'farmer' || type === 'all') {
        // 检查农夫碰撞（检查整个农夫区域）
        if (x >= farmer.x && x < farmer.x + farmer.width &&
            y >= farmer.y && y < farmer.y + farmer.height) {
            return true;
        }
    }
    
    return false;
}

// 修改农夫移动速度
function updateFarmer() {
    farmer.moveTimer = (farmer.moveTimer || 0) + 1;
    if (farmer.moveTimer < 2) return;  // 从3改为2，移动更频繁
    farmer.moveTimer = 0;

    const SPEED = 1;  // 保持每次移动1格
    
    // 获取蛇头位置
    const snakeHead = snake[0];
    // 获取食物位置
    const foodPos = food;
    
    // 计算蛇头到食物的向量
    const snakeToFood = {
        x: foodPos.x - snakeHead.x,
        y: foodPos.y - snakeHead.y
    };
    
    // 判断蛇的移动方向
    let snakeDirection = {
        x: direction === 'right' ? 1 : (direction === 'left' ? -1 : 0),
        y: direction === 'down' ? 1 : (direction === 'up' ? -1 : 0)
    };
    
    // 农夫的智能移动策略
    if (Math.random() < 0.7) {  // 70%的概率执行智能移动
        // 计算最佳拦截位置
        let interceptX = snakeHead.x + snakeToFood.x / 2;
        let interceptY = snakeHead.y + snakeToFood.y / 2;
        
        // 根据蛇的移动方向调整拦截位置
        interceptX += snakeDirection.x * 2;
        interceptY += snakeDirection.y * 2;
        
        // 决定移动方向
        let dx = interceptX - farmer.x;
        let dy = interceptY - farmer.y;
        
        // 随机加入一些偏移，使移动更不可预测
        if (Math.random() < 0.3) {
            dx += (Math.random() - 0.5) * 4;
            dy += (Math.random() - 0.5) * 4;
        }
        
        // 选择主要移动方向并应用速度
        if (Math.abs(dx) > Math.abs(dy)) {
            farmer.direction = dx > 0 ? 'right' : 'left';
            let newX = farmer.x + (dx > 0 ? SPEED : -SPEED);
            if (newX >= 0 && newX < GRID_COUNT_X - 2 && 
                !isPositionOccupied(newX, farmer.y, 3, 3)) {
                farmer.x = newX;
            }
        } else {
            farmer.direction = dy > 0 ? 'down' : 'up';
            let newY = farmer.y + (dy > 0 ? SPEED : -SPEED);
            if (newY >= 0 && newY < GRID_COUNT_Y - 2 && 
                !isPositionOccupied(farmer.x, newY, 3, 3)) {
                farmer.y = newY;
            }
        }
    } else {
        // 30%的概率随机移动，增加不可预测性
        const directions = ['up', 'down', 'left', 'right'];
        farmer.direction = directions[Math.floor(Math.random() * directions.length)];
        
        // 根据方向移动多格
        let newX = farmer.x;
        let newY = farmer.y;
        switch(farmer.direction) {
            case 'up': newY -= SPEED; break;
            case 'down': newY += SPEED; break;
            case 'left': newX -= SPEED; break;
            case 'right': newX += SPEED; break;
        }
        
        // 检查边界和碰撞
        if (newX >= 0 && newX < GRID_COUNT_X - 2 && 
            newY >= 0 && newY < GRID_COUNT_Y - 2 && 
            !isPositionOccupied(newX, newY, 3, 3)) {
            farmer.x = newX;
            farmer.y = newY;
        }
    }
}

// 在现有代码中添加分数相关功能
let score = 0;

// 在吃到食物时更新分数
function updateScore() {
    score += 10;
    foodEatenCount++;
    
    // 检查特殊能力
    if (foodEatenCount === 5) {
        canPassTree = true;
        showMessage("获得穿越树木的能力！按空格键使用。");
    } else if (foodEatenCount === 10) {
        hasReviveChance = true;
        showMessage("获得一次重生机会！");
    }

    // 发送分数到父窗口
    if (window.parent) {
        window.parent.postMessage({
            type: 'score',
            score: score
        }, '*');
    }
}

// 添加诗句动画控制函数
function updatePoemPosition() {
    const poemText = document.getElementById('poemText');
    if (!poemText.style.animationPlayState) {
        poemText.style.animationPlayState = 'running';
    }
}

// 修改绘制农夫的函数，增加细节
function drawFarmer(x, y) {
    const size = GRID_SIZE * 3;
    const direction = farmer.direction;
    
    // 根据方向调整偏移
    let offsetX = 0;
    if (direction === 'left') {
        offsetX = -size * 0.1;
    } else if (direction === 'right') {
        offsetX = size * 0.1;
    }

    const centerX = x * GRID_SIZE + size * 0.5 + offsetX;
    const centerY = y * GRID_SIZE + size * 0.5;

    // 绘制背带裤（黄色）
    ctx.fillStyle = '#FFB90F';  // 橙黄色背带裤
    ctx.beginPath();
    // 裤子主体（剪纸风格）
    ctx.moveTo(centerX - size * 0.25, centerY - size * 0.1);
    ctx.lineTo(centerX + size * 0.25, centerY - size * 0.1);
    ctx.lineTo(centerX + size * 0.3, centerY + size * 0.5);
    ctx.lineTo(centerX - size * 0.3, centerY + size * 0.5);
    ctx.closePath();
    ctx.fill();

    // 绘制红色上衣（剪纸风格）
    ctx.fillStyle = '#8B1A1A';  // 深红色上衣
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.25, centerY - size * 0.1);
    ctx.lineTo(centerX + size * 0.25, centerY - size * 0.1);
    ctx.lineTo(centerX + size * 0.25, centerY + size * 0.1);
    ctx.lineTo(centerX - size * 0.25, centerY + size * 0.1);
    ctx.closePath();
    ctx.fill();

    // 背带（剪纸风格）
    ctx.fillStyle = '#FFB90F';
    // 左背带
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.15, centerY + size * 0.1);
    ctx.lineTo(centerX - size * 0.1, centerY - size * 0.3);
    ctx.lineTo(centerX - size * 0.05, centerY + size * 0.1);
    ctx.closePath();
    ctx.fill();
    // 右背带
    ctx.beginPath();
    ctx.moveTo(centerX + size * 0.15, centerY + size * 0.1);
    ctx.lineTo(centerX + size * 0.1, centerY - size * 0.3);
    ctx.lineTo(centerX + size * 0.05, centerY + size * 0.1);
    ctx.closePath();
    ctx.fill();

    // 绘制头部（肤色，剪纸风格）
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(
        centerX,
        centerY - size * 0.3,
        size * 0.2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 帽子（橙色，剪纸风格）
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.3, centerY - size * 0.3);
    ctx.quadraticCurveTo(
        centerX,
        centerY - size * 0.6,
        centerX + size * 0.3,
        centerY - size * 0.3
    );
    ctx.fill();

    // 帽子装饰带（深色）
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(
        centerX - size * 0.3,
        centerY - size * 0.35,
        size * 0.6,
        size * 0.05
    );

    // 眼睛（红色，剪纸风格）
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(
        centerX - size * 0.1,
        centerY - size * 0.3,
        size * 0.03,
        0,
        Math.PI * 2
    );
    ctx.arc(
        centerX + size * 0.1,
        centerY - size * 0.3,
        size * 0.03,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // 叉子（银色，剪纸风格）
    ctx.fillStyle = '#C0C0C0';
    // 手柄
    ctx.beginPath();
    ctx.rect(
        centerX + size * 0.3,
        centerY,
        size * 0.4,
        size * 0.05
    );
    ctx.fill();
    
    // 叉齿
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const startX = centerX + size * 0.7 + i * size * 0.05;
        ctx.moveTo(startX, centerY);
        ctx.lineTo(startX + size * 0.03, centerY - size * 0.15);
        ctx.lineTo(startX + size * 0.06, centerY);
        ctx.fill();
    }

    // 添加剪纸风格的装饰性镂空（白色）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    
    // 背带裤上的装饰
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
            centerX,
            centerY + i * size * 0.1,
            size * 0.05,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }

    // 上衣上的装饰
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(
            centerX - size * 0.15 + i * size * 0.1,
            centerY,
            size * 0.03,
            0,
            Math.PI * 2
        );
        ctx.stroke();
    }
}

// 添加重置蛇位置的函数
function resetSnakePosition() {
    // 找一个安全的位置重生
    let newX, newY;
    do {
        newX = Math.floor(Math.random() * GRID_COUNT_X);
        newY = Math.floor(Math.random() * GRID_COUNT_Y);
    } while (
        isObstacle(newX, newY, 'tree') ||
        isObstacle(newX, newY, 'farmer')
    );
    
    snake = [{x: newX, y: newY}];
    direction = 'right';
}

// 添加消息提示函数
function showMessage(text) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 20px;
        z-index: 1000;
    `;
    message.textContent = text;
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

// 修改初始化代码
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('stopBtn').addEventListener('click', stopGame);
    document.getElementById('stopBtn').disabled = true;
    
    // 设置画布大小为全屏并计算网格数量
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化游戏画面
    draw();
}); 