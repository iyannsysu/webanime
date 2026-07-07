// API
const API = 'https://api.sonzaix.indevs.in/anime';

// State
let currentSeries = '';
let heroIdx = 0;
let heroTimer;
let searchTimer = null;
let ongoingRefreshTimer = null;
let lastOngoingData = [];
let autoRefreshInterval = 60000; // 1 menit

// Placeholder
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect fill='%2312121f' width='300' height='400'/%3E%3Ctext fill='%236b6b80' font-family='sans-serif' font-size='40' x='50%25' y='45%25' text-anchor='middle'%3E🎥%3C/text%3E%3Ctext fill='%236b6b80' font-family='sans-serif' font-size='14' x='50%25' y='58%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

// Fix image URL
function fixImg(url) {
    if (!url) return PLACEHOLDER;
    let fixed = url.replace(/https:\/\/i\d\.wp\.com\//, 'https://');
    if (fixed.startsWith('http://')) fixed = fixed.replace('http://', 'https://');
    return fixed;
}

function imgError(img) {
    if (img.dataset.fallback) return;
    img.dataset.fallback = '1';
    img.src = PLACEHOLDER;
    img.style.objectFit = 'contain';
    img.style.padding = '20px';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    initScroll();
    initHeader();
    initSearchSuggest();
    startAutoRefresh();
});

function initScroll() {
    const btn = document.getElementById('scrollTop');
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });
}

function initHeader() {
    window.addEventListener('scroll', () => {
        document.getElementById('header').classList.toggle('scrolled', window.scrollY > 50);
    });
}

// Auto Refresh Ongoing Anime
function startAutoRefresh() {
    // Refresh setiap 1 menit
    ongoingRefreshTimer = setInterval(() => {
        refreshOngoingSilent();
    }, autoRefreshInterval);
    
    // Update timer display setiap detik
    setInterval(updateRefreshTimer, 1000);
}

async function refreshOngoingSilent() {
    try {
        const res = await fetch(`${API}/ongoing`);
        const data = await res.json();
        
        if (data?.data) {
            const newData = [...data.data].sort((a, b) => (b.id || 0) - (a.id || 0));
            
            // Cek apakah ada anime baru
            if (lastOngoingData.length > 0) {
                const newAnime = newData.filter(n => !lastOngoingData.some(o => o.id === n.id));
                if (newAnime.length > 0) {
                    showNewAnimeNotification(newAnime);
                }
            }
            
            lastOngoingData = newData;
            
            // Update tampilan ongoing di home
            renderCards(newData.slice(0, 12), 'ongoingHomeAnime');
            
            // Update tampilan ongoing page jika sedang dibuka
            if (document.getElementById('ongoingSection').style.display !== 'none') {
                renderCards(newData, 'ongoingAnime');
            }
            
            // Update timestamp
            updateLastRefreshTime();
        }
    } catch (e) {
        console.log('Auto refresh error:', e);
    }
}

