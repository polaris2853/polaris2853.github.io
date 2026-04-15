import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/* CÁC ĐỊNH NGHĨA CƠ BẢN */

// Khung cảnh
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffffff, 0.15); // Sương mù

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.y = 1.8; // Chiều cao của góc nhìn

// Các biến trạng thái cho điều khiển Mobile
let isTouching = false;
let previousTouch = { x: 0, y: 0 };
let lat = 0, lon = 0; // Vĩ độ và kinh độ để tính toán hướng nhìn
let lookSensitivity = 0.005; // Độ nhạy (tăng giảm tùy ý)
let isMoving = false; // Trạng thái di chuyển cho Joystick
let moveDir = { x: 0, y: 0 };

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
const whiteTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
whiteTexture.minFilter = THREE.NearestFilter;

// Điều khiển
const controls = new PointerLockControls(camera, document.body);

// UI
const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => {
	// Lock chuột nếu KHÔNG PHẢI là mobile
	if (!isMobileOrTablet) {
		controls.lock();
	} else {
		instructions.style.display = 'none';
	}
});
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
	const joystickZone = document.getElementById('joystick-zone');

	// Joystick
	const joystick = nipplejs.create({
		zone: joystickZone,
		mode: 'static',
		position: { left: '75px', bottom: '75px' },
		color: '#555555',
		size: 100,
		zIndex: 1999
	});

	// Chặn sự kiện lan truyền tại vùng Joystick để không làm nhiễu Camera
	['touchstart', 'touchmove', 'touchend'].forEach(evt => {
		joystickZone.addEventListener(evt, (e) => e.stopPropagation(), { passive: false });
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

	// QUẢN LÝ XOAY CAMERA (MULTI-TOUCH)
	let activeTouchId = null; // ID của ngón tay đang dùng để xoay

	window.addEventListener('touchstart', (e) => {
		// Duyệt qua các điểm chạm mới
		for (let i = 0; i < e.changedTouches.length; i++) {
			const touch = e.changedTouches[i];

			// Nếu chạm ở nửa phải màn hình VÀ chưa có ngón tay nào đang xoay
			if (touch.clientX > window.innerWidth / 2 && activeTouchId === null) {
				activeTouchId = touch.identifier; // Lưu lại ID ngón tay này
				isTouching = true;
				previousTouch.x = touch.clientX;
				previousTouch.y = touch.clientY;
			}
		}
	}, { passive: false });

	window.addEventListener('touchmove', (e) => {
		if (!isTouching) return;

		// Tìm đúng ngón tay đang đảm nhận việc xoay trong danh sách touches
		let targetTouch = null;
		for (let i = 0; i < e.touches.length; i++) {
			if (e.touches[i].identifier === activeTouchId) {
				targetTouch = e.touches[i];
				break;
			}
		}

		if (targetTouch) {
			// Ngăn việc scroll trang khi đang xoay cam
			if (e.cancelable) e.preventDefault();

			const deltaX = targetTouch.clientX - previousTouch.x;
			const deltaY = targetTouch.clientY - previousTouch.y;

			// Cập nhật góc nhìn (nhân với độ nhạy)
			lon -= deltaX * lookSensitivity;
			lat -= deltaY * lookSensitivity;

			// Giới hạn góc nhìn
			lat = Math.max(-85 * (Math.PI / 180), Math.min(85 * (Math.PI / 180), lat));

			previousTouch.x = targetTouch.clientX;
			previousTouch.y = targetTouch.clientY;
		}
	}, { passive: false });

	window.addEventListener('touchend', (e) => {
		// Kiểm tra xem ngón tay vừa nhấc lên có phải là ngón tay đang xoay không
		for (let i = 0; i < e.changedTouches.length; i++) {
			if (e.changedTouches[i].identifier === activeTouchId) {
				isTouching = false;
				activeTouchId = null; // Giải phóng ID để ngón tay khác có thể dùng
			}
		}
	});
}

/* Setting cho render */
const SETTINGS = {
	imagePath: 'asserts/img/',
	jsonPath: 'asserts/img/images.json',
	renderDistance: 50,
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
	width: 'min(380px, 60%)',
	height: 'calc(100% - 40px)', // Cách mép dưới
	// Gradient Xanh Teal + Tím nhạt + Hồng tro
	background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(10, 40, 50, 0.5))',
	color: 'white',
	padding: '40px 30px',
	boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
	border: '1px solid rgba(255, 255, 255, 0.18)',
	borderRadius: '20px 0 0 20px', // Bo góc bên trái
	transition: '0.8s cubic-bezier(0.16, 1, 0.3, 1)', // Hiệu ứng trượt
	zIndex: '1000',
	backdropFilter: 'blur(15px)', // Tăng độ nhòe
	fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	overflowY: 'auto',
	overflowX: 'hidden',
	pointerEvents: 'auto', // Cho phép scroll
	WebkitOverflowScrolling: 'touch', // Cho iOS
	touchAction: 'pan-y'
});

