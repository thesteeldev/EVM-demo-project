/**
 * EVM Results Dashboard - Live Data Visualization
 * Vanilla JavaScript (ES6+) | Chart.js | Real-time API
 */

// ===========================
// DOM ELEMENT REFERENCES
// ===========================
const elements = {
    totalVotes: document.getElementById('total-votes'),
    leadingName: document.getElementById('leading-name'),
    leadingParty: document.getElementById('leading-party'),
    leadingVotes: document.getElementById('leading-votes'),
    votedCount: document.getElementById('voted-count'),
    percentageDisplay: document.getElementById('percentage-display'),
    percentageCircle: document.getElementById('percentage-circle'),
    lastUpdateTime: document.getElementById('last-update-time'),
    lastUpdateDate: document.getElementById('last-update-date'),
    doughnutLegend: document.getElementById('doughnut-legend'),
};

// ===========================
// CANDIDATE MAPPING
// ===========================
const candidateMap = {
    candidate_1: {
        tamilName: 'திரு. அருண் குமார்',
        party: 'மக்கள் முன்னேற்றக் கட்சி',
        color: '#3b82f6' // blue
    },
    candidate_2: {
        tamilName: 'திருமதி. லதா விஜய்',
        party: 'சூரிய ஒளி கட்சி',
        color: '#a855f7' // purple
    },
    candidate_3: {
        tamilName: 'திரு. செந்தில் நாதன்',
        party: 'தேசிய மாம்பழ கட்சி',
        color: '#f97316' // orange
    },
    candidate_4: {
        tamilName: 'திரு. ராஜேஷ்',
        party: 'வைர முன்னேற்றக் கட்சி',
        color: '#2ecc71' // green
    }
};

const candidateKeys = Object.keys(candidateMap);

// ===========================
// CHART INITIALIZATION
// ===========================
let doughnutChart, barChart;

/**
 * Initializes both charts with empty/default data and dark theme styling.
 */
function initCharts() {
    // Common chart options (dark theme)
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(10, 15, 30, 0.9)',
                titleColor: '#eef0f6',
                bodyColor: '#b0b8d0',
                borderColor: 'rgba(0,180,255,0.4)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                    label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value.toLocaleString()} வாக்குகள்`;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#b0b8d0' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
                ticks: { color: '#b0b8d0' },
                grid: { color: 'rgba(255,255,255,0.05)' },
                beginAtZero: true
            }
        }
    };

    // Doughnut Chart (no scales needed)
    const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: candidateKeys.map(key => candidateMap[key].tamilName),
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: candidateKeys.map(key => candidateMap[key].color),
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 2,
                hoverBorderColor: 'rgba(255,255,255,0.4)',
                hoverBorderWidth: 3,
            }]
        },
        options: {
            ...chartOptions,
            cutout: '70%',
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    ...chartOptions.plugins.tooltip,
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a,b)=>a+b,0);
                            const percent = total > 0 ? ((value/total)*100).toFixed(1) : 0;
                            return `${label}: ${value.toLocaleString()} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });

    // Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: candidateKeys.map(key => candidateMap[key].tamilName),
            datasets: [{
                label: 'வாக்குகள்',
                data: [0, 0, 0, 0],
                backgroundColor: candidateKeys.map(key => candidateMap[key].color + '99'),
                borderColor: candidateKeys.map(key => candidateMap[key].color),
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                x: {
                    ticks: { color: '#b0b8d0', font: { size: 11 } },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: '#b0b8d0', callback: (val) => val.toLocaleString() },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            },
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    ...chartOptions.plugins.tooltip,
                    callbacks: {
                        label: (context) => `${context.raw.toLocaleString()} வாக்குகள்`
                    }
                }
            }
        }
    });

    // Create custom legend for Doughnut
    createCustomLegend();
}

/**
 * Generates HTML legend items based on candidate colors & names.
 */
function createCustomLegend() {
    const legendHtml = candidateKeys.map(key => {
        const cand = candidateMap[key];
        return `
            <div class="legend-item">
                <span class="legend-color" style="background-color: ${cand.color};"></span>
                <span>${cand.tamilName}</span>
            </div>
        `;
    }).join('');
    elements.doughnutLegend.innerHTML = legendHtml;
}

// ===========================
// API FETCH & UPDATE LOGIC
// ===========================
/**
 * Fetches election results from backend and updates the entire dashboard.
 */
async function fetchResults() {
    try {
        const response = await fetch('https://evm-live-backend.onrender.com/api/results');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const json = await response.json();
        // Expecting format: { "status": "success", "data": { "candidate_1": 150, ... } }
        if (json.status !== 'success' || !json.data) {
            throw new Error('தவறான தரவு வடிவம்');
        }

        const rawData = json.data; // e.g., { candidate_1: 150, candidate_2: 80, ... }
        updateDashboard(rawData);
    } catch (error) {
        console.error('API பிழை:', error);
        // Optionally show a toast or fallback display
        elements.lastUpdateTime.textContent = 'பிழை';
    }
}

/**
 * Updates DOM elements and charts based on fetched data.
 * @param {Object} data - Vote counts keyed by candidate ID.
 */
function updateDashboard(data) {
    // Map candidate IDs to vote counts (default 0)
    const voteCounts = candidateKeys.map(key => data[key] || 0);

    // Total votes
    const totalVotes = voteCounts.reduce((sum, val) => sum + val, 0);
    elements.totalVotes.textContent = totalVotes.toLocaleString();

    // Leading candidate
    const maxVotes = Math.max(...voteCounts);
    const leadingIndex = voteCounts.indexOf(maxVotes);
    const leadingCandidateKey = candidateKeys[leadingIndex];
    const leadingCandidate = candidateMap[leadingCandidateKey];

    elements.leadingName.textContent = leadingCandidate.tamilName;
    elements.leadingParty.textContent = leadingCandidate.party;
    elements.leadingVotes.textContent = maxVotes.toLocaleString();

    // Update "மொத்த பதிவு" (votes recorded)
    elements.votedCount.textContent = totalVotes.toLocaleString();

    // Update percentage circle (based on total votes vs target 100,000)
    const target = 100000;
    const percentage = totalVotes > 0 ? Math.min((totalVotes / target) * 100, 100) : 0;
    elements.percentageDisplay.textContent = percentage.toFixed(1) + '%';

    // Update SVG circle dashoffset
    const circle = elements.percentageCircle;
    const circumference = 364.4; // 2 * PI * 58 (radius)
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Update last updated time
    const now = new Date();
    elements.lastUpdateTime.textContent = now.toLocaleTimeString('ta-IN', { hour12: false });
    elements.lastUpdateDate.textContent = now.toLocaleDateString('ta-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Update Charts
    updateCharts(voteCounts);
}

/**
 * Updates the data and triggers re-render for both charts.
 * @param {number[]} voteCounts - Array of vote counts in candidate order.
 */
function updateCharts(voteCounts) {
    // Doughnut
    doughnutChart.data.datasets[0].data = voteCounts;
    doughnutChart.update();

    // Bar
    barChart.data.datasets[0].data = voteCounts;
    barChart.update();
}

// ===========================
// AUTO-REFRESH & INIT
// ===========================
/**
 * Starts the dashboard with initial data fetch and sets up 5-second interval.
 */
function initDashboard() {
    initCharts();
    fetchResults(); // Immediate first fetch
    setInterval(fetchResults, 5000);
}

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);