// Global state
let allEvents = [];
let filteredEvents = [];
let selectedDate = null;
let selectedDepartments = new Set();
let searchTerm = '';
let allExpanded = false;

// Department info with emojis and colors
const departmentInfo = {
    'DST': {
        name: 'Scienze della Terra',
        emoji: '🌍',
        color: '#8B4513'
    },
    'DSTF': {
        name: 'Scienza e Tecnologia del Farmaco',
        emoji: '💊',
        color: '#DC143C'
    },
    'Fisica': {
        name: 'Fisica',
        emoji: '⚛️',
        color: '#4169E1'
    },
    'Chimica': {
        name: 'Chimica',
        emoji: '🧪',
        color: '#32CD32'
    }
};

// Day colors
const dayColors = {
    'lunedì': '#FF6B6B',
    'martedì': '#4ECDC4',
    'mercoledì': '#45B7D1',
    'giovedì': '#FFA07A',
    'venerdì': '#98D8C8',
    'sabato': '#F7DC6F',
    'domenica': '#BB8FCE'
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    dateButtons: document.getElementById('dateButtons'),
    departmentChips: document.getElementById('departmentChips'),
    activeFilters: document.getElementById('activeFilters'),
    filterTags: document.getElementById('filterTags'),
    clearAllFilters: document.getElementById('clearAllFilters'),
    resultsCount: document.getElementById('resultsCount'),
    expandAll: document.getElementById('expandAll'),
    viewToggle: document.getElementById('viewToggle'),
    cardView: document.getElementById('cardView'),
    timelineView: document.getElementById('timelineView'),
    eventsContainer: document.getElementById('eventsContainer'),
    timelineContainer: document.getElementById('timelineContainer'),
    loadingState: document.getElementById('loadingState'),
    noResults: document.getElementById('noResults')
};

// View state
let currentView = 'card'; // 'card' or 'timeline'

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    elements.searchInput.addEventListener('input', handleSearch);
    elements.clearSearch.addEventListener('click', clearSearch);
    elements.clearAllFilters.addEventListener('click', resetAllFilters);
    elements.expandAll.addEventListener('click', toggleExpandAll);
    elements.viewToggle.addEventListener('click', toggleView);
}

// Toggle date filter collapse
function toggleDateFilter() {
    const content = document.getElementById('dateFilterContent');
    const icon = document.getElementById('dateFilterIcon');

    content.classList.toggle('collapsed');
    icon.classList.toggle('rotated');
}

// Toggle department filter collapse
function toggleDeptFilter() {
    const content = document.getElementById('deptFilterContent');
    const icon = document.getElementById('deptFilterIcon');

    content.classList.toggle('collapsed');
    icon.classList.toggle('rotated');
}

function handleSearch(e) {
    searchTerm = e.target.value.toLowerCase();
    elements.clearSearch.style.display = searchTerm ? 'flex' : 'none';
    filterEvents();
}

function clearSearch() {
    searchTerm = '';
    elements.searchInput.value = '';
    elements.clearSearch.style.display = 'none';
    filterEvents();
}

// Load and parse CSV
async function loadEvents() {
    try {
        const response = await fetch('la_strada_delle_scoperte_updated.csv');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        allEvents = parseCSV(csvText);

        populateDateButtons();
        populateDepartmentChips();

        filteredEvents = [...allEvents];
        renderEvents();
        elements.loadingState.style.display = 'none';
    } catch (error) {
        console.error('Error loading events:', error);
        elements.loadingState.innerHTML = `
            <div style="color: white; padding: 2rem;">
                <h3 style="margin-bottom: 1rem;">⚠️ Errore nel caricamento degli eventi</h3>
                <p style="margin-bottom: 1rem; opacity: 0.9;">Il file non può essere caricato direttamente dal browser.</p>
                <p style="margin-bottom: 1rem; opacity: 0.9;">Per visualizzare il sito, avvia un server locale:</p>
                <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; font-family: monospace;">
                    python3 -m http.server 8000
                </div>
                <p style="margin-top: 1rem; opacity: 0.9;">Poi apri: <strong>http://localhost:8000</strong></p>
            </div>
        `;
    }
}

// Parse CSV
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    const events = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const event = {};
            headers.forEach((header, index) => {
                event[header.trim()] = values[index].trim();
            });
            events.push(event);
        }
    }

    return events;
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);

    return values;
}

