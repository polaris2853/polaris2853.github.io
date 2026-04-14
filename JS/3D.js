import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* CÁC ĐỊNH NGHĨA CƠ BẢN */

// Khung cảnh
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.1); // Sương mù

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.y = 1.8; // Chiều cao của góc nhìn

const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	|| (window.innerWidth <= 1024);

const renderer = new THREE.WebGLRenderer({
	antialias: false,
	powerPreference: "low-power",
	failIfMajorPerformanceCaveat: false // Chạy kể cả khi hiệu năng thấp
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xffffff);
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

// Joystick cho điện thoại
if (isMobileOrTablet) {
	// Joystick
	const joystick = nipplejs.create({
		zone: document.getElementById('joystick-zone'),
		mode: 'static',
		position: { left: '75px', bottom: '75px' },
		color: '#66edff',
		size: 100
	});

	joystick.on('move', (evt, data) => {
		isMoving = true;
		moveDir.x = data.vector.x;
		moveDir.y = data.vector.y;
	});

	joystick.on('end', () => {
		isMoving = false;
		moveDir = { x: 0, y: 0 };
	});

	// Xoay màn hình bằng tay phải
	window.addEventListener('touchstart', (e) => { // EventListener bắt đầu khi có chạm màn hình
		// Chỉ nhận diện xoay nếu chạm vào nửa bên phải màn hình
		if (e.touches[0].clientX > window.innerWidth / 2) {
			isTouching = true;
			previousTouch.x = e.touches[0].clientX;
			previousTouch.y = e.touches[0].clientY;
		}
	}, { passive: false });

	window.addEventListener('touchmove', (e) => { // Vuốt
		if (!isTouching) return;
		e.preventDefault(); // Chặn cuộn trang mặc định của điện thoại

		const touch = e.touches[0];
		const deltaX = touch.clientX - previousTouch.x;
		const deltaY = touch.clientY - previousTouch.y;

		lon -= deltaX * lookSensitivity;
		lat -= deltaY * lookSensitivity;
		lat = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, lat));

		previousTouch.x = touch.clientX;
		previousTouch.y = touch.clientY;
	}, { passive: false });

	window.addEventListener('touchend', () => {
		isTouching = false;
	});

}

/* Setting cho render */
const SETTINGS = {
	imagePath: 'asserts/img/',
	jsonPath: 'asserts/img/images.json',
	renderDistance: 30,
	dotThreshold: 0.3 // Tích vô hướng góc nhìn khoảng 90-100 độ
};

let hoveredObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/* THIẾT KẾ UI */
const infoUI = document.createElement('div');
infoUI.id = 'info-panel';

// CSS
Object.assign(infoUI.style, {
	position: 'fixed',
	top: '20px', // Cách mép trên
	right: '-450px',
	width: '380px',
	height: 'calc(100% - 40px)', // Cách mép dưới
	// Gradient Xanh Teal + Tím nhạt + Hồng tro
	background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(10, 40, 50, 0.5))',
	color: 'white',
	padding: '50px 40px',
	boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
	border: '1px solid rgba(255, 255, 255, 0.18)',
	borderRadius: '20px 0 0 20px', // Bo góc bên trái
	transition: '0.8s cubic-bezier(0.16, 1, 0.3, 1)', // Hiệu ứng trượt
	zIndex: '1000',
	backdropFilter: 'blur(15px)', // Tăng độ nhòe
	fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	overflowY: 'auto',
	pointerEvents: 'none'
});

infoUI.innerHTML = `
    <div id="close-ui" style="font-size: 1rem; margin-bottom: 5px; color: #fff; text-shadow: 0 0 10px rgba(102, 237, 255, 0.5);">✕ CLOSE</div>
    <div style="margin-top: 20px;">
        <h2 id="ui-name" style="font-size: 2.2rem; font-weight: 300; letter-spacing: 2px; margin-bottom: 5px; color: #fff; text-shadow: 0 0 10px rgba(102, 237, 255, 0.5);"></h2>
        <div id="ui-role" style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 3px; color: #66edff; margin-bottom: 30px; opacity: 0.8;"></div>
    </div>

    <div style="width: 40px; height: 2px; background: #66edff; margin-bottom: 30px;"></div>

    <div style="position: relative;">
        <p id="ui-story" style="line-height: 1.8; font-size: 1.05rem; font-weight: 300; color: rgba(255,255,255,0.9); font-style: italic;"></p>
        <span style="position: absolute; top: -20px; left: -10px; font-size: 80px; color: rgba(255,255,255,0.05); font-family: serif; pointer-events: none;">“</span>
    </div>

    <div style="margin-top: 60px; font-size: 0.7rem; opacity: 0.3; letter-spacing: 1px;">
        MEMORIES VOID
    </div>`;
document.body.appendChild(infoUI);

document.getElementById('close-ui').onclick = () => {
	infoUI.style.right = '-400px';
	infoUI.style.pointerEvents = 'none';
};

/* Render vật thể */

// Vì chỉ render 1 vật thể nên có thể sử dụng TextureLoader cho đơn giản
const textureLoader = new THREE.TextureLoader();

// Vật thể: Sách
const bookSize = { width: 0.6, height: 0.1, depth: 0.8 }; // Dimension của quyển sách
const bookGeometry = new THREE.BoxGeometry(bookSize.width, bookSize.height, bookSize.depth);

// Load texture bìa sách
const bookTexture = textureLoader.load('asserts/img/book-cover.jpg');
bookTexture.minFilter = THREE.NearestFilter;

