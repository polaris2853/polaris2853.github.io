/**
 * GALLERY CORE CONFIGURATION
 * Base URL for R2 bucket storage. All asset paths are relative to this root.
 */
const BUCKET_BASE_URL = "https://pub-d0ee6bf954ad4bb68d200ac965c57765.r2.dev/";

/**
 * GALLERY REGISTRY
 * A data structure representing folders and their content.
 * 'startFrom' is an optional override used to shift sequence numbering (e.g. startFrom: 36 makes the img stack starts from Image36.webp).
 */
const galleryRegistry = [
	{ type: "sequence", label: "Máy 01", path: "May_01", totalCount: 2030 },
	{ type: "sequence", label: "Máy 02", path: "May_02", totalCount: 1400, startFrom: 36 },
	{ type: "sequence", label: "Máy 03", path: "May_03", totalCount: 998 },
	{ type: "sequence", label: "Máy 04", path: "May_04", totalCount: 1200 },

	{ type: "sequence", label: "Sequence - Cá Nhân", path: "Sequence/ca_nhan", totalCount: 49 },
	{ type: "sequence", label: "Sequence - Current", path: "Sequence/current", totalCount: 51 },
	{ type: "sequence", label: "Sequence - Old", path: "Sequence/old", totalCount: 96 },

	{ type: "sequence", label: "Zalo", path: "Zalo", totalCount: 778 },
	{ type: "sequence", label: "Random", path: "Random", totalCount: 91 },


	{
		type: "video",
		label: "Videos",
		path: "Video",
		files: [
			"Sequence X.mp4",
			"7756847662610.mp4",
			"7756847752709.mp4",
			"7756847757375.mp4",
			"7794882395980.mp4",
			"7846513482900.mp4",
			"7847715962887.mp4",
			"7850360960700.mp4",
			"7850360964091.mp4",
			"7851491720754.mp4",
			"7851501645465.mp4",
			"7851502031671.mp4",
			"7851503381311.mp4",
			"7851505797408.mp4",
			"7851506658507.mp4",
			"7851513316981.mp4",
			"7851513320337.mp4",
			"7851513324927.mp4",
			"7851513325217.mp4",
			"7851513328605.mp4",
			"7851513332260.mp4",
			"7851513333697.mp4",
			"7851513337112.mp4",
			"7851513341660.mp4",
			"7851513342680.mp4",
			"7851513345384.mp4",
			"7851513349358.mp4",
			"7851513351394.mp4",
			"7851513355826.mp4",
			"7851513357067.mp4",
			"7851513358745.mp4",
			"7851513364742.mp4",
			"7851513367268.mp4",
			"7851513771421.mp4",
			"7851514038603.mp4",
			"7851514476874.mp4",
			"7851514887904.mp4",
			"7851516278549.mp4",
			"7851516429377.mp4",
			"7851516925329.mp4",
			"7851517187413.mp4",
			"7851936967718.mp4",
			"7855264216357.mp4",
			"7855272072208.mp4",
			"7855272957138.mp4",
			"7855273451986.mp4",
			
		]
	}
];


const folderView = document.getElementById("folder-view");
const itemView = document.getElementById("item-view");
const backButton = document.getElementById("back-button");

/**
 * Renders the home screen folder stack selection grid on page load
 */
//function initGallery() {
//	folderView.innerHTML = ""; // Clear existing grid layout

//	galleryRegistry.forEach((folder, index) => {
//		let img1, img2, img3;

//		if (folder.type === "video") {
//			// Uses a local image fallback for the video folder to preserve the uniform layout
//			img1 = "asserts/img/01. Lê Công Hải Anh.webp";
//			img2 = "asserts/img/01. Lê Công Hải Anh.webp";
//			img3 = "asserts/img/01. Lê Công Hải Anh.webp";
//		} else {
//			// WebP folders pull their preview assets dynamically right from R2
//			img1 = `${BUCKET_BASE_URL}${folder.path}/Image01.webp`;
//			img2 = `${BUCKET_BASE_URL}${folder.path}/Image02.webp`;
//			img3 = `${BUCKET_BASE_URL}${folder.path}/Image03.webp`;
//		}

//		// Generate the folder card HTML structure
//		const folderHTML = `
//            <div class="folder-card" onclick="openFolder(${index})">
//                <div class="image-stack">
//                    <div class="photo layer-3" style="background-image: url('${img3}'); background-size: cover; background-position: center;"></div>
//                    <div class="photo layer-2" style="background-image: url('${img2}'); background-size: cover; background-position: center;"></div>
//                    <div class="photo layer-1">
//                        <img src="${img1}" alt="${folder.label} Cover" loading="lazy">
//                    </div>
//                </div>
//                <h3 class="folder-label">${folder.label}</h3>
//            </div>
//        `;
//		folderView.insertAdjacentHTML("beforeend", folderHTML);
//	});
//}

/**
 * INITIAL GALLERY RENDER
 * Populates the home screen. Uses a 'deferred hydration' pattern:
 * 1. Build the DOM structure with placeholder placeholders.
 * 2. Delay the heavy asset network requests (100ms) to prioritize main-thread smoothness.
 * 3. Use texture/asset path cloning (img2=img1) to minimize R2 request count by 66%.
 */