// Populate date buttons
function populateDateButtons() {
    const dates = [...new Set(allEvents.map(e => e.date))].sort();

    elements.dateButtons.innerHTML = dates.map(date => {
        const [year, month, day] = date.split('-');
        const dateObj = new Date(year, month - 1, day);
        const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'short' });
        const monthName = dateObj.toLocaleDateString('it-IT', { month: 'short' });

        return `
            <button class="date-btn" data-date="${date}">
                <span class="date-btn-day">${dayName}</span>
                <span class="date-btn-number">${day}</span>
                <span class="date-btn-month">${monthName}</span>
            </button>
        `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.date-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleDateFilter(btn.dataset.date, btn));
    });
}

// Populate department chips
function populateDepartmentChips() {
    const departments = [...new Set(allEvents.map(e => e.department))].filter(d => d).sort();

    elements.departmentChips.innerHTML = departments.map(dept => {
        const info = departmentInfo[dept] || { emoji: '📚', name: dept, color: '#999' };
        return `
            <button class="dept-chip" data-dept="${dept}" style="border-color: ${info.color}40;">
                <span class="dept-emoji">${info.emoji}</span>
                <span>${dept}</span>
            </button>
        `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.dept-chip').forEach(chip => {
        chip.addEventListener('click', () => toggleDepartmentFilter(chip.dataset.dept, chip));
    });
}

// Toggle date filter
function toggleDateFilter(date, btn) {
    if (selectedDate === date) {
        selectedDate = null;
        btn.classList.remove('active');
    } else {
        document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
        selectedDate = date;
        btn.classList.add('active');
    }
    updateActiveFilters();
    filterEvents();
}

// Toggle department filter
function toggleDepartmentFilter(dept, chip) {
    const info = departmentInfo[dept] || { color: '#999' };

    if (selectedDepartments.has(dept)) {
        selectedDepartments.delete(dept);
        chip.classList.remove('active');
        chip.style.background = '';
        chip.style.borderColor = `${info.color}40`;
    } else {
        selectedDepartments.add(dept);
        chip.classList.add('active');
        chip.style.background = `linear-gradient(135deg, ${info.color}CC, ${info.color}99)`;
        chip.style.borderColor = info.color;
        chip.style.boxShadow = `0 4px 16px ${info.color}60`;
    }
    updateActiveFilters();
    filterEvents();
}

// Update active filters display
function updateActiveFilters() {
    const tags = [];

    if (selectedDate) {
        const date = new Date(selectedDate);
        const formatted = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
        tags.push({ type: 'date', label: formatted, value: selectedDate });
    }

    selectedDepartments.forEach(dept => {
        const info = departmentInfo[dept] || { emoji: '📚' };
        tags.push({ type: 'dept', label: `${info.emoji} ${dept}`, value: dept });
    });

    if (tags.length > 0) {
        elements.activeFilters.style.display = 'flex';
        elements.filterTags.innerHTML = tags.map(tag => `
            <div class="filter-tag">
                <span>${tag.label}</span>
                <button onclick="removeFilter('${tag.type}', '${tag.value}')">×</button>
            </div>
        `).join('');
    } else {
        elements.activeFilters.style.display = 'none';
    }
}

// Remove individual filter
function removeFilter(type, value) {
    if (type === 'date') {
        selectedDate = null;
        document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
    } else if (type === 'dept') {
        selectedDepartments.delete(value);
        document.querySelector(`.dept-chip[data-dept="${value}"]`)?.classList.remove('active');
    }
    updateActiveFilters();
    filterEvents();
}

// Reset all filters
function resetAllFilters() {
    selectedDate = null;
    selectedDepartments.clear();
    searchTerm = '';
    elements.searchInput.value = '';
    elements.clearSearch.style.display = 'none';

    document.querySelectorAll('.date-btn, .dept-chip').forEach(el => el.classList.remove('active'));
    updateActiveFilters();
    filterEvents();
}

// Filter events
function filterEvents() {
    filteredEvents = allEvents.filter(event => {
        const matchesSearch = !searchTerm ||
            event.title.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.department.toLowerCase().includes(searchTerm);

        const matchesDate = !selectedDate || event.date === selectedDate;

        const matchesDept = selectedDepartments.size === 0 ||
            selectedDepartments.has(event.department);

        return matchesSearch && matchesDate && matchesDept;
    });

    renderEvents();
}