const bookMaterial = new THREE.MeshBasicMaterial({ map: bookTexture });
const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial);

// Đặt quyển sách nằm trên mặt bục đá
// Vị trí Y = Chiều cao bục + nửa chiều cao sách
bookMesh.position.set(0, bookSize.height / 2, -5);

bookMesh.rotation.y = Math.PI / -6; // Xoay sách khoảng -30 độ

bookMesh.userData = {
	isBook: true,
	url: 'timeline.html' // Lưu đường dẫn cần chuyển hướng
};

scene.add(bookMesh);

// Vật thể: Ảnh cá nhân

async function loadMemories() {
	try {
		const res = await fetch(SETTINGS.jsonPath);
		const dataList = await res.json();

		// Await để tránh đứng trình duyệt khi giải nén ảnh Hi-res
		for (const data of dataList) {
			create3DFragment(`${SETTINGS.imagePath}${data.file}`, data);
			await new Promise(r => setTimeout(r, 50));
		}
	} catch (err) {
		console.error("Lỗi data:", err);
	}
}

function create3DFragment(url, data) {
	const loader = new THREE.ImageBitmapLoader();
	// Sử dụng ImageBitmapLoader thay cho TextureLoader tránh làm treo UI
	loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });

	loader.load(url, (imageBitmap) => {
		const texture = new THREE.CanvasTexture(imageBitmap);
		texture.generateMipmaps = false;
		texture.minFilter = THREE.NearestFilter;

		const aspect = texture.image.width / texture.image.height;
		const geometry = new THREE.PlaneGeometry(0.8 * aspect, 0.8);
		const material = new THREE.MeshBasicMaterial({
			map: texture,
			side: THREE.DoubleSide,
			transparent: false,
			opacity: 0 // Khởi tạo ẩn để fade-in ở UpdateFrame
		});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set((Math.random() - 0.5) * 60, (Math.random() + 1.2), (Math.random() - 0.5) * 60);
		mesh.rotation.y = Math.random() * Math.PI;

		mesh.userData = { ...data, isPhoto: true };
		scene.add(mesh);
	});
}

/* Tương tác */

function handleInteractions() {
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children);

	// Kiểm tra xem có va chạm với đối tượng nào không
	if (intersects.length > 0) {
		const target = intersects[0].object;

		// Nếu chạm vào Sách
		if (target.userData.isBook) {
			document.body.style.cursor = 'pointer';
			hoveringAnywhere = true;
		}

		// Nếu chạm vào một tấm ảnh và đó là tấm ảnh mới (tránh cập nhật UI liên tục)
		if (target.userData.isPhoto) {
			if (target !== hoveredObject) {
				hoveredObject = target;

				// Thêm dữ liệu vào UI
				document.getElementById('ui-name').innerText = target.userData.name;
				document.getElementById('ui-role').innerText = target.userData.role;
				document.getElementById('ui-story').innerText = target.userData.story;

				// Hiện panel
				infoUI.style.right = '0px';
				infoUI.style.pointerEvents = 'auto';
				document.body.style.cursor = 'pointer';
			}
			// Nếu đang hover, thoát hàm không chạy phần "else" bên dưới
			return;
		}
	}

	// Pointer không chạm vào chạm vào vật thể
	if (hoveredObject !== null) {
		hoveredObject = null; // Reset biến tạm

		// Thu panel
		infoUI.style.right = '-400px';
		infoUI.style.pointerEvents = 'none';
		document.body.style.cursor = 'default';
	}
}

// Update 1 frame ở trong loop animate()
function updateFrame() {
	const camDir = new THREE.Vector3();
	camera.getWorldDirection(camDir);

	scene.children.forEach(obj => {
		if (!obj.userData.isPhoto) return;

		const vToObj = obj.position.clone().sub(camera.position).normalize();
		const dot = camDir.dot(vToObj);
		const dist = camera.position.distanceTo(obj.position);

		// Chỉ render vật thể khi vật thể nằm trong trường nhìn và không xa hơn renderDistance
		if (dot > SETTINGS.dotThreshold && dist < SETTINGS.renderDistance) {
			obj.visible = true;

			// Fade in
			obj.material.opacity = THREE.MathUtils.lerp(obj.material.opacity, 1, 0.05);

			// Nếu ở quá gần (< 5 đơn vị), đảm bảo texture luôn đạt độ nét cao nhất
			if (dist < 5) {
				obj.material.precision = "highp";
			}
		} else {
			// Nếu ở sau lưng hoặc quá xa
			obj.visible = true;
			obj.material.precision = "lowp";
		}
	});

	handleInteractions(); // Gọi hàm Raycaster đã viết ở trên
}

// Event Listening: Di chuột

window.addEventListener('mousemove', (e) => {
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

loadMemories();


/* Tính toán */

// Chuyển động
const clock = new THREE.Clock(); // Sử dụng với delta bên dưới để chuyển động mượt mà

function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	updateFrame();
	if (controls.isLocked) {
		const delta = clock.getDelta(); // Khoảng cách mỗi frame: máy mạnh frame cao, delta nhỏ, máy yếu frame thấp, delta cao
		const speed = 60.0; // Tốc độ di chuyển

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

window.addEventListener('click', () => {
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		const obj = intersects[0].object;
		if (obj.userData.isBook && obj.userData.url) {
			window.location.href = obj.userData.url;
		}
	}
});