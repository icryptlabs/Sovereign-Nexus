// Initialize Lucide Icons
lucide.createIcons();

// --- State Management ---
let systemState = "STEALTH_MUNDANE"; // STEALTH_MUNDANE, RED_ALERT, GHOST_WIPE_STATIC

// --- DOM Elements ---
const body = document.body;
const statusValue = document.getElementById('system-status');
const dotStealth = document.querySelector('.dot-stealth');
const dotAlert = document.querySelector('.dot-alert');
const dotGhost = document.querySelector('.dot-ghost');
const quarantineModal = document.getElementById('quarantine-modal');
const ghostWipeOverlay = document.getElementById('ghost-wipe');
const btnCancelQuarantine = document.getElementById('btn-cancel-quarantine');
const btnAuthorizeQuarantine = document.getElementById('btn-authorize-quarantine');
const sysTimeEl = document.getElementById('sys-time');

// --- Clock ---
setInterval(() => {
    const now = new Date();
    sysTimeEl.textContent = `SYS_TIME: ${now.toISOString().split('T')[1].split('.')[0]}Z`;
}, 1000);

// --- Keybinds & State Logic ---
function updateSystemState(newState) {
    systemState = newState;
    
    // Reset classes
    body.className = '';
    statusValue.className = 'status-value';
    dotStealth.classList.remove('active');
    dotAlert.classList.remove('active');
    dotGhost.classList.remove('active');
    ghostWipeOverlay.classList.add('hidden');

    statusValue.textContent = systemState;

    if (systemState === "STEALTH_MUNDANE") {
        statusValue.classList.add('stealth');
        dotStealth.classList.add('active');
    } else if (systemState === "RED_ALERT") {
        body.classList.add('red-alert');
        statusValue.classList.add('alert');
        dotAlert.classList.add('active');
    } else if (systemState === "GHOST_WIPE_STATIC") {
        body.classList.add('ghost-wipe');
        statusValue.classList.add('ghost');
        dotGhost.classList.add('active');
        ghostWipeOverlay.classList.remove('hidden');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        updateSystemState(systemState === "STEALTH_MUNDANE" ? "GHOST_WIPE_STATIC" : "STEALTH_MUNDANE");
    }
    if (e.altKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        quarantineModal.classList.remove('hidden');
    }
});

btnCancelQuarantine.addEventListener('click', () => {
    quarantineModal.classList.add('hidden');
});

btnAuthorizeQuarantine.addEventListener('click', () => {
    updateSystemState("RED_ALERT");
    quarantineModal.classList.add('hidden');
});

// --- News Ticker ---
const NEWS_ITEMS = [
    "N17 NODE: Mesh network stability at 94.2%.",
    "SVU LEDGER: 142 new micro-grants distributed in the last hour.",
    "ARBITER: Quarantine protocol lifted for Sector 4.",
    "GLOBAL: The Great Decoupling accelerates as legacy systems falter.",
    "SOVEREIGN NEXUS: New community center vetted and approved in SW9."
];

const tickerScroll = document.getElementById('ticker-scroll');
// Duplicate items for seamless scrolling
const allItems = [...NEWS_ITEMS, ...NEWS_ITEMS];

allItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'ticker-item';
    div.innerHTML = `<span class="ticker-slash">//</span> ${item}`;
    tickerScroll.appendChild(div);
});

// --- Chart.js for Ledger ---
const ctx = document.getElementById('ledgerChart').getContext('2d');
const chartData = Array.from({ length: 20 }, (_, i) => 4000 + Math.random() * 2000 + (i * 100));

new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array.from({ length: 20 }, (_, i) => i),
        datasets: [{
            data: chartData,
            borderColor: '#00f3ff',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: false
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
            x: { display: false },
            y: { display: false, min: Math.min(...chartData) - 500 }
        },
        animation: false
    }
});