// Render events (list view)
function renderEvents() {
    const count = filteredEvents.length;

    if (count === 0) {
        elements.eventsContainer.innerHTML = '';
        elements.noResults.style.display = 'block';
        return;
    }

    elements.noResults.style.display = 'none';

    elements.eventsContainer.innerHTML = filteredEvents.map((event, index) => {
        const [year, month, day] = event.date.split('-');
        const dayColor = dayColors[event.day] || '#999';
        const deptInfo = departmentInfo[event.department] || { emoji: '📚', color: '#999' };

        return `
            <div class="event-card" style="animation-delay: ${index * 0.05}s; border-left-color: ${dayColor};" data-index="${index}">
                <div class="event-card-header" onclick="toggleEventDetails(${index})">
                    <div class="event-date-badge" style="background: linear-gradient(135deg, ${dayColor}DD, ${dayColor}99); box-shadow: 0 4px 12px ${dayColor}40;">
                        <div class="event-day-name">${event.day}</div>
                        <div class="event-day-number">${day}</div>
                    </div>
                    <div class="event-info">
                        <h3 class="event-title">${event.title}</h3>
                        <div class="event-meta">
                            <div class="event-time">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                                ${event.time}
                            </div>
                            <div class="event-dept-badge" style="background: linear-gradient(135deg, ${deptInfo.color}DD, ${deptInfo.color}99);">
                                <span>${deptInfo.emoji}</span>
                                <span>${event.department}</span>
                            </div>
                        </div>
                    </div>
                    <svg class="expand-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="event-details" id="details-${index}">
                    <div class="event-location">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="flex-shrink: 0; margin-top: 2px;">
                            <path d="M10 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M10 1.875c-3.866 0-7 3.022-7 6.75 0 5.063 7 9.5 7 9.5s7-4.437 7-9.5c0-3.728-3.134-6.75-7-6.75z" stroke="currentColor" stroke-width="1.5"/>
                        </svg>
                        <span>${event.location}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle event details
function toggleEventDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const card = document.querySelector(`[data-index="${index}"]`);
    const icon = card.querySelector('.expand-icon');

    details.classList.toggle('expanded');
    icon.classList.toggle('rotated');
}

// Toggle expand all
function toggleExpandAll() {
    allExpanded = !allExpanded;

    document.querySelectorAll('.event-details').forEach(details => {
        if (allExpanded) {
            details.classList.add('expanded');
        } else {
            details.classList.remove('expanded');
        }
    });

    document.querySelectorAll('.expand-icon').forEach(icon => {
        if (allExpanded) {
            icon.classList.add('rotated');
        } else {
            icon.classList.remove('rotated');
        }
    });

    elements.expandAll.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 ${allExpanded ? '12' : '8'}l5 ${allExpanded ? '-5' : '5'} 5 ${allExpanded ? '-5' : '5'}"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${allExpanded ? 'Chiudi tutto' : 'Espandi tutto'}
    `;
}

// Toggle view
function toggleView() {
    currentView = currentView === 'card' ? 'timeline' : 'card';

    const filtersWrapper = document.querySelector('.filters-wrapper');
    const searchContainer = document.querySelector('.search-container');

    if (currentView === 'timeline') {
        // TIMELINE = Vista orizzontale (giorni, ore orizzontali, dipartimenti verticali)
        elements.cardView.classList.remove('active');
        elements.timelineView.classList.add('active');
        elements.expandAll.style.display = 'none';
        filtersWrapper.style.display = 'none';
        searchContainer.style.display = 'none';
        elements.viewToggle.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="14" height="3" stroke="currentColor" stroke-width="1.5" rx="1"/>
                <rect x="3" y="8" width="14" height="3" stroke="currentColor" stroke-width="1.5" rx="1"/>
                <rect x="3" y="13" width="14" height="3" stroke="currentColor" stroke-width="1.5" rx="1"/>
            </svg>
            Vista Lista
        `;
        renderTimelineHorizontal();
    } else {
        // LISTA = Vista verticale con card
        elements.timelineView.classList.remove('active');
        elements.cardView.classList.add('active');
        elements.expandAll.style.display = 'flex';
        filtersWrapper.style.display = 'block';
        searchContainer.style.display = 'block';
        elements.viewToggle.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="6" height="6" stroke="currentColor" stroke-width="1.5" rx="1"/>
                <rect x="11" y="3" width="6" height="6" stroke="currentColor" stroke-width="1.5" rx="1"/>
                <rect x="3" y="11" width="6" height="6" stroke="currentColor" stroke-width="1.5" rx="1"/>
                <rect x="11" y="11" width="6" height="6" stroke="currentColor" stroke-width="1.5" rx="1"/>
            </svg>
            Vista Timeline
        `;
    }
}

// Render horizontal timeline (day tabs, hours horizontal, departments vertical)
function renderTimelineHorizontal() {
    // Get selected date or use first date
    const dates = [...new Set(allEvents.map(e => e.date))].sort();
    const currentDate = selectedDate || dates[0];
    const selectedDateEvents = allEvents.filter(e => e.date === currentDate);

    // Render day selector tabs
    const dayTabsHtml = dates.map(date => {
        const [year, month, day] = date.split('-');
        const event = allEvents.find(e => e.date === date);
        const dayName = event.day;
        const dayColor = dayColors[dayName] || '#999';
        const isActive = currentDate === date;

        return `
            <button class="day-tab ${isActive ? 'active' : ''}"
                    data-date="${date}"
                    style="border-bottom-color: ${isActive ? dayColor : 'transparent'};"
                    onclick="selectTimelineDay('${date}')">
                <span class="day-tab-name">${dayName}</span>
                <span class="day-tab-number">${day}</span>
            </button>
        `;
    }).join('');

    const html = `
        <div class="day-tabs">
            ${dayTabsHtml}
        </div>
        ${renderHorizontalTimeline(selectedDateEvents)}
    `;

    elements.timelineContainer.innerHTML = html;
}

// Select a day in timeline
function selectTimelineDay(date) {
    selectedDate = date;
    renderTimelineHorizontal();
}

// Render horizontal timeline for a day
function renderHorizontalTimeline(events) {
    const departments = [...new Set(allEvents.map(e => e.department))].filter(d => d).sort();

    let minTime = Infinity;
    let maxTime = 0;

    events.forEach(event => {
        const start = parseTimeToMinutes(event.time);
        const end = getEndTime(event);
        minTime = Math.min(minTime, start);
        maxTime = Math.max(maxTime, end);
    });

    minTime = Math.floor(minTime / 60) * 60;
    maxTime = Math.ceil(maxTime / 60) * 60;
    const totalMinutes = maxTime - minTime;

    const eventsByDept = {};
    departments.forEach(dept => {
        const deptEvents = events.filter(e => e.department === dept);
        deptEvents.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
        calculateEventRows(deptEvents);
        eventsByDept[dept] = deptEvents;
    });

    // Calculate total grid height
    const totalHeight = departments.reduce((sum, dept) => {
        const deptEvents = eventsByDept[dept];
        const maxRows = Math.max(...deptEvents.map(e => e.row || 0)) + 1;
        return sum + (maxRows * 140);
    }, 0);

    let html = `
        <div class="horizontal-timeline" style="
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 0.5rem;
            min-height: ${departments.length * 100}px;
            position: relative;
        ">
    `;

    // Time axis header
    html += `<div style="grid-column: 1 / -1; display: grid; grid-template-columns: 120px 1fr; position: relative; height: 40px; margin-bottom: 1rem; z-index: 10;">`;
    html += `<div></div>`; // Empty space for label column
    html += `<div style="position: relative;">`;

    // Hour labels
    for (let time = minTime; time <= maxTime; time += 60) {
        const hours = Math.floor(time / 60);
        const leftPercent = ((time - minTime) / totalMinutes) * 100;
        html += `
            <div style="
                position: absolute;
                left: ${leftPercent}%;
                top: 0;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.85rem;
                font-weight: 600;
                transform: translateX(-50%);
                z-index: 10;
            ">${hours}:00</div>
        `;
    }
    html += '</div></div>';

    // Gridlines container (absolute positioned over entire timeline)
    html += `<div style="
        position: absolute;
        top: 40px;
        left: 120px;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1;
    ">`;

    for (let time = minTime; time <= maxTime; time += 60) {
        const leftPercent = ((time - minTime) / totalMinutes) * 100;
        html += `
            <div style="
                position: absolute;
                left: ${leftPercent}%;
                top: 0;
                height: 100%;
                width: 2px;
                background: rgba(255, 255, 255, 0.2);
                pointer-events: none;
            "></div>
        `;
    }
    html += '</div>';

    // Department rows
    departments.forEach(dept => {
        const deptEvents = eventsByDept[dept];
        const deptInfo = departmentInfo[dept] || { emoji: '📚', color: '#999' };
        const maxRows = Math.max(...deptEvents.map(e => e.row || 0)) + 1;
        const rowHeight = 140;

        html += `
            <div class="dept-label" style="
                background: linear-gradient(135deg, ${deptInfo.color}40, ${deptInfo.color}20);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: 600;
                color: white;
                height: ${maxRows * rowHeight}px;
            ">
                <span style="font-size: 1.5rem;">${deptInfo.emoji}</span>
                <span>${dept}</span>
            </div>
        `;

        html += `<div style="position: relative; height: ${maxRows * rowHeight}px; border-left: 1px solid rgba(255,255,255,0.1);">`;

        deptEvents.forEach(event => {
            const startTime = parseTimeToMinutes(event.time);
            const duration = calculateDuration(event.time);
            const leftPercent = ((startTime - minTime) / totalMinutes) * 100;
            const widthPercent = (duration / totalMinutes) * 100;
            const topPx = event.row * rowHeight;

            // Calculate expanded dimensions staying within viewport
            const expandedWidth = Math.min(widthPercent * 1.8, 85);
            let expandedLeft = leftPercent - (expandedWidth - widthPercent) / 2;

            // Keep within bounds (0 to 100-expandedWidth)
            if (expandedLeft < 0) expandedLeft = 0;
            if (expandedLeft + expandedWidth > 100) expandedLeft = 100 - expandedWidth;

            html += `
                <div class="timeline-event-horizontal" style="
                    position: absolute;
                    left: ${leftPercent}%;
                    width: ${widthPercent}%;
                    top: ${topPx}px;
                    height: auto;
                    min-height: ${rowHeight - 30}px;
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-left: 4px solid ${deptInfo.color};
                    border-radius: 12px;
                    padding: 1.25rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: visible;
                    display: flex;
                    flex-direction: column;
                    z-index: 1;
                " onmouseover="
                    this.style.background='rgba(30, 25, 50, 0.95)';
                    this.style.left='${expandedLeft}%';
                    this.style.width='${expandedWidth}%';
                    this.style.zIndex='100';
                    this.style.transform='translateY(-8px) scale(1.05)';
                    this.style.boxShadow='0 16px 48px rgba(0,0,0,0.7)';
                    this.querySelector('.event-details-hover').style.display='block';
                " onmouseout="
                    this.style.background='rgba(255,255,255,0.08)';
                    this.style.left='${leftPercent}%';
                    this.style.width='${widthPercent}%';
                    this.style.zIndex='1';
                    this.style.transform='translateY(0) scale(1)';
                    this.style.boxShadow='none';
                    this.querySelector('.event-details-hover').style.display='none';
                ">
                    <div style="font-size: 1rem; font-weight: 700; color: white; line-height: 1.4; margin-bottom: 0.5rem;">
                        ${event.title}
                    </div>
                    <div class="event-details-hover" style="display: none;">
                        <div style="font-size: 0.9rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem;">
                            🕐 ${event.time}
                        </div>
                        <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.8); line-height: 1.5;">
                            📍 ${event.location}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    html += '</div>';
    return html;
}

// Calculate row positions for overlapping events
function calculateEventRows(events) {
    const rows = [];

    events.forEach(event => {
        event.row = 0;

        let placed = false;
        for (let row = 0; row < rows.length; row++) {
            const overlapsInRow = rows[row].some(e => eventsOverlap(event, e));
            if (!overlapsInRow) {
                event.row = row;
                rows[row].push(event);
                placed = true;
                break;
            }
        }

        if (!placed) {
            event.row = rows.length;
            rows.push([event]);
        }
    });
}

// Render timeline view (vertical - old one for reference, now timeline is horizontal)
function renderTimeline() {
    // Group events by date
    const eventsByDate = {};
    filteredEvents.forEach(event => {
        if (!eventsByDate[event.date]) {
            eventsByDate[event.date] = [];
        }
        eventsByDate[event.date].push(event);
    });

    // Get all departments from ALL events (not just filtered)
    const departments = [...new Set(allEvents.map(e => e.department))].filter(d => d).sort();
    const numCols = departments.length + 1; // +1 for time column

    // Generate timeline HTML
    let html = '';
    Object.keys(eventsByDate).sort().forEach(date => {
        const events = eventsByDate[date];
        const dayName = events[0].day;
        const dayColor = dayColors[dayName] || '#999';
        const [year, month, day] = date.split('-');
        const dateObj = new Date(year, month - 1, day);
        const formattedDate = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

        html += `
            <div class="day-section" style="animation-delay: ${Object.keys(eventsByDate).indexOf(date) * 0.1}s">
                <div class="day-section-header" style="background: linear-gradient(135deg, ${dayColor}40, ${dayColor}20);">
                    <div class="day-section-title">${dayName}</div>
                    <div class="day-section-date">${formattedDate}</div>
                </div>
                <div class="timeline-grid">
                    <div class="timeline-header" style="grid-template-columns: 80px repeat(${departments.length}, 1fr);">
                        <div class="timeline-time-label">Ora</div>
                        ${departments.map(dept => {
                            const info = departmentInfo[dept] || { emoji: '📚', color: '#999' };
                            return `
                                <div class="dept-column-header" style="background: linear-gradient(135deg, ${info.color}40, ${info.color}20);">
                                    <span>${info.emoji}</span>
                                    <span>${dept}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${renderTimelineRows(events, departments)}
                </div>
            </div>
        `;
    });

    elements.timelineContainer.innerHTML = html || '<div class="no-results"><h3>Nessun evento da visualizzare</h3></div>';
}

// Parse time to minutes for sorting and calculations
function parseTimeToMinutes(timeStr) {
    // Handle special cases
    if (timeStr === 'mattino') return 9 * 60; // 9:00 AM
    if (timeStr === 'pomeriggio') return 14 * 60; // 2:00 PM

    // Extract first time from range (e.g., "14:00–15:30" -> "14:00")
    const firstTime = timeStr.split('–')[0].trim();

    // Handle formats like "9–13" or "10–12"
    if (!firstTime.includes(':')) {
        return parseInt(firstTime) * 60;
    }

    // Handle "HH:MM" format
    const [hours, minutes] = firstTime.split(':').map(n => parseInt(n));
    return hours * 60 + (minutes || 0);
}

// Calculate event duration in minutes
function calculateDuration(timeStr) {
    // Handle special periods
    if (timeStr === 'mattino') return 4 * 60; // 4 hours
    if (timeStr === 'pomeriggio') return 4 * 60; // 4 hours

    const parts = timeStr.split('–');
    if (parts.length !== 2) return 60; // Default 1 hour

    const start = parseTimeToMinutes(parts[0].trim());
    const end = parseTimeToMinutes(parts[1].trim());

    return Math.max(end - start, 30); // Minimum 30 min
}

// Check if two events overlap
function eventsOverlap(event1, event2) {
    const start1 = parseTimeToMinutes(event1.time);
    const end1 = start1 + calculateDuration(event1.time);
    const start2 = parseTimeToMinutes(event2.time);
    const end2 = start2 + calculateDuration(event2.time);

    return start1 < end2 && start2 < end1;
}

// Get end time in minutes
function getEndTime(event) {
    return parseTimeToMinutes(event.time) + calculateDuration(event.time);
}

// Assign horizontal positions to overlapping events
function calculateEventColumns(events) {
    const columns = [];

    events.forEach(event => {
        event.column = 0;
        event.columnSpan = 1;

        // Find the first column where this event doesn't overlap
        let placed = false;
        for (let col = 0; col < columns.length; col++) {
            const overlapsInColumn = columns[col].some(e => eventsOverlap(event, e));
            if (!overlapsInColumn) {
                event.column = col;
                columns[col].push(event);
                placed = true;
                break;
            }
        }

        // If no suitable column found, create a new one
        if (!placed) {
            event.column = columns.length;
            columns.push([event]);
        }
    });

    // Calculate total columns needed for each event group
    events.forEach(event => {
        let maxCol = event.column;
        events.forEach(other => {
            if (eventsOverlap(event, other)) {
                maxCol = Math.max(maxCol, other.column);
            }
        });
        event.totalColumns = maxCol + 1;
    });

    return columns.length;
}

// Render timeline as a continuous timeline (not rows)
function renderTimelineRows(events, departments) {
    // Find earliest and latest times for the day
    let minTime = Infinity;
    let maxTime = 0;

    events.forEach(event => {
        const start = parseTimeToMinutes(event.time);
        const end = getEndTime(event);
        minTime = Math.min(minTime, start);
        maxTime = Math.max(maxTime, end);
    });

    // Round to hour boundaries
    minTime = Math.floor(minTime / 60) * 60;
    maxTime = Math.ceil(maxTime / 60) * 60;
    const totalMinutes = maxTime - minTime;

    // Group events by department and detect overlaps
    const eventsByDept = {};
    departments.forEach(dept => {
        const deptEvents = events.filter(e => e.department === dept);

        // Sort by start time
        deptEvents.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

        // Calculate column positions for overlapping events
        calculateEventColumns(deptEvents);

        eventsByDept[dept] = deptEvents;
    });

    let html = `
        <div class="timeline-continuous" style="
            display: grid;
            grid-template-columns: 80px repeat(${departments.length}, 1fr);
            gap: 0.5rem;
            min-height: ${(totalMinutes / 60) * 100}px;
        ">
    `;

    // Time markers column
    html += '<div class="time-markers" style="position: relative;">';
    for (let time = minTime; time <= maxTime; time += 60) {
        const hours = Math.floor(time / 60);
        const topPercent = ((time - minTime) / totalMinutes) * 100;
        html += `
            <div class="time-marker" style="
                position: absolute;
                top: ${topPercent}%;
                width: 100%;
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.85rem;
                font-weight: 600;
            ">${hours}:00</div>
        `;
    }
    html += '</div>';

    // Department columns
    departments.forEach(dept => {
        const deptEvents = eventsByDept[dept];

        html += `<div class="dept-timeline-column" style="position: relative; border-left: 1px solid rgba(255,255,255,0.1);">`;

        deptEvents.forEach(event => {
            const startTime = parseTimeToMinutes(event.time);
            const duration = calculateDuration(event.time);
            const topPercent = ((startTime - minTime) / totalMinutes) * 100;
            const heightPercent = (duration / totalMinutes) * 100;
            const dayColor = dayColors[event.day] || '#999';

            // Calculate horizontal position based on column
            const leftPercent = (event.column / event.totalColumns) * 100;
            const widthPercent = (1 / event.totalColumns) * 100;

            const deptInfo = departmentInfo[event.department] || { color: '#999' };

            html += `
                <div class="timeline-event-positioned" style="
                    position: absolute;
                    top: ${topPercent}%;
                    left: ${leftPercent}%;
                    width: calc(${widthPercent}% - 4px);
                    height: auto;
                    min-height: ${heightPercent}%;
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-left: 3px solid ${deptInfo.color};
                    border-radius: 8px;
                    padding: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: visible;
                    display: flex;
                    flex-direction: column;
                    z-index: 1;
                " onmouseover="
                    this.style.background='rgba(30, 25, 50, 0.95)';
                    this.style.left='0';
                    this.style.width='calc(100% - 4px)';
                    this.style.zIndex='100';
                    this.style.boxShadow='0 12px 40px rgba(0,0,0,0.6)';
                    this.querySelector('.event-details-hover').style.display='block';
                "
                   onmouseout="
                    this.style.background='rgba(255,255,255,0.08)';
                    this.style.left='${leftPercent}%';
                    this.style.width='calc(${widthPercent}% - 4px)';
                    this.style.zIndex='1';
                    this.style.boxShadow='none';
                    this.querySelector('.event-details-hover').style.display='none';
                ">
                    <div style="font-size: 0.9rem; font-weight: 600; color: white; line-height: 1.4;">
                        ${event.title}
                    </div>
                    <div class="event-details-hover" style="display: none; margin-top: 0.4rem;">
                        <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.3rem;">
                            🕐 ${event.time}
                        </div>
                        <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.8); line-height: 1.5;">
                            📍 ${event.location}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    html += '</div>';
    return html;
}