function initGallery() {
	folderView.innerHTML = ""; // Clear existing layout

	galleryRegistry.forEach((folder, index) => {
		let img1, img2, img3;

		if (folder.type === "video") {
			// Local fallback covers (no network overhead)
			img1 = "asserts/timeline/ảnh1.jpeg";
			img2 = "asserts/img/01. Lê Công Hải Anh.webp";
			img3 = "asserts/img/01. Lê Công Hải Anh.webp";

			// Render video folder instantly since assets are local
			const folderHTML = `
                <div class="folder-card" onclick="openFolder(${index})">
                    <div class="image-stack">
                        <div class="photo layer-3" style="background-image: url('${img3}'); background-size: cover; background-position: center;"></div>
                        <div class="photo layer-2" style="background-image: url('${img2}'); background-size: cover; background-position: center;"></div>
                        <div class="photo layer-1">
                            <img src="${img1}" alt="${folder.label} Cover">
                        </div>
                    </div>
                    <h3 class="folder-label">${folder.label}</h3>
                </div>
            `;
			folderView.insertAdjacentHTML("beforeend", folderHTML);
		} else {

			const startIdx = folder.startFrom ? folder.startFrom : 1;

			// Generate the sequential filenames dynamically
			const file1 = `Image${String(startIdx).padStart(2, '0')}.webp`;     // e.g., Image36.webp
			const file2 = `Image${String(startIdx + 1).padStart(2, '0')}.webp`; // e.g., Image37.webp
			const file3 = `Image${String(startIdx + 2).padStart(2, '0')}.webp`; // e.g., Image38.webp

			img1 = `${BUCKET_BASE_URL}${folder.path}/${file1}`;
			img2 = img1;
			img3 = img1;

			const folderHTML = `
                <div class="folder-card" onclick="openFolder(${index})">
                    <div class="image-stack">
                        <div class="photo layer-3 deferred-bg" data-src="${img3}"></div>
                        <div class="photo layer-2 deferred-bg" data-src="${img2}"></div>
                        <div class="photo layer-1">
                            <img class="deferred-img" data-src="${img1}" alt="${folder.label} Cover" loading="lazy">
                        </div>
                    </div>
                    <h3 class="folder-label">${folder.label}</h3>
                </div>
            `;
			folderView.insertAdjacentHTML("beforeend", folderHTML);
		}
	});

	// Defer asset loading until DOM is fully parsed to eliminate UI jank
	window.addEventListener("DOMContentLoaded", () => {
		setTimeout(() => {
			const deferredBgs = document.querySelectorAll('.deferred-bg');
			deferredBgs.forEach(layer => {
				const realSrc = layer.getAttribute('data-src');
				layer.style.backgroundImage = `url('${realSrc}')`;
				layer.style.backgroundSize = 'cover';
				layer.style.backgroundPosition = 'center';
			});

			const deferredImgs = document.querySelectorAll('.deferred-img');
			deferredImgs.forEach(img => {
				img.src = img.getAttribute('data-src');
			});
		}, 10); 
	});
}

/**
 * Swaps view contexts and loops out the interior contents of the clicked folder
 * @param {number} index - The array index location inside galleryRegistry
 */
// Global state trackers for pagination
let currentFolderData = null;
let currentRenderedIndex = 0;
const ITEMS_PER_PAGE = 60; // Perfect chunk size to fill the screen without lag

function openFolder(index) {
	const folder = galleryRegistry[index];
	itemView.innerHTML = ""; // Clear previous view

	// Store current folder context in global state
	currentFolderData = folder;
	currentRenderedIndex = 0;

	// Render the very first chunk immediately
	renderNextChunk();

	// View state swap
	folderView.classList.add("hidden");
	itemView.classList.remove("hidden");
	backButton.classList.remove("hidden");
	window.scrollTo(0, 0);
}

/**
 * Appends the next batch of items to the DOM
 */
