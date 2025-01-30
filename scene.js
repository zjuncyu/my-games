let scene, camera, renderer;
let ground, sky;
let clouds = [];
let trees = [];
let farmer;
let farmerDirection = new THREE.Vector3(1, 0, 0);

function init3DScene() {
    // 创建场景
    scene = new THREE.Scene();

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('scene'),
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 添加平行光（模拟太阳光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    scene.add(directionalLight);

    // 创建地面
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x90EE90,
        side: THREE.DoubleSide
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 创建天空
    const skyGeometry = new THREE.SphereGeometry(200, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // 创建云朵
    function createCloud() {
        const cloudGroup = new THREE.Group();
        
        const geometries = [
            new THREE.SphereGeometry(2, 16, 16),
            new THREE.SphereGeometry(1.5, 16, 16),
            new THREE.SphereGeometry(1.7, 16, 16)
        ];
        
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });

        geometries.forEach((geometry, i) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = i * 2;
            mesh.position.y = Math.random();
            cloudGroup.add(mesh);
        });

        return cloudGroup;
    }

    // 添加多朵云
    for (let i = 0; i < 10; i++) {
        const cloud = createCloud();
        cloud.position.set(
            Math.random() * 100 - 50,
            Math.random() * 20 + 20,
            Math.random() * 100 - 50
        );
        clouds.push(cloud);
        scene.add(cloud);
    }

    // 创建树
    function createTree() {
        const treeGroup = new THREE.Group();

        // 随机决定树的高度变化系数（0.8 到 1.2 之间）
        const heightVariation = 0.8 + Math.random() * 0.4;

        // 树干（扩大一倍并添加高度变化）
        const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.8, 4 * heightVariation, 8);  // 宽度和高度都扩大一倍
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        treeGroup.add(trunk);

        // 树冠（扩大一倍并添加高度变化）
        const leavesGeometry = new THREE.ConeGeometry(3, 6 * heightVariation, 8);  // 宽度和高度都扩大一倍
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 5 * heightVariation;  // 位置也要相应调整
        treeGroup.add(leaves);

        return treeGroup;
    }

    // 修改添加树的部分
    for (let i = 0; i < 25; i++) {
        const tree = createTree();
        // 确保树的位置对齐到网格
        const x = Math.floor(Math.random() * 80 - 40);
        const z = Math.floor(Math.random() * 80 - 40);
        tree.position.set(
            x - (x % GRID_SIZE),
            0,
            z - (z % GRID_SIZE)
        );
        tree.scale.set(1, 1, 1);
        trees.push(tree);
        scene.add(tree);
    }

    // 添加农夫
    farmer = createFarmer();
    farmer.position.set(0, 2.5, 0);  // 调整初始高度从 8 改为 2.5
    scene.add(farmer);

    // 添加窗口大小调整监听
    window.addEventListener('resize', onWindowResize, false);

    // 开始动画循环
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // 云朵移动
    clouds.forEach(cloud => {
        cloud.position.x += 0.01;
        if (cloud.position.x > 50) cloud.position.x = -50;
    });

    // 轻微摇晃树木
    trees.forEach(tree => {
        tree.rotation.z = Math.sin(Date.now() * 0.001) * 0.02;
    });

    // 农夫移动
    if (farmer) {
        // 降低改变方向的频率
        if (Math.random() < 0.005) {  // 从 0.02 改为 0.005，减少方向改变的频率
            const angle = Math.random() * Math.PI * 2;
            farmerDirection.x = Math.cos(angle);
            farmerDirection.z = Math.sin(angle);
        }

        // 减慢移动速度
        farmer.position.x += farmerDirection.x * 0.05;  // 从 0.3 改为 0.05
        farmer.position.z += farmerDirection.z * 0.05;  // 从 0.3 改为 0.05

        // 让农夫面向移动方向
        farmer.rotation.y = Math.atan2(farmerDirection.x, farmerDirection.z);

        // 限制农夫移动范围
        if (Math.abs(farmer.position.x) > 45) {
            farmerDirection.x *= -1;
            farmer.position.x = Math.sign(farmer.position.x) * 45;
        }
        if (Math.abs(farmer.position.z) > 45) {
            farmerDirection.z *= -1;
            farmer.position.z = Math.sign(farmer.position.z) * 45;
        }

        // 减慢行走动画
        farmer.position.y = 2.5 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.1;  // 调整动画速度和幅度
    }

    renderer.render(scene, camera);
}

function createFarmer() {
    const farmerGroup = new THREE.Group();
    
    // 农夫身体（圆柱体）缩小三倍
    const bodyGeometry = new THREE.CylinderGeometry(1, 1.3, 5, 8);  // 从 3,4,15 改为 1,1.3,5
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4169E1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    farmerGroup.add(body);
    
    // 农夫头部（球体）缩小三倍
    const headGeometry = new THREE.SphereGeometry(1, 16, 16);  // 从 3 改为 1
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xFFE4C4 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3.3;  // 从 10 改为 3.3
    farmerGroup.add(head);
    
    // 农夫帽子（圆锥体）缩小三倍
    const hatGeometry = new THREE.ConeGeometry(1.3, 1.3, 8);  // 从 4,4 改为 1.3,1.3
    const hatMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.y = 4.6;  // 从 14 改为 4.6
    farmerGroup.add(hat);

    // 农夫手臂（两个圆柱体）缩小三倍
    const armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2.7, 8);  // 从 1,1,8 改为 0.3,0.3,2.7
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x4169E1 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1.3, 1.3, 0);  // 从 -4,4 改为 -1.3,1.3
    leftArm.rotation.z = Math.PI / 4;
    farmerGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1.3, 1.3, 0);  // 从 4,4 改为 1.3,1.3
    rightArm.rotation.z = -Math.PI / 4;
    farmerGroup.add(rightArm);

    return farmerGroup;
}

// 修改碰撞检测范围
function getObstaclePositions() {
    const obstacles = {
        // 树木的碰撞区域（每棵树占据一个格子）
        trees: trees.map(tree => ({
            x: Math.floor((tree.position.x + 50) / GRID_SIZE),
            y: Math.floor((tree.position.z + 50) / GRID_SIZE)
        })),
        // 农夫的碰撞区域（使用更大的圆形区域）
        farmer: {
            x: Math.floor((farmer.position.x + 50) / GRID_SIZE),
            y: Math.floor((farmer.position.z + 50) / GRID_SIZE),
            radius: 3  // 从 5 改为 3，因为农夫变小了
        }
    };
    return obstacles;
}

// 修改导出对象
window.gameScene = {
    getObstaclePositions: getObstaclePositions
};

// 初始化3D场景
document.addEventListener('DOMContentLoaded', init3DScene); 