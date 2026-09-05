const elements = {
	loading: document.getElementById("loading"),
	error: document.getElementById("error"),
	table: document.getElementById("proxy-table"),
	tbody: document.getElementById("proxy-tbody"),
	noData: document.getElementById("no-data"),
	copyAllHeaderBtn: document.getElementById("copy-all-header-btn"),
	themeToggle: document.getElementById("theme-toggle"),
};

// Theme
const theme = localStorage.getItem("theme") || "dark";
document.body.classList.toggle("dark", theme === "dark");
elements.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
elements.themeToggle.addEventListener("click", () => {
	const isDark = document.body.classList.toggle("dark");
	localStorage.setItem("theme", isDark ? "dark" : "light");
	elements.themeToggle.textContent = isDark ? "☀️" : "🌙";
});
const proxy_params = ["server", "port", "secret"];
const proxy_types = ["/proxy", "/socks", "/webproxy"];

let proxies = [];

/** Render the list of proxies */
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

/**
 * Copy the text
 * @param {string} text
 */
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

/** Button "Copy all" */
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

/**
 * Escape all html code
 * @param {string} text
 * @returns {string} escaped_text
 */
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

/** Show the error */
function showError(msg) {
	elements.error.textContent = `❌ ${msg}`;
	elements.error.classList.remove("hidden");
	elements.loading.classList.add("hidden");
	elements.table.classList.add("hidden");
	elements.noData.classList.add("hidden");
}

/**
 * Get Hostname of the server
 * @param {URL} url
 * @returns {string} hostname
 */
function getProxyServer(url) {
	const server = url.searchParams.get("server");
	const port = url.searchParams.get("port");

	return port === null ? server : `${server}:${port}`;
}

/** Load all proxies */
async function loadProxies() {
	try {
		const response = await fetch("proxy.txt");
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const text = await response.text();
		const lines = text.replaceAll("tg://", "https://t.me/").split(/\r?\n/);

		const collator = new Intl.Collator("en", {
			numeric: true,
			sensitivity: "base",
		});

		proxies = lines
			.filter((line) => line.indexOf("https://t.me/") !== -1)
			.map((line) => new URL(line.slice(line.indexOf("https://t.me/")).trim()))
			.filter(
				(url) =>
					proxy_types.includes(url.pathname) &&
					url.searchParams.get("server") !== null,
			)
			.map((url) => {
				for (const key of url.searchParams.keys()) {
					if (!proxy_params.includes(key)) {
						url.searchParams.delete(key);
					}
				}

				return url;
			})
			.sort((a, b) => collator.compare(getProxyServer(a), getProxyServer(b)))
			.map((url) => url.href);
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
