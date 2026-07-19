const elements = {
	loading: document.getElementById("loading"),
	error: document.getElementById("error"),
	table: document.getElementById("proxy-table"),
	tbody: document.getElementById("proxy-tbody"),
	noData: document.getElementById("no-data"),
	copyAllHeaderBtn: document.getElementById("copy-all-header-btn"),
	themeToggle: document.getElementById("theme-toggle"),
};

// Тема
const theme = localStorage.getItem("theme") || "dark";
document.body.classList.toggle("dark", theme === "dark");
elements.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
elements.themeToggle.addEventListener("click", () => {
	const isDark = document.body.classList.toggle("dark");
	localStorage.setItem("theme", isDark ? "dark" : "light");
	elements.themeToggle.textContent = isDark ? "☀️" : "🌙";
});

let proxies = [];

function renderTable() {
	elements.tbody.innerHTML = "";
	if (proxies.length === 0) {
		elements.table.classList.add("hidden");
		elements.noData.classList.remove("hidden");
		return;
	}
	elements.noData.classList.add("hidden");
	elements.table.classList.remove("hidden");

	proxies.forEach((link, i) => {
		const row = document.createElement("tr");
		row.innerHTML = `
            <td>${i + 1}</td>
            <td><a class="proxy-link" href="${escapeHtml(link)}" target="_blank">${escapeHtml(link)}</a></td>
            <td><button class="copy-btn" data-link="${escapeHtml(link)}">📋 Копировать</button></td>
          `;
		elements.tbody.appendChild(row);
	});

	document.querySelectorAll(".copy-btn").forEach((btn) => {
		btn.addEventListener("click", async () => {
			const link = btn.getAttribute("data-link");
			await copyText(link);
			btn.textContent = "✅ Скопировано";
			btn.classList.add("copied");
			setTimeout(() => {
				btn.textContent = "📋 Копировать";
				btn.classList.remove("copied");
			}, 1500);
		});
	});
}

async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		const ta = document.createElement("textarea");
		ta.value = text;
		document.body.appendChild(ta);
		ta.select();
		document.execCommand("copy");
		document.body.removeChild(ta);
	}
}

// Кнопка "Копировать всё"
elements.copyAllHeaderBtn.addEventListener("click", async () => {
	if (!proxies.length) return;
	await copyText(proxies.join("\n"));
	const origText = elements.copyAllHeaderBtn.innerHTML;
	elements.copyAllHeaderBtn.innerHTML = "✅ Скопировано!";
	elements.copyAllHeaderBtn.classList.add("copied");
	setTimeout(() => {
		elements.copyAllHeaderBtn.innerHTML = origText;
		elements.copyAllHeaderBtn.classList.remove("copied");
	}, 1500);
});

function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function showError(msg) {
	elements.error.textContent = "❌ " + msg;
	elements.error.classList.remove("hidden");
	elements.loading.classList.add("hidden");
	elements.table.classList.add("hidden");
	elements.noData.classList.add("hidden");
}

async function loadProxies() {
	try {
		const response = await fetch("proxy.txt");
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const text = await response.text();
		const lines = text.split(/\r?\n/);
		proxies = lines
			.map((line) => line.trim())
			.filter(
				(line) =>
					line.startsWith("https://t.me/proxy?") ||
					line.startsWith("tg://proxy?"),
			);
		renderTable();
	} catch (err) {
		console.error(err);
		let message = "Не удалось загрузить proxy.txt. ";
		if (location.protocol === "file:") {
			message +=
				"Вы открыли страницу как файл — нужен локальный сервер (python -m http.server или Live Server).";
		} else {
			message += "Проверьте, что файл proxy.txt лежит рядом с index.html.";
		}
		showError(message);
	} finally {
		elements.loading.classList.add("hidden");
	}
}

loadProxies();