function updateLastRefreshTime() {
    const el = document.getElementById('lastRefreshTime');
    if (el) {
        const now = new Date();
        el.textContent = `Update: ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    }
}

function updateRefreshTimer() {
    const el = document.getElementById('refreshCountdown');
    if (el) {
        // Hitung mundur dari interval
        const now = Date.now();
        const nextRefresh = Math.ceil(autoRefreshInterval / 1000);
        el.textContent = `Auto refresh setiap ${autoRefreshInterval / 1000}s`;
    }
}

function showNewAnimeNotification(newAnime) {
    // Buat notifikasi
    const notif = document.createElement('div');
    notif.className = 'new-anime-notif';
    notif.innerHTML = `
        <div class="notif-content">
            <div class="notif-icon"><i class="fas fa-bell"></i></div>
            <div class="notif-text">
                <strong>${newAnime.length} Anime Baru!</strong>
                <p>${newAnime.map(a => a.judul).slice(0, 2).join(', ')}${newAnime.length > 2 ? '...' : ''}</p>
            </div>
            <button class="notif-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(notif);
    
    // Auto remove setelah 5 detik
    setTimeout(() => {
        if (notif.parentElement) {
            notif.classList.add('notif-fade');
            setTimeout(() => notif.remove(), 300);
        }
    }, 5000);
}

function manualRefresh() {
    const btn = document.getElementById('refreshBtn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        btn.disabled = true;
    }
    
    refreshOngoingSilent().then(() => {
        if (btn) {
            btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            btn.disabled = false;
        }
    });
}

// Live Search Suggestion
function initSearchSuggest() {
    const input = document.getElementById('searchInput');
    const box = document.getElementById('suggestBox');
    
    input.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = input.value.trim();
        if (q.length < 2) {
            box.style.display = 'none';
            return;
        }
        searchTimer = setTimeout(() => loadSuggest(q), 400);
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2) {
            box.style.display = 'block';
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            box.style.display = 'none';
        }
    });
}