infoUI.innerHTML = `
    <div id="close-ui" style="font-size: 1rem; margin-bottom: 5px; color: #fff; text-shadow: 0 0 10px rgba(102, 237, 255, 0.5);">✕ CLOSE</div>
    <div style="margin-top: 20px;">
        <h2 id="ui-name" style="font-size: 2rem; font-weight: 300; letter-spacing: 2px; margin-bottom: 5px; color: #fff; text-shadow: 0 0 10px rgba(102, 237, 255, 0.5);"></h2>
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
// Ngăn chặn sự kiện chạm (touch) trên UI làm xoay Camera 3D bên dưới
infoUI.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
infoUI.addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
infoUI.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });

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

//function create3DFragment(url, data) {
//	const loader = new THREE.ImageBitmapLoader();
//	loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });

//	if (isMobileOrTablet) {
//		// Mobile
//		// Chúng ta giả định aspect ratio từ data (nếu có) hoặc mặc định 1.33 (4:3)
//		const aspect = data.aspect || 1.33;
//		const geometry = new THREE.PlaneGeometry(0.8 * aspect, 0.8);
//		const material = new THREE.MeshBasicMaterial({
//			map: whiteTexture, // Sử dụng texture 1x1 dùng chung
//			side: THREE.DoubleSide,
//			transparent: true,
//			opacity: 0.1
//		});

//		const mesh = new THREE.Mesh(geometry, material);
//		mesh.position.set((Math.random() - 0.5) * 40, (Math.random() + 1.4), (Math.random() - 0.5) * 40);
//		mesh.rotation.y = Math.random() * Math.PI;

//		// Lưu thông tin để load sau
//		mesh.userData = {
//			...data,
//			isPhoto: true,
//			realTextureUrl: url,
//			textureLoaded: false
//		};
//		scene.add(mesh);

//	} else {
//		// PC
//		loader.load(url, (imageBitmap) => {
//			const texture = new THREE.CanvasTexture(imageBitmap);
//			texture.generateMipmaps = false;
//			texture.minFilter = THREE.NearestFilter;

//			const aspect = texture.image.width / texture.image.height;
//			const geometry = new THREE.PlaneGeometry(0.8 * aspect, 0.8);
//			const material = new THREE.MeshBasicMaterial({
//				map: texture,
//				side: THREE.DoubleSide,
//				transparent: true,
//				opacity: 0
//			});

//			const mesh = new THREE.Mesh(geometry, material);
//			mesh.position.set((Math.random() - 0.5) * 40, (Math.random() + 1.4), (Math.random() - 0.5) * 40);
//			mesh.rotation.y = Math.random() * Math.PI;

//			mesh.userData = { ...data, isPhoto: true, textureLoaded: true };
//			scene.add(mesh);
//		});
//	}
//}

function create3DFragment(url, data) {
	const loader = new THREE.ImageBitmapLoader();
	loader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });

	// Cấu hình chung
	const posX = (Math.random() - 0.5) * 35;
	const posY = (Math.random() + 1.4); // Độ cao ngẫu nhiên khoảng 1.4m - 2.4m
	const posZ = (Math.random() - 0.5) * 35;
	const rotationY = Math.random() * Math.PI;

	// Dây treo tranh
	const ropeHeight = 8; // Độ cao mà dây sẽ kéo lên
	const points = [];
	points.push(new THREE.Vector3(posX, posY + 0.4, posZ)); // Dây bắt đầu tại trung điểm đáy trên của ảnh
	points.push(new THREE.Vector3(posX, posY + ropeHeight, posZ)); // Điểm kết thúc ở phía trên

	const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({
		color: 0x000000,
		transparent: true,
		opacity: 0.3 // Để dây mờ vào fog tạo hiệu ứng vô tận
	});
	const rope = new THREE.Line(lineGeometry, lineMaterial);
	scene.add(rope);


	if (isMobileOrTablet) {
		const aspect = data.aspect || 1.33;
		const geometry = new THREE.PlaneGeometry(0.8 * aspect, 0.8);
		const material = new THREE.MeshBasicMaterial({
			map: whiteTexture,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.1
		});

		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(posX, posY, posZ);
		mesh.rotation.y = rotationY;

		mesh.userData = {
			...data,
			isPhoto: true,
			realTextureUrl: url,
			textureLoaded: false
		};
		scene.add(mesh);

	} else {
		loader.load(url, (imageBitmap) => {
			const texture = new THREE.CanvasTexture(imageBitmap);
			texture.generateMipmaps = false;
			texture.minFilter = THREE.NearestFilter;

			const aspect = texture.image.width / texture.image.height;
			const geometry = new THREE.PlaneGeometry(0.8 * aspect, 0.8);
			const material = new THREE.MeshBasicMaterial({
				map: texture,
				side: THREE.DoubleSide,
				transparent: true,
				opacity: 1
			});

			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(posX, posY, posZ);
			mesh.rotation.y = rotationY;

			mesh.userData = { ...data, isPhoto: true, textureLoaded: true };
			scene.add(mesh);
		});
	}
}

// Khởi tạo loader dùng chung để không phải tạo mới liên tục
const asyncLoader = new THREE.ImageBitmapLoader();
asyncLoader.setOptions({ imageOrientation: 'flipY', premultiplyAlpha: 'none' });

function loadRealTexture(mesh) {
	// Nếu đang tải hoặc đã tải rồi thì thoát
	if (mesh.userData.loading || mesh.userData.textureLoaded) return;

	mesh.userData.loading = true; // Đánh dấu trạng thái đang gánh dữ liệu

	asyncLoader.load(mesh.userData.realTextureUrl,
		(imageBitmap) => {
			// Chuyển ImageBitmap thành Texture
			const texture = new THREE.CanvasTexture(imageBitmap);
			texture.generateMipmaps = false;
			texture.minFilter = THREE.NearestFilter;

			// Thay thế texture trắng bằng texture thật
			mesh.material.map = texture;
			mesh.material.transparent = true;
			mesh.material.needsUpdate = true;

			// Đánh dấu đã xong
			mesh.userData.textureLoaded = true;
			mesh.userData.loading = false;
			mesh.material.opacity = 1;
		},
		undefined, // OnProgress (không cần)
		(err) => {
			console.error("Lỗi tải ký ức:", err);
			mesh.userData.loading = false;
		}
	);
}

/* Tương tác */

function handleInteractions() {
	// Đặt far mặc định là 10 để phát hiện vật thể từ xa (cho Cursor)
	raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
	raycaster.far = 10;

	const intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		const hit = intersects[0];
		const target = hit.object;
		const distance = hit.distance; // Khoảng cách từ camera đến vật thể

		// Sách
		if (target.userData.isBook) {
			document.body.style.cursor = 'pointer';
		}

		// Ảnh
		if (target.userData.isPhoto) {
			// Luôn đổi cursor nếu trong tầm 10 đơn vị
			document.body.style.cursor = 'pointer';

			// Hiện UI khi distance <= 4
			if (distance <= 4) {
				if (target !== hoveredObject) {
					hoveredObject = target;

					document.getElementById('ui-name').innerText = target.userData.name;
					document.getElementById('ui-role').innerText = target.userData.role;
					document.getElementById('ui-story').innerText = target.userData.story;

					infoUI.style.right = '0px';
					infoUI.style.pointerEvents = 'auto';
				}
				return; // Thoát sớm để giữ trạng thái UI
			}
			// Nếu ở khoảng cách 4 < d <= 10: Vẫn chạm ảnh nhưng đóng UI
			else {
				closeUI();
			}
			return;
		}
	}

	// 3. Nếu không chạm gì cả
	document.body.style.cursor = 'default';
	closeUI();
}

// Hàm đóng UI
function closeUI() {
	if (hoveredObject !== null) {
		hoveredObject = null;
		infoUI.style.right = '-450px';
		infoUI.style.pointerEvents = 'none';
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

		if (isMobileOrTablet) {
			// MOBILE
			const centerScreen = new THREE.Vector2(0, 0);

			if (dot > SETTINGS.dotThreshold && dist < SETTINGS.renderDistance) {
				obj.visible = true;

				// Kiểm tra xem có đang nhìn trực diện không
				raycaster.setFromCamera(centerScreen, camera);
				const intersects = raycaster.intersectObject(obj);

				if (intersects.length > 0) {
					loadRealTexture(obj); // Nhìn vào thì nạp
					obj.material.precision = "highp";
				} else {
					// UNLOAD TEXTURE
					// Ta có thể giữ lại texture nếu dist < 5
					if (obj.userData.textureLoaded && dist > 8) {
						unloadTexture(obj);
					}
					obj.material.precision = "lowp";
				}
			} else {
				// Ngoài tầm nhìn hoặc quá xa
				obj.visible = false;
				if (obj.userData.textureLoaded) {
					unloadTexture(obj);
				}
			}
		} else {
			// PC
			if (dot > SETTINGS.dotThreshold && dist < SETTINGS.renderDistance) {
				obj.visible = true;
				obj.material.opacity = THREE.MathUtils.lerp(obj.material.opacity, 1, 0.05);
			} else {
				obj.visible = true;
				obj.material.precision = "lowp";
			}
		}
	});

	handleInteractions();
}

// HÀM GIẢI PHÓNG VRAM
function unloadTexture(mesh) {
	if (!mesh.userData.textureLoaded) return;

	// Giải phóng bộ nhớ của texture hiện tại
	if (mesh.material.map && mesh.material.map !== whiteTexture) {
		mesh.material.map.dispose();
	}

	// Trả về texture trắng ban đầu
	mesh.material.map = whiteTexture;
	mesh.material.opacity = 0.2; // Làm mờ đi để user biết là nó đã unload
	mesh.material.needsUpdate = true;

	// Reset trạng thái trong userData
	mesh.userData.textureLoaded = false;
	mesh.userData.loading = false;
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

//function animate() {
//	requestAnimationFrame(animate);
//	renderer.render(scene, camera);
//	updateFrame();
//	if (controls.isLocked) {
//		const delta = clock.getDelta(); // Khoảng cách mỗi frame: máy mạnh frame cao, delta nhỏ, máy yếu frame thấp, delta cao
//		const speed = 60.0; // Tốc độ di chuyển

//		// Giảm tốc
//		velocity.x -= velocity.x * 10.0 * delta;
//		velocity.z -= velocity.z * 10.0 * delta;

//		// Tình toán hướng di chuyển
//		direction.z = Number(keys.forward) - Number(keys.backward);
//		direction.x = Number(keys.right) - Number(keys.left);
//		direction.normalize(); // tốc độ đồng đều khi di chuyển theo đường chéo

//		// Vận tốc theo về các chiều
//		if (keys.forward || keys.backward) velocity.z -= direction.z * speed * delta;
//		if (keys.left || keys.right) velocity.x -= direction.x * speed * delta;

//		// Chuyển động góc nhìn
//		controls.moveRight(-velocity.x * delta);
//		controls.moveForward(-velocity.z * delta);
//	}

//	renderer.render(scene, camera);
//}
function animate() {
	requestAnimationFrame(animate);

	const delta = clock.getDelta();

	if (isMobileOrTablet) {
		// Camera movement (Mobile)
		// Chuyển đổi lat/lon (độ) sang hướng nhìn của camera
		const target = new THREE.Vector3();
		target.x = camera.position.x + Math.sin(lon) * Math.cos(lat);
		target.y = camera.position.y + Math.sin(lat);
		target.z = camera.position.z + Math.cos(lon) * Math.cos(lat);
		camera.lookAt(target);

		// Joystick (Mobile)
		if (isMoving) {
			const speed = 0.15;

			// Lấy hướng nhìn của Camera
			const forward = new THREE.Vector3();
			camera.getWorldDirection(forward);
			forward.y = 0; // Đảm bảo không bay lên trời khi nhìn lên
			forward.normalize();

			const right = new THREE.Vector3();
			right.crossVectors(camera.up, forward).negate(); // Tính vector bên phải

			// nipplejs: data.vector.y dương là kéo lên, âm là kéo xuống
			// Nhân với vector hướng để đi đúng hướng camera đang nhìn
			const moveVector = new THREE.Vector3();
			moveVector.addScaledVector(forward, moveDir.y * speed);
			moveVector.addScaledVector(right, moveDir.x * speed);

			camera.position.add(moveVector);
		}
	} else {
		// PC
		if (controls.isLocked) {
			const speed = 60.0;
			velocity.x -= velocity.x * 10.0 * delta;
			velocity.z -= velocity.z * 10.0 * delta;

			direction.z = Number(keys.forward) - Number(keys.backward);
			direction.x = Number(keys.right) - Number(keys.left);
			direction.normalize();

			if (keys.forward || keys.backward) velocity.z -= direction.z * speed * delta;
			if (keys.left || keys.right) velocity.x -= direction.x * speed * delta;

			controls.moveRight(-velocity.x * delta);
			controls.moveForward(-velocity.z * delta);
		}
	}

	updateFrame();
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

	raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
	const intersects = raycaster.intersectObjects(scene.children);

	if (intersects.length > 0) {
		const obj = intersects[0].object;
		if (obj.userData.isBook && obj.userData.url) {

			if (controls.isLocked) controls.unlock();

			// Thực hiện chuyển hướng
			window.location.href = obj.userData.url;
		}
	}
});