const list = document.getElementById("detectedItemsList");

function createChecklistItem(streamId, label) {
	const li = document.createElement("li");
	li.className = "flex items-center gap-2.5";

	const checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.id = `check-${streamId}-${label}`;
	checkbox.value = label;
	checkbox.disabled = true;
	checkbox.className = "w-4 h-4 accent-red-500";

	const labelEl = document.createElement("label");
	labelEl.htmlFor = `check-${streamId}-${label}`;
	labelEl.textContent = label;
	labelEl.className = "text-base font-semibold text-white tracking-tight";

	li.appendChild(checkbox);
	li.appendChild(labelEl);
	return { li, checkbox };
}

function populateChecklist(streamId, labels) {
	const liveChecklistItems = document.getElementById(
		"detectedItemsChecklist",
	);
	liveChecklistItems.innerHTML = "";
	labels.forEach((label) => {
		const { li } = createChecklistItem(streamId, label);
		liveChecklistItems.appendChild(li);
	});
}

function addDetectedItemCheckbox(streamId, label) {
	const liveChecklistItems = document.getElementById(
		"detectedItemsChecklist",
	);
	let checkbox = document.getElementById(`check-${streamId}-${label}`);
	if (!checkbox) {
		const created = createChecklistItem(streamId, label);
		liveChecklistItems.appendChild(created.li);
		checkbox = created.checkbox;
	}
	checkbox.checked = true;
	liveChecklistItems.prepend(checkbox.closest("li"));
}

const rovStreamConnection = new signalR.HubConnectionBuilder()
	.withUrl("/rovstreamhub")
	.build();

rovStreamConnection.on("StreamStarted", (data) => {
	document.getElementById("currentStreamingStatus").textContent =
		`Live #${data.streamId} — ` + data.title;
	document.getElementById("liveIndicator").classList.remove("hidden");
	document.getElementById("offlineIndicator").classList.add("hidden");
	document.getElementById("liveSection").classList.remove("hidden");
	document.getElementById("liveStreamFeed").src = data.sourceUrl;

	populateChecklist(data.streamId, data.detectedItemsUniqueLabels);
});

rovStreamConnection.on("StreamEnded", () => {
	document.getElementById("currentStreamingStatus").textContent =
		"Currently not streaming";
	document.getElementById("liveIndicator").classList.add("hidden");
	document.getElementById("offlineIndicator").classList.remove("hidden");
	document.getElementById("liveSection").classList.add("hidden");
	document.getElementById("liveStreamFeed").src = "";
	list.innerHTML = "";
	location.reload();
});

rovStreamConnection.start().catch((err) => console.error(err));

const rovDetectedItemConnection = new signalR.HubConnectionBuilder()
	.withUrl("/rovdetecteditemhub")
	.build();

rovDetectedItemConnection.on("NewItemDetected", (data) => {
	addDetectedItemCheckbox(data.streamId, data.label);

	const detectedItem = document.createElement("li");
	detectedItem.className =
		"flex gap-3 items-start bg-zinc-800 rounded-lg p-3 cursor-pointer hover:opacity-80 transition";
	detectedItem.addEventListener("click", () => {
		openSnapshotModal(null, [
			{ SnapshotFileUrl: data.snapshotFileUrl, Label: data.label },
		]);
	});

	const imgTag = document.createElement("img");
	imgTag.src = data.snapshotFileUrl;
	imgTag.className =
		"w-16 h-16 object-cover rounded-md border border-zinc-600 shrink-0";

	const info = document.createElement("div");
	info.className = "min-w-0 flex-1";
	info.innerHTML = `
        <p class="text-white font-medium text-sm truncate">${data.label}</p>
        <p class="text-zinc-500 text-xs">${new Date(data.detectedAtTimeStamp).toLocaleTimeString()}</p>
        <p class="text-zinc-500 text-xs">Confidence: ${data.confidence}%</p>
    `;

	detectedItem.appendChild(imgTag);
	detectedItem.appendChild(info);
	list.appendChild(detectedItem);
});

rovDetectedItemConnection.start().catch((err) => console.error(err));

// --- Snapshot Modal ---
function openSnapshotModal(streamId, directSnapshots) {
	let snapshots = directSnapshots;
	if (!snapshots) {
		const dataEl = document.querySelector(
			`.snapshot-data[data-stream-id="${streamId}"]`,
		);
		if (!dataEl) return;
		snapshots = JSON.parse(dataEl.textContent);
	}

	const grid = document.getElementById("snapshotModalGrid");
	grid.innerHTML = "";
	snapshots.forEach((s) => {
		const wrapper = document.createElement("div");
		wrapper.className = "flex flex-col gap-1";
		const img = document.createElement("img");
		img.src = s.SnapshotFileUrl;
		img.className =
			"w-full aspect-square object-cover rounded-lg border border-zinc-800";
		const label = document.createElement("p");
		label.textContent = s.Label;
		label.className = "text-zinc-400 text-xs text-center";
		wrapper.appendChild(img);
		wrapper.appendChild(label);
		grid.appendChild(wrapper);
	});

	document.getElementById("snapshotModal").classList.remove("hidden");
}

document.getElementById("snapshotModalClose")?.addEventListener("click", () => {
	document.getElementById("snapshotModal").classList.add("hidden");
});
document.getElementById("snapshotModal")?.addEventListener("click", (e) => {
	if (e.target.id === "snapshotModal") {
		document.getElementById("snapshotModal").classList.add("hidden");
	}
});

document.querySelectorAll(".snapshot-thumb").forEach((thumb) => {
	thumb.addEventListener("click", () => {
		openSnapshotModal(thumb.dataset.streamId);
	});
});

// --- Past Streams Pagination ---
const STREAMS_PER_PAGE = 10;
let currentPage = 1;

function paginateStreams() {
	const cards = Array.from(document.querySelectorAll(".stream-card"));
	const totalPages = Math.max(1, Math.ceil(cards.length / STREAMS_PER_PAGE));
	currentPage = Math.min(currentPage, totalPages);

	cards.forEach((card, i) => {
		const page = Math.floor(i / STREAMS_PER_PAGE) + 1;
		card.classList.toggle("hidden", page !== currentPage);
	});

	renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
	let controls = document.getElementById("streamPagination");
	if (!controls) {
		controls = document.createElement("div");
		controls.id = "streamPagination";
		controls.className = "flex items-center justify-center gap-4 mt-6";
		document.getElementById("pastStreamsList").after(controls);
	}
	controls.innerHTML = "";

	const prevBtn = document.createElement("button");
	prevBtn.textContent = "Prev";
	prevBtn.disabled = currentPage === 1;
	prevBtn.className =
		"px-4 py-2 text-sm text-zinc-300 border border-zinc-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-500";
	prevBtn.addEventListener("click", () => {
		currentPage--;
		paginateStreams();
	});

	const pageLabel = document.createElement("span");
	pageLabel.textContent = `Page ${currentPage} of ${totalPages}`;
	pageLabel.className = "text-sm text-zinc-500";

	const nextBtn = document.createElement("button");
	nextBtn.textContent = "Next";
	nextBtn.disabled = currentPage === totalPages;
	nextBtn.className =
		"px-4 py-2 text-sm text-zinc-300 border border-zinc-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:border-zinc-500";
	nextBtn.addEventListener("click", () => {
		currentPage++;
		paginateStreams();
	});

	controls.appendChild(prevBtn);
	controls.appendChild(pageLabel);
	controls.appendChild(nextBtn);
}

document.addEventListener("DOMContentLoaded", paginateStreams);
