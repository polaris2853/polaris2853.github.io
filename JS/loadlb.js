import { db, collection, getDocs, query, orderBy, limit } from "./firebase.js";

let rank = 1;

//async function loadLeaderboard() {

//	const playersRef = collection(db, "intelligence_reports");
//	const q = query(collection(db, "rankings"), orderBy("count", "desc"), limit(10));
//	const querySnapshot = await getDocs(q);

//	const tbody = document.querySelector("#leaderboard tbody");
//	tbody.innerHTML = ""; // clear table

//	// Scanning through each docs in the snapshot
//	querySnapshot.forEach((doc) => {
//		const data = doc.data();
//		const docid = doc.id;
//		let name = data.Name;

//		const row = document.createElement("tr");

//		// If user is (not) from exception list
//		if (admin.includes(docid)) {
//			name = `${data.Name} (Admin)`;
//			row.innerHTML = `
//				<th></th>
//				<th>${name}</th>
//				<th>${data.flagCount || 0}</th>
//				`;
//			tbody.appendChild(row);
//		} else if (bot.includes(docid)) {
//			name = `${data.Name}`;
//			row.innerHTML = `
//				<th></th>
//				<th>${name}</th>
//				<th>${data.flagCount || 0}</th>
//				`;
//			tbody.appendChild(row);
//		} else { // Adding entries into the table 
//			row.innerHTML = `
//			<th>${rank++}</th>
//			<th>${name}</th>
//			<th>${data.flagCount || 0}</th>
//			`;
//			tbody.appendChild(row);
//		}
//	});
//}

document.addEventListener("DOMContentLoaded", loadLeaderboard);

async function loadLeaderboard() {
	const tbody = document.querySelector("#leaderboard tbody");

	const q = query(collection(db, "ranking"), orderBy("count", "desc"));
	console.log("--- Bắt đầu tải Leaderboard ---");

	try {
		const querySnapshot = await getDocs(q);


		querySnapshot.forEach((doc) => {
			const data = doc.data();

			const name = doc.id;
			const views = data.count || 0;

			const row = document.createElement("tr");
			row.innerHTML = `
                <td>${rank++}</td>
                <td>${name}</td>
                <td>${views.toLocaleString()} lượt xem</td>
            `;
			tbody.appendChild(row);
		});

		if (querySnapshot.empty) {
			console.error("Lỗi khi tải bảng xếp hạng:", error);
			tbody.innerHTML = "<tr><td colspan='3'>Chưa có dữ liệu xếp hạng</td></tr>";
		}

	} catch (error) {
		console.error("Lỗi khi tải bảng xếp hạng:", error);
		tbody.innerHTML = "<tr><td colspan='3'>Lỗi tải dữ liệu</td></tr>";
	}
}

loadLeaderboard();