async function loadSuggest(query) {
    const box = document.getElementById('suggestBox');
    try {
        const res = await fetch(`${API}/search?query=${encodeURIComponent(query)}&page=1`);
        const data = await res.json();
        
        let results = [];
        if (data?.data) {
            data.data.forEach(g => {
                if (g.result) results = results.concat(g.result);
            });
        }
        
        results = results.slice(0, 8);
        
        if (!results.length) {
            box.innerHTML = '<div class="suggest-empty">Anime tidak ditemukan</div>';
            box.style.display = 'block';
            return;
        }

        box.innerHTML = results.map(a => {
            const slug = a.url || a.id;
            const title = a.judul || a.title || '';
            const cover = fixImg(a.cover);
            const score = a.score || '';
            const status = a.status || '';

            return `
                <div class="suggest-item" onclick="showDetail('${slug}')">
                    <img src="${cover}" alt="" onerror="imgError(this)">
                    <div class="suggest-info">
                        <div class="suggest-title">${title}</div>
                        <div class="suggest-meta">
                            ${score ? `<span><i class="fas fa-star"></i> ${score}</span>` : ''}
                            ${status ? `<span>${status}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('') + `
            <div class="suggest-all" onclick="searchAnime()">
                <i class="fas fa-search"></i> Lihat semua hasil "<strong>${document.getElementById('searchInput').value}</strong>"
            </div>
        `;
        box.style.display = 'block';
    } catch (e) {
        box.style.display = 'none';
    }
}

// Loader
function showLoader() { document.getElementById('loader').classList.add('active'); }
function hideLoader() { document.getElementById('loader').classList.remove('active'); }

// Navigation
function showHome() {
    hideAll();
    show('heroSection', 'ongoingHomeSection', 'popularSection', 'latestSection');
    setActive('nav-home');
    loadHome();
    closeMob();
}

function showOngoing() {
    hideAll();
    show('ongoingSection');
    setActive('nav-ongoing');
    loadOngoing();
    closeMob();
}

function showSchedule() {
    hideAll();
    show('scheduleSection');
    setActive('nav-schedule');
    loadSchedule();
    closeMob();
}

function showAnimeList() {
    hideAll();
    show('animeListSection');
    setActive('nav-list');
    loadList();
    closeMob();
}

function showSearch(q) {
    hideAll();
    show('searchSection');
    document.getElementById('searchQuery').textContent = q;
    loadSearch(q);
    closeMob();
    document.getElementById('suggestBox').style.display = 'none';
}

function showDetail(series) {
    hideAll();
    show('detailSection');
    currentSeries = series;
    loadDetail(series);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('suggestBox').style.display = 'none';
}

function showStream(slug, series, ep) {
    hideAll();
    show('streamSection');
    loadStream(slug, series, ep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAll() {
    ['heroSection', 'ongoingHomeSection', 'popularSection', 'latestSection',
     'ongoingSection', 'scheduleSection', 'animeListSection', 'searchSection',
     'detailSection', 'streamSection'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function show(...ids) {
    ids.forEach(id => document.getElementById(id).style.display = 'block');
}

function setActive(id) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
}

function toggleMobile() {
    document.getElementById('mobileNav').classList.toggle('active');
    document.getElementById('mobileOverlay').classList.toggle('active');
}

function closeMob() {
    document.getElementById('mobileNav').classList.remove('active');
    document.getElementById('mobileOverlay').classList.remove('active');
}

function toggleMobileSearch() {
    document.querySelector('.search-wrapper').classList.toggle('mob-show');
    if (document.querySelector('.search-wrapper').classList.contains('mob-show')) {
        document.getElementById('searchInput').focus();
    }
}

// Search
function handleSearch(e) { if (e.key === 'Enter') searchAnime(); }
function searchAnime() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) showSearch(q);
}

// API Fetch
async function api(endpoint, params = {}) {
    showLoader();
    try {
        const url = new URL(`${API}${endpoint}`);
        Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.append(k, v); });
        const res = await fetch(url);
        const data = await res.json();
        hideLoader();
        return data;
    } catch (e) {
        hideLoader();
        console.error(e);
        return null;
    }
}

// Loaders
async function loadHome() {
    // Load all home sections
    loadOngoingHome();
    loadPopular();
    loadLatest();
    loadHero();
}

async function loadHero() {
    const d = await api('/ongoing');
    if (d?.data) renderHero(d.data.slice(0, 6));
}

async function loadOngoingHome() {
    const d = await api('/ongoing');
    if (d?.data) {
        const sorted = [...d.data].sort((a, b) => (b.id || 0) - (a.id || 0));
        lastOngoingData = sorted;
        renderCards(sorted.slice(0, 12), 'ongoingHomeAnime');
        updateLastRefreshTime();
    }
}

async function loadPopular() {
    const d = await api('/home', { page: 1 });
    if (d?.data) {
        // Sort by score for popular
        const sorted = [...d.data].sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
        renderCards(sorted.slice(0, 12), 'popularAnime');
    }
}

async function loadLatest(page = 1) {
    const d = await api('/home', { page });
    if (d?.data) renderCards(d.data, 'latestAnime');
}

async function loadOngoing() {
    const d = await api('/ongoing');
    if (d?.data) {
        const sorted = [...d.data].sort((a, b) => (b.id || 0) - (a.id || 0));
        renderCards(sorted, 'ongoingAnime');
    }
}

async function loadSchedule() {
    const d = await api('/jadwal');
    if (d?.data) renderSchedule(d.data);
}

async function loadList() {
    // anime-list returns grouped data directly (not data.data)
    const d = await api('/anime-list');
    if (d) {
        // API returns { "#": [...], "A": [...], "B": [...], ... }
        const letters = Object.keys(d).filter(k => k !== 'author' && k !== 'contact' && k !== 'status');
        if (letters.length) {
            renderListGrouped(d, letters);
        } else {
            document.getElementById('animeList').innerHTML = '<div class="error-box"><i class="fas fa-list"></i><h3>Daftar kosong</h3></div>';
        }
    }
}

async function loadSearch(q) {
    const d = await api('/search', { query: q, page: 1 });
    if (d?.data) {
        let all = [];
        d.data.forEach(g => { if (g.result) all = all.concat(g.result); });
        if (all.length) {
            renderCards(all, 'searchResults');
        } else {
            document.getElementById('searchResults').innerHTML = `
                <div class="error-box" style="grid-column:1/-1">
                    <i class="fas fa-search"></i>
                    <h3>Anime tidak ditemukan</h3>
                    <p>Coba kata kunci lain</p>
                </div>
            `;
        }
    }
}

async function loadDetail(series) {
    const d = await api('/detail', { series });
    if (d?.data) {
        const a = Array.isArray(d.data) ? d.data[0] : d.data;
        renderDetail(a);
    }
}

async function loadStream(slug, series, ep) {
    const d = await api('/stream', { slug, series, episode: ep });
    if (d) renderStream(d, series, ep);
}

// Render Hero
function renderHero(list) {
    const el = document.getElementById('heroSlider');
    if (!list?.length) return;
    
    el.innerHTML = list.map((a, i) => {
        const title = a.judul || a.title || '';
        const cover = fixImg(a.cover);
        const syn = a.sinopsis || '';
        const genres = a.genre || [];
        const score = a.score || '';
        const slug = a.url || a.id || '';

        return `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" onclick="showDetail('${slug}')">
                <div class="hero-bg" style="background-image:url('${cover}')"></div>
                <div class="hero-body">
                    <div class="hero-poster">
                        <img src="${cover}" alt="${title}" onerror="imgError(this)">
                    </div>
                    <div class="hero-content">
                        <div class="hero-tag"><i class="fas fa-fire"></i> TRENDING</div>
                        <h1 class="hero-title">${title}</h1>
                        <div class="hero-genres">
                            ${score ? `<span class="hero-genre score"><i class="fas fa-star"></i> ${score}</span>` : ''}
                            ${genres.slice(0, 4).map(g => `<span class="hero-genre">${g}</span>`).join('')}
                        </div>
                        <p class="hero-desc">${syn.substring(0, 180)}${syn.length > 180 ? '...' : ''}</p>
                        <span class="hero-btn"><i class="fas fa-play"></i> Lihat Detail</span>
                    </div>
                </div>
            </div>
        `;
    }).join('') + `
        <div class="hero-dots">
            ${list.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" onclick="goSlide(${i}, event)"></div>`).join('')}
        </div>
    `;

    heroIdx = 0;
    clearInterval(heroTimer);
    heroTimer = setInterval(() => goSlide((heroIdx + 1) % list.length), 5000);
}

function goSlide(i, e) {
    if (e) e.stopPropagation();
    document.querySelectorAll('.hero-slide').forEach((s, idx) => s.classList.toggle('active', idx === i));
    document.querySelectorAll('.hero-dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
    heroIdx = i;
}

// Render Cards
function renderCards(list, containerId) {
    const c = document.getElementById(containerId);
    if (!list?.length) {
        c.innerHTML = `<div class="error-box" style="grid-column:1/-1"><i class="fas fa-inbox"></i><h3>Tidak ada data</h3></div>`;
        return;
    }
    c.innerHTML = list.map((a, i) => {
        const slug = a.url || a.slug || a.id;
        const title = a.judul || a.title || 'Untitled';
        const cover = fixImg(a.cover || a.thumbnail || a.image);
        const type = a.type || 'TV';
        const score = a.score || a.rating || '';
        const ep = a.lastch || a.episode || '';
        const status = a.status || '';

        return `
            <div class="card" onclick="showDetail('${slug}')" style="animation-delay:${i * 0.04}s">
                <div class="card-img">
                    <img src="${cover}" alt="${title}" loading="lazy" onerror="imgError(this)">
                    <div class="card-hover">
                        <div class="card-play"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="card-badges">
                        ${ep ? `<span class="card-badge ep">${ep}</span>` : ''}
                        ${type ? `<span class="card-badge type">${type}</span>` : ''}
                        ${status === 'Ongoing' ? `<span class="card-badge ongoing">Ongoing</span>` : ''}
                    </div>
                    ${score ? `<div class="card-score"><i class="fas fa-star"></i> ${score}</div>` : ''}
                </div>
                <div class="card-info">
                    <h3 class="card-title">${title}</h3>
                    <div class="card-meta">${ep || (a.total_episode ? a.total_episode + ' Eps' : '')}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Grouped List (anime-list API)