function renderNextChunk() {
	if (!currentFolderData) return;

	const start = currentRenderedIndex + 1;
	let end = currentRenderedIndex + ITEMS_PER_PAGE;

	// Handle WebP image sequences
	if (currentFolderData.type === "sequence") {
		if (end > currentFolderData.totalCount) end = currentFolderData.totalCount;
		if (start > end) return; // All items already rendered

		let chunkHTML = "";
		for (let i = start; i <= end; i++) {
			const paddedNumber = String(i).padStart(2, '0');
			const fileName = `Image${paddedNumber}.webp`;
			const completeUrl = `${BUCKET_BASE_URL}${currentFolderData.path}/${fileName}`;

			chunkHTML += `
                <div class="item-card" onclick="openLightbox('${completeUrl}', 'image')">
                    <div class="image-stack">
                        <div class="photo layer-1">
                            <img src="${completeUrl}" alt="Item ${paddedNumber}" loading="lazy">
                        </div>
                    </div>
                    <h3 class="folder-label">Image ${paddedNumber}</h3>
                </div>
            `;
		}
		itemView.insertAdjacentHTML("beforeend", chunkHTML);
		currentRenderedIndex = end;
	}
	// Handle chaotic video folder arrays
	else if (currentFolderData.type === "video") {
		const totalFiles = currentFolderData.files.length;
		const arrayStart = currentRenderedIndex;
		let arrayEnd = currentRenderedIndex + ITEMS_PER_PAGE;

		if (arrayEnd > totalFiles) arrayEnd = totalFiles;
		if (arrayStart >= totalFiles) return;

		let chunkHTML = "";
		for (let i = arrayStart; i < arrayEnd; i++) {
			const fileName = currentFolderData.files[i];
			const completeUrl = `${BUCKET_BASE_URL}${currentFolderData.path}/${fileName}`;

			// We write an empty video source and pass the real link into "data-src"
			chunkHTML += `
                <div class="item-card">
                    <div class="image-stack">
                        <div class="photo layer-1" style="background:#111;">
                            <video controls preload="metadata" class="lazy-video" data-src="${completeUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
                                <source src="" type="video/mp4">
                            </video>
                        </div>
                    </div>
                    <h3 class="folder-label" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fileName}">
                        ${fileName}
                    </h3>
                </div>
            `;
		}

		itemView.insertAdjacentHTML("beforeend", chunkHTML);
		currentRenderedIndex = arrayEnd;

		// Fire the observer to watch these newly generated elements
		observeLazyVideos();
	}
}

// Global placeholder for our scroll-watcher connection
let videoObserver = null;

/**
 * Attaches real-time viewport tracking to unrendered video tags
 */
function observeLazyVideos() {
	const lazyVideos = document.querySelectorAll('.lazy-video:not([data-observed])');

	// Fallback if the browser is prehistoric, just load them out right
	if (!('IntersectionObserver' in window)) {
		lazyVideos.forEach(video => loadVideoSource(video));
		return;
	}

	if (!videoObserver) {
		videoObserver = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				const video = entry.target;

				if (entry.isIntersecting) {
					// Item scrolled INTO view: Connect the stream path
					loadVideoSource(video);
				} else {
					// Item scrolled OUT of view: Drop the stream connection to save browser memory
					unloadVideoSource(video);
				}
			});
		}, {
			rootMargin: "200px 0px" // Preloads assets 200px before they hit the visible screen edge
		});
	}

	lazyVideos.forEach(video => {
		video.setAttribute('data-observed', 'true'); // Flag it so we don't duplicate listeners
		videoObserver.observe(video);
	});
}

function loadVideoSource(video) {
	const source = video.querySelector('source');
	const realSrc = video.getAttribute('data-src');

	if (source && source.src !== realSrc) {
		source.src = realSrc;
		video.load(); // Forces the browser to stream just the metadata cover frame
	}
}

function unloadVideoSource(video) {
	const source = video.querySelector('source');
	if (source && source.src !== "") {
		source.src = "";
		video.removeAttribute("src"); // Fully empties the element out
		video.load(); // Frees the network socket immediately
	}
}


/**
 * Listen for scrolling actions to automatically fetch more items near the bottom
 */
window.addEventListener("scroll", () => {
	// Only check scroll depth if the interior item view is actively visible
	if (!itemView.classList.contains("hidden")) {
		const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

		// Trigger next load when the user scrolls within 800px of the bottom
		if (scrollTop + clientHeight >= scrollHeight - 800) {
			renderNextChunk();
		}
	}
});

// Reset global tracking context when returning to home view
function showFolderView() {
	currentFolderData = null;
	currentRenderedIndex = 0;

	itemView.classList.add("hidden");
	backButton.classList.add("hidden");
	folderView.classList.remove("hidden");
	window.scrollTo(0, 0);
}

// Kick off initial compilation when the document is parsed
initGallery();


// DIALOG script
// Grab Lightbox DOM Elements
const lightboxModal = document.getElementById("lightbox-modal");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxVideo = document.getElementById("lightbox-video");
const lightboxCloseBtn = document.getElementById("lightbox-close-btn");

/**
 * Intercepts asset path data and launches the top-layer view panel
 */
function openLightbox(src, type) {
	// Reset views
	lightboxImg.classList.add("hidden");
	lightboxVideo.classList.add("hidden");
	lightboxImg.src = "";
	lightboxVideo.src = "";

	if (type === "image") {
		lightboxImg.src = src;
		lightboxImg.classList.remove("hidden");
	} else if (type === "video") {
		lightboxVideo.src = src;
		lightboxVideo.classList.remove("hidden");
		lightboxVideo.play().catch(() => { }); // Optional autoplay on load
	}

	lightboxModal.showModal(); // Launches native high-priority overlay layer
}

function closeLightbox() {
	lightboxModal.close();
	lightboxVideo.pause(); // Kills video audio tracks instantly upon exiting
	lightboxImg.src = "";
	lightboxVideo.src = "";
}

// Close Triggers
lightboxCloseBtn.addEventListener("click", closeLightbox);

// Close if user clicks outside the image frame on the dark backdrop array
lightboxModal.addEventListener("click", (e) => {
	if (e.target === lightboxModal) closeLightbox();
});