// --- Mesh Network Map ---
const NODES = [
    { id: 1, x: 20, y: 30, active: true, label: "N17-A" },
    { id: 2, x: 50, y: 20, active: true, label: "N17-B" },
    { id: 3, x: 80, y: 40, active: true, label: "SW9-A" },
    { id: 4, x: 30, y: 70, active: false, label: "E8-C" },
    { id: 5, x: 70, y: 80, active: true, label: "SE1-A" },
    { id: 6, x: 50, y: 50, active: true, label: "CORE" }
];

const CONNECTIONS = [
    [1, 6], [2, 6], [3, 6], [5, 6], [1, 2], [3, 5], [4, 1]
];

const svg = document.getElementById('network-svg');
const nodesContainer = document.getElementById('network-nodes');

// Draw lines
CONNECTIONS.forEach(([sourceId, targetId]) => {
    const source = NODES.find(n => n.id === sourceId);
    const target = NODES.find(n => n.id === targetId);
    const isActive = source.active && target.active;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", `${source.x}%`);
    line.setAttribute("y1", `${source.y}%`);
    line.setAttribute("x2", `${target.x}%`);
    line.setAttribute("y2", `${target.y}%`);
    line.setAttribute("stroke", isActive ? "var(--color-accent-neon)" : "var(--color-alert-red)");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("stroke-opacity", isActive ? "0.3" : "0.1");
    if (!isActive) line.setAttribute("stroke-dasharray", "4 4");
    
    svg.appendChild(line);
});

// Draw nodes
NODES.forEach(node => {
    const div = document.createElement('div');
    div.className = 'node';
    div.style.left = `${node.x}%`;
    div.style.top = `${node.y}%`;

    const dot = document.createElement('div');
    dot.className = `node-dot ${node.active ? 'active' : 'inactive'}`;
    
    if (node.active) {
        const ping = document.createElement('div');
        ping.className = 'node-ping';
        dot.appendChild(ping);
    }

    const label = document.createElement('span');
    label.className = 'node-label';
    label.textContent = node.label;

    div.appendChild(dot);
    div.appendChild(label);
    nodesContainer.appendChild(div);
});

// --- Arbiter Console ---
const LOG_LINES = [
    "[SYS] Initializing Arbiter Protocol v2.0.1...",
    "[SYS] Connecting to Sovereign Nexus...",
    "[OK] Connection established. Latency: 12ms",
    "[INFO] Scanning local nodes for anomalies...",
    "[OK] Node N17-A verified.",
    "[OK] Node N17-B verified.",
    "[WARN] Node E8-C unresponsive. Attempting reroute...",
    "[INFO] Reroute successful via CORE.",
    "[SYS] Awaiting input...",
    "[USER] > execute stealth_mode",
    "[SYS] Stealth mode engaged. Signature masked.",
    "[INFO] Monitoring incoming traffic on port 443...",
    "[ALERT] Unauthorized access attempt detected from IP 192.168.1.105",
    "[SYS] Blocking IP...",
    "[OK] IP blocked. Threat neutralized."
];

const consoleOutput = document.getElementById('console-output');
let currentLogIndex = 0;

const cursor = document.createElement('div');
cursor.className = 'console-cursor';
cursor.textContent = '_';

function appendLog() {
    if (currentLogIndex < LOG_LINES.length) {
        const lineText = LOG_LINES[currentLogIndex];
        const lineDiv = document.createElement('div');
        lineDiv.className = 'console-line';
        lineDiv.textContent = lineText;

        if (lineText.startsWith("[OK]")) lineDiv.classList.add('ok');
        if (lineText.startsWith("[WARN]")) lineDiv.classList.add('warn');
        if (lineText.startsWith("[ALERT]")) lineDiv.classList.add('alert');
        if (lineText.startsWith("[USER]")) lineDiv.classList.add('user');

        // Insert before cursor
        if (consoleOutput.contains(cursor)) {
            consoleOutput.insertBefore(lineDiv, cursor);
        } else {
            consoleOutput.appendChild(lineDiv);
            consoleOutput.appendChild(cursor);
        }

        consoleOutput.scrollTop = consoleOutput.scrollHeight;
        currentLogIndex++;
    }
}

// Initial cursor
consoleOutput.appendChild(cursor);

// Start logging
setInterval(appendLog, 800);

// Initialize state
updateSystemState(systemState);