function renderListGrouped(data, letters) {
    const c = document.getElementById('animeList');
    letters.sort();
    
    c.innerHTML = letters.map(letter => {
        const items = data[letter] || [];
        if (!items.length) return '';
        
        return `
            <div class="list-group">
                <div class="list-letter">${letter}</div>
                <div class="list-items">
                    ${items.map(a => `
                        <div class="list-item" onclick="showDetail('${a.url || a.id}')">
                            <img src="${fixImg(a.cover)}" class="list-item-img" onerror="imgError(this)">
                            <span>${a.judul || a.title || ''}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Render Schedule
function renderSchedule(data) {
    const c = document.getElementById('scheduleAnime');
    if (!data?.length) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-calendar-times"></i><h3>Jadwal tidak tersedia</h3></div>`;
        return;
    }

    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7;

    const sorted = [...data].sort((a, b) => {
        const aIdx = dayOrder.indexOf(a.day || '');
        const bIdx = dayOrder.indexOf(b.day || '');
        return ((aIdx - todayIdx + 7) % 7) - ((bIdx - todayIdx + 7) % 7);
    });

    c.innerHTML = sorted.map(day => {
        const name = day.day || '';
        const date = day.date || '';
        const list = day.animeList || [];
        const isToday = dayOrder.indexOf(name) === todayIdx;

        return `
            <div class="schedule-card ${isToday ? 'schedule-today' : ''}">
                <div class="schedule-header">
                    <i class="fas fa-calendar-day"></i> 
                    ${name} ${date ? `<span class="schedule-date">${date}</span>` : ''}
                    ${isToday ? '<span class="schedule-badge">Hari Ini</span>' : ''}
                </div>
                <div class="schedule-body">
                    ${list.length ? list.map(a => `
                        <div class="schedule-item" onclick="showDetail('${a.link || a.url || a.id}')">
                            <img src="${fixImg(a.cover)}" alt="${a.anime_name || ''}" class="schedule-img" onerror="imgError(this)">
                            <div class="schedule-info">
                                <h4>${a.anime_name || ''}</h4>
                                <p><i class="fas fa-clock"></i> ${a.lastup || 'Upcoming'}</p>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--text3);padding:12px;">Tidak ada jadwal</p>'}
                </div>
            </div>
        `;
    }).join('');
}

// Render Detail
function renderDetail(anime) {
    const c = document.getElementById('animeDetail');
    if (!anime) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-exclamation-circle"></i><h3>Anime tidak ditemukan</h3></div>`;
        return;
    }
    const chapters = anime.chapter || [];
    const genres = anime.genre || [];
    const title = anime.judul || anime.title || '';
    const cover = fixImg(anime.cover);
    const syn = anime.sinopsis || 'Sinopsis tidak tersedia.';
    const sid = anime.series_id || anime.url || currentSeries;

    c.innerHTML = `
        <div class="detail-back" onclick="goBack()"><i class="fas fa-arrow-left"></i> Kembali</div>
        <div class="detail-card">
            <div class="detail-hero">
                <div class="detail-poster">
                    <img src="${cover}" alt="${title}" onerror="imgError(this)">
                </div>
                <div class="detail-info">
                    <h1 class="detail-title">${title}</h1>
                    <div class="detail-tags">
                        ${anime.status ? `<div class="detail-tag"><i class="fas fa-circle-info"></i> ${anime.status}</div>` : ''}
                        ${anime.type ? `<div class="detail-tag"><i class="fas fa-tv"></i> ${anime.type}</div>` : ''}
                        ${anime.rating || anime.score ? `<div class="detail-tag"><i class="fas fa-star"></i> ${anime.rating || anime.score}</div>` : ''}
                        ${anime.published || anime.rilis ? `<div class="detail-tag"><i class="fas fa-calendar"></i> ${anime.published || anime.rilis}</div>` : ''}
                        ${anime.author || anime.studio ? `<div class="detail-tag"><i class="fas fa-film"></i> ${anime.author || anime.studio}</div>` : ''}
                        ${chapters.length ? `<div class="detail-tag"><i class="fas fa-list"></i> ${chapters.length} Episode</div>` : ''}
                    </div>
                    <div class="detail-genres">
                        ${genres.map(g => `<span class="detail-genre">${g}</span>`).join('')}
                    </div>
                    <div class="detail-synopsis">${syn}</div>
                </div>
            </div>
            <div class="detail-episodes">
                <h2 class="detail-ep-title"><i class="fas fa-list-ol"></i> Daftar Episode</h2>
                <div class="ep-grid">
                    ${chapters.length ? chapters.map(ep => {
                        const epSlug = ep.url || ep.id;
                        const epTitle = ep.ch || ep.title || '';
                        return `<div class="ep-btn" onclick="showStream('${epSlug}', '${sid}', '${epTitle}')">${epTitle}</div>`;
                    }).join('') : '<p style="color:var(--text3)">Episode belum tersedia</p>'}
                </div>
            </div>
        </div>
    `;
}

// Render Stream
function renderStream(data, series, ep) {
    const c = document.getElementById('streamContainer');
    if (!data) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-video-slash"></i><h3>Video tidak tersedia</h3></div>`;
        return;
    }

    let url = '';
    let resos = [];
    let curReso = '720p';

    const info = data.data ? (Array.isArray(data.data) ? data.data[0] : data.data) : data;

    if (info?.streams) {
        if (info.reso) resos = info.reso;
        if (info.streams['720p']?.length) { url = info.streams['720p'][0].link; curReso = '720p'; }
        else if (info.streams['480p']?.length) { url = info.streams['480p'][0].link; curReso = '480p'; }
        else {
            const keys = Object.keys(info.streams);
            if (keys.length && info.streams[keys[0]]?.length) {
                url = info.streams[keys[0]][0].link;
                curReso = keys[0];
            }
        }
    }

    c.innerHTML = `
        <div class="stream-back" onclick="showDetail('${series}')"><i class="fas fa-arrow-left"></i> Kembali</div>
        <div class="stream-card">
            <div class="stream-player">
                ${url ?
                    `<video id="vid" controls autoplay playsinline><source src="${url}" type="video/mp4"></video>` :
                    `<div class="stream-empty"><i class="fas fa-video-slash"></i><p>Video tidak tersedia</p></div>`
                }
            </div>
            <div class="stream-body">
                <h2 class="stream-title"><i class="fas fa-play-circle"></i> ${ep}</h2>
                ${resos.length ? `
                    <div class="stream-section">
                        <h4><i class="fas fa-cog"></i> Kualitas Video</h4>
                        <div class="quality-btns">
                            ${resos.map(r => {
                                const u = info.streams[r]?.[0]?.link || '';
                                return u ? `<button class="quality-btn ${r === curReso ? 'active' : ''}" onclick="switchQ('${u}', this)">${r}</button>` : '';
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${url ? `
                    <div class="stream-section">
                        <h4><i class="fas fa-link"></i> Video URL</h4>
                        <div class="url-box">
                            <input type="text" class="url-input" value="${url}" readonly>
                            <button class="url-btn" onclick="copyUrl('${url}')"><i class="fas fa-copy"></i></button>
                            <a href="${url}" target="_blank" class="url-btn"><i class="fas fa-download"></i></a>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Helpers
function switchQ(url, btn) {
    const v = document.getElementById('vid');
    if (v) {
        const t = v.currentTime;
        v.src = url;
        v.load();
        v.currentTime = t;
        v.play();
    }
    document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function copyUrl(url) {
    navigator.clipboard?.writeText(url).then(() => alert('URL disalin!')).catch(() => {
        const inp = document.createElement('input');
        inp.value = url;
        document.body.appendChild(inp);
        inp.select();
        document.execCommand('copy');
        document.body.removeChild(inp);
        alert('URL disalin!');
    });
}

function goBack() {
    if (currentSeries) showDetail(currentSeries);
    else showHome();
}
