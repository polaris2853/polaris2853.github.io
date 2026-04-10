import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* SETUP CÁC ĐỊNH NGHĨA CƠ BẢN*/

// Khung cảnh
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.02); // Sương mù

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.8; // Chiều cao góc nhìn

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Điều khiển
const controls = new PointerLockControls(camera, document.body);

// UI
const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => instructions.style.display = 'none');
controls.addEventListener('unlock', () => instructions.style.display = 'flex');

scene.add(controls.getObject());

// Theo dõi event bấm nút di chuyển WASD
const keys = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

document.addEventListener('keydown', (e) => onKeyPress(e, true));
document.addEventListener('keyup', (e) => onKeyPress(e, false));

function onKeyPress(event, isPressed) {
	switch (event.code) {
		case 'KeyW': case 'ArrowUp': keys.forward = isPressed; break;
		case 'KeyS': case 'ArrowDown': keys.backward = isPressed; break;
		case 'KeyA': case 'ArrowLeft': keys.left = isPressed; break;
		case 'KeyD': case 'ArrowRight': keys.right = isPressed; break;
	}
}



/* RENDER VẬT THỂ */

// Nền đất
const gridHelper = new THREE.GridHelper(100, 100, 0x333333, 0x111111);
scene.add(gridHelper);

// Khối Lập Phương
const geometry = new THREE.BoxGeometry(1, 1, 1);
for (let i = 0; i < 100; i++) {
	const material = new THREE.MeshBasicMaterial({
		color: 0x66edff,
		wireframe: true
	});
	const cube = new THREE.Mesh(geometry, material);
	cube.position.set(
		(Math.random() - 0.5) * 100,
		Math.random() * 5,
		(Math.random() - 0.5) * 100
	);
	scene.add(cube);
}
const loader = new THREE.TextureLoader();

// Vật thể: Ảnh
// 1. Tạo giao diện hiện thông tin ảnh/cá nhân (Mép phải màn hình)
const infoUI = document.createElement('div');
infoUI.id = 'info-panel';
infoUI.style = `
    position: fixed; top: 0; right: -400px; width: 350px; height: 100%;
    background: rgba(0, 0, 0, 0.85); color: white; padding: 40px;
    box-shadow: -5px 0 15px rgba(0,0,0,0.5); border-left: 2px solid #66edff;
    transition: 0.5s ease; z-index: 1000; backdrop-filter: blur(10px);
    font-family: sans-serif;
`;
infoUI.innerHTML = `
    <div id="close-ui" style="position: absolute; top: 20px; right: 20px; cursor: pointer; font-size: 24px;">✕</div>
    <h2 id="ui-name" style="color: #66edff; margin-bottom: 5px;"></h2>
    <p id="ui-role" style="font-style: italic; color: #aaa; margin-bottom: 20px;"></p>
    <hr style="border: 0; border-top: 1px solid #333; margin-bottom: 20px;">
    <p id="ui-story" style="line-height: 1.6; font-size: 1.1rem;"></p>
`;
document.body.appendChild(infoUI);

// Đóng UI khi bấm nút X
document.getElementById('close-ui').onclick = () => infoUI.style.right = '-400px';

// 2. Load Memories với Data-Driven
async function loadMemories() {
	try {
		const response = await fetch('asserts/timeline/images.json');
		const dataList = await response.json();

		dataList.forEach(data => {
			const fullPath = `asserts/timeline/${data.file}`;
			create3DFragment(fullPath, data); // Truyền data
		});
	} catch (error) {
		console.error("Lỗi danh bạ:", error);
	}
}

function create3DFragment(url, data) {
	const loader = new THREE.TextureLoader();
	loader.load(url, (texture) => {
		const aspect = texture.image.width / texture.image.height;
		const geometry = new THREE.PlaneGeometry(1 * aspect, 1);
		const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: false, opacity: 1.0 });
		const mesh = new THREE.Mesh(geometry, material);

		// Vị trí ngẫu nhiên
		mesh.position.set((Math.random() - 0.5) * 60, (Math.random() + 0.5) * 1.8, (Math.random() - 0.5) * 60);
		mesh.rotation.y = Math.random() * Math.PI;

		// --- GẮN DATA VÀO MESH (Cực kỳ quan trọng) ---
		mesh.userData = {
			name: data.name || "Ký ức vô danh",
			role: data.role || "Thành viên lớp",
			story: data.story || "Một khoảnh khắc đáng nhớ nhưng chưa được ghi lại chi tiết...",
			isPlaceholder: !data.name // Đánh dấu nếu đây là dữ liệu trống
		};

		scene.add(mesh);
	});
}

// 3. XỬ LÝ CLICK (Raycasting)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
	// Chuyển tọa độ chuột về hệ chuẩn của Three.js (-1 đến 1)
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		const target = intersects[0].object;
		if (target.userData.name) {
			// Đổ dữ liệu vào UI
			document.getElementById('ui-name').innerText = target.userData.name;
			document.getElementById('ui-role').innerText = target.userData.role;
			document.getElementById('ui-story').innerText = target.userData.story;
			// Hiện panel ra
			infoUI.style.right = '0px';
		}
	}
});

loadMemories();


/* PHẦN TÍNH TOÁN */

// Chuyển động
const clock = new THREE.Clock(); // Sử dụng với delta bên dưới để chuyển động mượt mà

function animate() {
	requestAnimationFrame(animate);

	if (controls.isLocked) {
		const delta = clock.getDelta(); // Khoảng cách cách mỗi frame: máy mạnh, frame cao, delta nhỏ, máy yếu frame thấp, delta cao
		const speed = 100.0; // Tốc độ di chuyển

		// Giảm tốc
		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		// Tình toán hướng di chuyển
		direction.z = Number(keys.forward) - Number(keys.backward);
		direction.x = Number(keys.right) - Number(keys.left);
		direction.normalize(); // tốc độ đồng đều khi di chuyển theo đường chéo

		// Vận tốc theo về các chiều
		if (keys.forward || keys.backward) velocity.z -= direction.z * speed * delta;
		if (keys.left || keys.right) velocity.x -= direction.x * speed * delta;

		// Chuyển động góc nhìn
		controls.moveRight(-velocity.x * delta);
		controls.moveForward(-velocity.z * delta);
	}

	renderer.render(scene, camera);
}

animate();

// Kích thước window
window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});