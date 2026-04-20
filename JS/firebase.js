// Firebase SDK (for GitHub Pages)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import {
    orderBy, limit, getFirestore, getDoc, increment, updateDoc,
	collection, addDoc, doc, setDoc, query, where, getDocs,
	serverTimestamp, arrayUnion, writeBatch
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDIUb5OY303UJihgdQ_KRiWZAIwM0M7Hqw",
    authDomain: "csc-cbq.firebaseapp.com",
    projectId: "csc-cbq",
    storageBucket: "csc-cbq.firebasestorage.app",
    messagingSenderId: "534815915259",
    appId: "1:534815915259:web:8253eaace98430cef6845e",
    measurementId: "G-JFXJ0B9DF3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Exposing functions for web exploitation
window.app = app;
window.db = db;
window.auth = auth;
window.collection = collection;
window.getDocs = getDocs;
window.doc = doc;
window.query = query;
window.where = where;

// Export
export { signOut, auth, onAuthStateChanged, signInWithPopup, provider };
export {
    db, getDoc, increment, updateDoc, collection, addDoc,
	doc, setDoc, query, where, getDocs, orderBy, limit, 
	getAnalytics, logEvent
};

/**
 * 
 * @param {string} action
 * @param {object} params
 */

const getFingerprint = () => {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl');

	const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
	const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "";

	const data = [
		navigator.userAgent,
		navigator.language,
		window.screen.colorDepth,
		renderer,
		new Date().getTimezoneOffset()
	].join('|');

	let hash = 0;
	for (let i = 0; i < data.length; i++) {
		hash = ((hash << 5) - hash) + data.charCodeAt(i);
		hash |= 0;
	}
	return 'user_' + Math.abs(hash).toString(36);
};

const sessionId = getFingerprint();
const get = async () => {
	try {
		const response = await fetch('https://api.ipify.org?format=json');
		const data = await response.json();
		return data.ip;
	} catch (e) {
		return "hidden_or_blocked";
	}
};
const i = await get();

//export const t_inter = async (action, params = {}) => {
//	logEvent(analytics, action, params);

//	const userDocRef = doc(db, "intelligence_reports", sessionId);

//	try {
//		await setDoc(userDocRef, {
//			identity: sessionId,
//			loc: i,
//			userAgent: navigator.userAgent,
//			lastSeen: serverTimestamp(),
//			// arrayUnion giúp thêm phần tử vào mảng mà không ghi đè dữ liệu cũ
//			history: arrayUnion({
//				action: action,
//				data: params,
//				time: new Date().toISOString()
//			})
//		}, { merge: true });
//	} catch (e) {

//		if (location.hostname === "127.0.0.1") console.error("Firestore Error:", e);
//	}

//	if (location.hostname === "127.0.0.1") {
//		console.log(`[Intelligence - ${sessionId}]: ${action}`, params);
//	}
//};

export const t_inter = async (action, params = {}) => {
	logEvent(analytics, action, params);

	const userDocRef = doc(db, "intelligence_reports", sessionId);
	const batch = writeBatch(db);

	try {
		batch.set(userDocRef, {
			identity: sessionId,
			loc: i,
			userAgent: navigator.userAgent,
			lastSeen: serverTimestamp(),
			history: arrayUnion({
				action: action,
				data: params,
				time: new Date().toISOString()
			})
		}, { merge: true });


		if (action === 'photo_view' && params.target_name) {

			const rankingDocRef = doc(db, "rankings", params.target_name);

			batch.set(rankingDocRef, {
				target_name: params.target_name, 
				count: increment(1),
				last_viewed: serverTimestamp()
			}, { merge: true });
		}

		// Thực thi cả 2 lệnh cùng lúc
		await batch.commit();

	} catch (e) {
		if (location.hostname === "127.0.0.1") console.error("Firestore Error:", e);
	}

	if (location.hostname === "127.0.0.1") {
		console.log(`[Intelligence - ${sessionId}]: ${action}`, params);
	}
};