// API
const API = 'https://api.sonzaix.indevs.in/anime';

// State
let currentSeries = '';
let heroIdx = 0;
let heroTimer;

// Placeholder image (inline SVG)
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect fill='%2312121f' width='300' height='400'/%3E%3Ctext fill='%236b6b80' font-family='sans-serif' font-size='16' x='50%25' y='48%25' text-anchor='middle'%3E%3Ci class='fas fa-image'%3E%3C/i%3E%3C/text%3E%3Ctext fill='%236b6b80' font-family='sans-serif' font-size='12' x='50%25' y='55%25' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

// Fix image URL (add proxy for problematic URLs)
function fixImg(url) {
    if (!url) return PLACEHOLDER;
    // Remove i0.wp.com proxy wrapper if present
    let fixed = url.replace(/https:\/\/i0\.wp\.com\//, 'https://');
    // Ensure HTTPS
    if (fixed.startsWith('http://')) fixed = fixed.replace('http://', 'https://');
    return fixed;
}

// Image error handler
function imgError(img) {
    img.onerror = null;
    img.src = PLACEHOLDER;
    img.style.objectFit = 'contain';
    img.style.padding = '20px';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadHome();
    initScroll();
    initHeader();
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

// Loader
function showLoader() { document.getElementById('loader').classList.add('active'); }
function hideLoader() { document.getElementById('loader').classList.remove('active'); }

// Navigation
function showHome() {
    hideAll();
    show('heroSection', 'latestSection');
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
}

function showDetail(series) {
    hideAll();
    show('detailSection');
    currentSeries = series;
    loadDetail(series);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStream(slug, series, ep) {
    hideAll();
    show('streamSection');
    loadStream(slug, series, ep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAll() {
    ['heroSection', 'latestSection', 'ongoingSection', 'scheduleSection',
     'animeListSection', 'searchSection', 'detailSection', 'streamSection'].forEach(id => {
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
async function loadHome(page = 1) {
    const d = await api('/home', { page });
    if (d?.data) {
        renderCards(d.data, 'latestAnime');
        loadHero(d.data.slice(0, 6));
    }
}

async function loadOngoing() {
    const d = await api('/ongoing');
    if (d?.data) renderCards(d.data, 'ongoingAnime');
}

async function loadSchedule() {
    const d = await api('/jadwal');
    if (d?.data) renderSchedule(d.data);
}

async function loadList() {
    const d = await api('/anime-list');
    if (d?.data) renderList(d.data);
}

async function loadSearch(q) {
    const d = await api('/search', { query: q, page: 1 });
    if (d?.data) {
        let all = [];
        d.data.forEach(g => { if (g.result) all = all.concat(g.result); });
        renderCards(all, 'searchResults');
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
        c.innerHTML = `<div class="error-box" style="grid-column:1/-1"><i class="fas fa-inbox"></i><h3>Tidak ada data</h3><p>Anime tidak ditemukan</p></div>`;
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

// Render Schedule
function renderSchedule(data) {
    const c = document.getElementById('scheduleAnime');
    if (!data?.length) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-calendar-times"></i><h3>Jadwal tidak tersedia</h3></div>`;
        return;
    }
    c.innerHTML = data.map(day => {
        const name = day.day || day.hari || day.title || '';
        const list = day.anime || day.list || day.data || [];
        return `
            <div class="schedule-card">
                <div class="schedule-header"><i class="fas fa-calendar-day"></i> ${name}</div>
                <div class="schedule-body">
                    ${list.length ? list.map(a => `
                        <div class="schedule-item" onclick="showDetail('${a.url || a.slug || a.id}')">
                            <img src="${fixImg(a.cover || a.thumbnail)}" alt="${a.judul || a.title}" class="schedule-img" onerror="imgError(this)">
                            <div class="schedule-info">
                                <h4>${a.judul || a.title || ''}</h4>
                                <p>${a.time || a.waktu || a.episode || ''}</p>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--text3);padding:12px;">Tidak ada jadwal</p>'}
                </div>
            </div>
        `;
    }).join('');
}

// Render List
function renderList(data) {
    const c = document.getElementById('animeList');
    if (!data?.length) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-list"></i><h3>Daftar kosong</h3></div>`;
        return;
    }
    const grouped = {};
    data.forEach(a => {
        const t = (a.judul || a.title || '').trim();
        const letter = t.charAt(0).toUpperCase() || '#';
        if (!grouped[letter]) grouped[letter] = [];
        grouped[letter].push(a);
    });
    c.innerHTML = Object.keys(grouped).sort().map(letter => `
        <div class="list-group">
            <div class="list-letter">${letter}</div>
            <div class="list-items">
                ${grouped[letter].map(a => `
                    <div class="list-item" onclick="showDetail('${a.url || a.slug || a.id}')">${a.judul || a.title || ''}</div>
                `).join('')}
            </div>
        </div>
    `).join('');
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
