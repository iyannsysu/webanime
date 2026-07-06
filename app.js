// API Configuration
const API_BASE = 'https://api.sonzaix.indevs.in/anime';

// State
let currentSeries = '';
let currentSearchQuery = '';
let heroIndex = 0;
let heroInterval;

// DOM
const loading = document.getElementById('loading');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadLatestAnime();
    loadHeroContent();
    setCurrentDate();
    initBackToTop();
});

function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('id-ID', options);
}

function initBackToTop() {
    window.addEventListener('scroll', () => {
        document.getElementById('backToTop').classList.toggle('visible', window.scrollY > 300);
    });
}

// Loading
function showLoading() { loading.classList.add('active'); }
function hideLoading() { loading.classList.remove('active'); }

// Navigation
function showHome() {
    hideAll();
    document.getElementById('heroSection').style.display = 'block';
    document.getElementById('latestSection').style.display = 'block';
    setActive('nav-home');
    loadLatestAnime();
    closeMenus();
}

function showOngoing() {
    hideAll();
    document.getElementById('ongoingSection').style.display = 'block';
    setActive('nav-ongoing');
    loadOngoingAnime();
    closeMenus();
}

function showSchedule() {
    hideAll();
    document.getElementById('scheduleSection').style.display = 'block';
    setActive('nav-schedule');
    loadSchedule();
    closeMenus();
}

function showAnimeList() {
    hideAll();
    document.getElementById('animeListSection').style.display = 'block';
    setActive('nav-list');
    loadAnimeList();
    closeMenus();
}

function showSearchResults(query) {
    hideAll();
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('searchQuery').textContent = query;
    currentSearchQuery = query;
    loadSearchResults(query);
    closeMenus();
}

function showAnimeDetail(series) {
    hideAll();
    document.getElementById('detailSection').style.display = 'block';
    currentSeries = series;
    loadAnimeDetail(series);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStream(slug, series, episode) {
    hideAll();
    document.getElementById('streamSection').style.display = 'block';
    loadStream(slug, series, episode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAll() {
    ['heroSection', 'latestSection', 'ongoingSection', 'scheduleSection', 
     'animeListSection', 'searchSection', 'detailSection', 'streamSection'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
}

function setActive(id) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
}

function toggleSearch() {
    document.getElementById('searchBox').classList.toggle('active');
    if (document.getElementById('searchBox').classList.contains('active')) {
        document.getElementById('searchInput').focus();
    }
}

function toggleMobileMenu() {
    document.getElementById('mobileNav').classList.toggle('active');
}

function closeMenus() {
    document.getElementById('mobileNav').classList.remove('active');
    document.getElementById('searchBox').classList.remove('active');
}

// Search
function handleSearch(e) { if (e.key === 'Enter') searchAnime(); }
function searchAnime() {
    const q = document.getElementById('searchInput').value.trim();
    if (q) showSearchResults(q);
}

// API
async function fetchAPI(endpoint, params = {}) {
    showLoading();
    try {
        const url = new URL(`${API_BASE}${endpoint}`);
        Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.append(k, v); });
        const res = await fetch(url);
        const data = await res.json();
        hideLoading();
        return data;
    } catch (err) {
        hideLoading();
        console.error('API Error:', err);
        return null;
    }
}

// Loaders
async function loadLatestAnime(page = 1) {
    const data = await fetchAPI('/home', { page });
    if (data?.data) renderLatestGrid(data.data, 'latestAnime');
}

async function loadHeroContent() {
    const data = await fetchAPI('/ongoing');
    if (data?.data?.length) renderHeroSlider(data.data.slice(0, 6));
}

async function loadOngoingAnime() {
    const data = await fetchAPI('/ongoing');
    if (data?.data) renderOngoingGrid(data.data, 'ongoingAnime');
}

async function loadSchedule() {
    const data = await fetchAPI('/jadwal');
    if (data?.data) renderSchedule(data.data);
}

async function loadAnimeList() {
    const data = await fetchAPI('/anime-list');
    if (data?.data) renderAnimeList(data.data);
}

async function loadSearchResults(query) {
    const data = await fetchAPI('/search', { query, page: 1 });
    if (data?.data) {
        let results = [];
        data.data.forEach(g => { if (g.result) results = results.concat(g.result); });
        renderLatestGrid(results, 'searchResults');
    }
}

async function loadAnimeDetail(series) {
    const data = await fetchAPI('/detail', { series });
    if (data?.data) {
        const anime = Array.isArray(data.data) ? data.data[0] : data.data;
        renderDetail(anime);
    }
}

async function loadStream(slug, series, episode) {
    const data = await fetchAPI('/stream', { slug, series, episode });
    if (data) renderStream(data, series, episode);
}

// Renderers
function renderHeroSlider(animeList) {
    const slider = document.getElementById('heroSlider');
    slider.innerHTML = animeList.map((a, i) => {
        const title = a.judul || a.title || '';
        const cover = a.cover || '';
        const synopsis = a.sinopsis || '';
        const genres = a.genre || [];
        const score = a.score || '';
        const slug = a.url || a.id || '';
        
        return `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" onclick="showAnimeDetail('${slug}')">
                <div class="hero-slide-bg" style="background-image:url(${cover})"></div>
                <div class="hero-slide-content">
                    <div class="hero-slide-image">
                        <img src="${cover}" alt="${title}" onerror="this.style.display='none'">
                    </div>
                    <div class="hero-slide-info">
                        <div class="hero-badge"><i class="fas fa-fire"></i> HOT</div>
                        <h1 class="hero-title">${title}</h1>
                        <div class="hero-genres">
                            ${score ? `<span class="hero-genre"><i class="fas fa-star" style="color:var(--star)"></i> ${score}</span>` : ''}
                            ${genres.map(g => `<span class="hero-genre">${g}</span>`).join('')}
                        </div>
                        <p class="hero-desc">${synopsis.substring(0, 200)}${synopsis.length > 200 ? '...' : ''}</p>
                        <span class="hero-btn"><i class="fas fa-play"></i> Selengkapnya</span>
                    </div>
                </div>
            </div>
        `;
    }).join('') + `
        <div class="hero-dots">
            ${animeList.map((_, i) => `<div class="hero-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('')}
        </div>
    `;
    
    heroIndex = 0;
    clearInterval(heroInterval);
    heroInterval = setInterval(() => goToSlide((heroIndex + 1) % animeList.length), 5000);
}

function goToSlide(index) {
    document.querySelectorAll('.hero-slide').forEach((s, i) => s.classList.toggle('active', i === index));
    document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === index));
    heroIndex = index;
}

function renderLatestGrid(list, containerId) {
    const c = document.getElementById(containerId);
    if (!list?.length) {
        c.innerHTML = `<div class="error-box" style="grid-column:1/-1"><i class="fas fa-inbox"></i><h3>Tidak ada data</h3></div>`;
        return;
    }
    c.innerHTML = list.map((a, i) => {
        const slug = a.url || a.slug || a.id;
        const title = a.judul || a.title || 'Untitled';
        const cover = a.cover || a.thumbnail || a.image || '';
        const type = a.type || 'TV';
        const score = a.score || a.rating || '';
        const ep = a.lastch || a.episode || '';
        const status = a.status || '';
        
        return `
            <div class="anime-card" onclick="showAnimeDetail('${slug}')" style="animation-delay:${i*0.05}s">
                <div class="anime-card-image">
                    <img src="${cover}" alt="${title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 400%22><rect fill=%22%231a1f2e%22 width=%22300%22 height=%22400%22/><text fill=%22%235a6577%22 font-family=%22sans-serif%22 font-size=%2224%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22>No Image</text></svg>'">
                    <div class="anime-card-overlay">
                        <div class="anime-card-play"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="anime-card-badges">
                        ${ep ? `<span class="badge badge-episode">${ep}</span>` : ''}
                        ${type ? `<span class="badge badge-type">${type}</span>` : ''}
                        ${status === 'Ongoing' ? `<span class="badge badge-status">Ongoing</span>` : ''}
                    </div>
                    ${score ? `<div class="anime-card-rating"><i class="fas fa-star"></i> ${score}</div>` : ''}
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${title}</h3>
                    <div class="anime-card-meta">${ep ? ep : (a.total_episode ? a.total_episode + ' Episode' : '')}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderOngoingGrid(list, containerId) {
    const c = document.getElementById(containerId);
    if (!list?.length) {
        c.innerHTML = `<div class="error-box" style="grid-column:1/-1"><i class="fas fa-inbox"></i><h3>Tidak ada data</h3></div>`;
        return;
    }
    c.innerHTML = list.map((a, i) => {
        const slug = a.url || a.id;
        const title = a.judul || a.title || '';
        const cover = a.cover || '';
        const score = a.score || '';
        const type = a.type || 'TV';
        
        return `
            <div class="anime-card" onclick="showAnimeDetail('${slug}')" style="animation-delay:${i*0.03}s">
                <div class="anime-card-image">
                    <img src="${cover}" alt="${title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 400%22><rect fill=%22%231a1f2e%22 width=%22300%22 height=%22400%22/><text fill=%22%235a6577%22 font-family=%22sans-serif%22 font-size=%2224%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22>No Image</text></svg>'">
                    <div class="anime-card-overlay">
                        <div class="anime-card-play"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="anime-card-badges">
                        <span class="badge badge-type">${type}</span>
                    </div>
                    ${score ? `<div class="anime-card-rating"><i class="fas fa-star"></i> ${score}</div>` : ''}
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${title}</h3>
                    <div class="anime-card-meta">${a.lastup || 'Ongoing'}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderSchedule(data) {
    const c = document.getElementById('scheduleAnime');
    if (!data?.length) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-calendar-times"></i><h3>Jadwal tidak tersedia</h3></div>`;
        return;
    }
    c.innerHTML = data.map(day => {
        const dayName = day.day || day.hari || day.title || '';
        const animeList = day.anime || day.list || day.data || [];
        return `
            <div class="schedule-card">
                <div class="schedule-day"><i class="fas fa-calendar-day"></i> ${dayName}</div>
                <div class="schedule-list">
                    ${animeList.length ? animeList.map(a => `
                        <div class="schedule-item" onclick="showAnimeDetail('${a.url || a.slug || a.id}')">
                            ${a.cover || a.thumbnail ? `<img src="${a.cover || a.thumbnail}" alt="${a.judul || a.title}" class="schedule-item-img" onerror="this.style.display='none'">` : ''}
                            <div class="schedule-item-info">
                                <h4>${a.judul || a.title || ''}</h4>
                                <p>${a.time || a.waktu || a.episode || ''}</p>
                            </div>
                        </div>
                    `).join('') : '<p style="color:var(--text-muted);padding:10px;">Tidak ada jadwal</p>'}
                </div>
            </div>
        `;
    }).join('');
}

function renderAnimeList(data) {
    const c = document.getElementById('animeList');
    if (!data?.length) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-list-alt"></i><h3>Daftar kosong</h3></div>`;
        return;
    }
    const grouped = {};
    data.forEach(a => {
        const title = a.judul || a.title || '';
        const letter = title.charAt(0).toUpperCase();
        if (!grouped[letter]) grouped[letter] = [];
        grouped[letter].push(a);
    });
    c.innerHTML = Object.keys(grouped).sort().map(letter => `
        <div class="list-group">
            <div class="list-letter">${letter}</div>
            <div class="list-items">
                ${grouped[letter].map(a => `
                    <div class="list-item" onclick="showAnimeDetail('${a.url || a.slug || a.id}')">${a.judul || a.title || ''}</div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderDetail(anime) {
    const c = document.getElementById('animeDetail');
    if (!anime) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-exclamation-circle"></i><h3>Anime tidak ditemukan</h3></div>`;
        return;
    }
    const chapters = anime.chapter || [];
    const genres = anime.genre || [];
    const title = anime.judul || anime.title || '';
    const cover = anime.cover || '';
    const synopsis = anime.sinopsis || 'Sinopsis tidak tersedia.';
    const seriesId = anime.series_id || anime.url || currentSeries;
    
    c.innerHTML = `
        <div class="detail-back" onclick="goBack()"><i class="fas fa-arrow-left"></i> Kembali</div>
        <div class="detail-container">
            <div class="detail-header">
                <div class="detail-poster">
                    <img src="${cover}" alt="${title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 400%22><rect fill=%22%231a1f2e%22 width=%22300%22 height=%22400%22/><text fill=%22%235a6577%22 font-family=%22sans-serif%22 font-size=%2224%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22>No Image</text></svg>'">
                </div>
                <div class="detail-info">
                    <h1 class="detail-title">${title}</h1>
                    <div class="detail-meta-list">
                        ${anime.status ? `<div class="detail-meta-item"><i class="fas fa-info-circle"></i> ${anime.status}</div>` : ''}
                        ${anime.type ? `<div class="detail-meta-item"><i class="fas fa-tv"></i> ${anime.type}</div>` : ''}
                        ${anime.rating || anime.score ? `<div class="detail-meta-item"><i class="fas fa-star"></i> ${anime.rating || anime.score}</div>` : ''}
                        ${anime.published || anime.rilis ? `<div class="detail-meta-item"><i class="fas fa-calendar"></i> ${anime.published || anime.rilis}</div>` : ''}
                        ${anime.author || anime.studio ? `<div class="detail-meta-item"><i class="fas fa-film"></i> ${anime.author || anime.studio}</div>` : ''}
                        ${chapters.length ? `<div class="detail-meta-item"><i class="fas fa-list"></i> ${chapters.length} Episode</div>` : ''}
                    </div>
                    <div class="detail-genres">
                        ${genres.map(g => `<span class="detail-genre">${g}</span>`).join('')}
                    </div>
                    <div class="detail-synopsis">${synopsis}</div>
                </div>
            </div>
            <div class="detail-body">
                <h2 class="detail-section-title"><i class="fas fa-list-ol"></i> Daftar Episode</h2>
                <div class="episodes-grid">
                    ${chapters.length ? chapters.map(ep => {
                        const epSlug = ep.url || ep.id;
                        const epTitle = ep.ch || ep.title || '';
                        return `<div class="episode-btn" onclick="showStream('${epSlug}', '${seriesId}', '${epTitle}')">${epTitle}</div>`;
                    }).join('') : '<p style="color:var(--text-muted)">Episode belum tersedia</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderStream(streamData, series, currentEpisode) {
    const c = document.getElementById('streamContainer');
    if (!streamData) {
        c.innerHTML = `<div class="error-box"><i class="fas fa-video-slash"></i><h3>Video tidak tersedia</h3></div>`;
        return;
    }

    let streamUrl = '';
    let resolutions = [];
    let currentReso = '720p';
    
    const info = streamData.data ? (Array.isArray(streamData.data) ? streamData.data[0] : streamData.data) : streamData;
    
    if (info?.streams) {
        if (info.reso) resolutions = info.reso;
        
        if (info.streams['720p']?.length) {
            streamUrl = info.streams['720p'][0].link;
            currentReso = '720p';
        } else if (info.streams['480p']?.length) {
            streamUrl = info.streams['480p'][0].link;
            currentReso = '480p';
        } else {
            const keys = Object.keys(info.streams);
            if (keys.length && info.streams[keys[0]]?.length) {
                streamUrl = info.streams[keys[0]][0].link;
                currentReso = keys[0];
            }
        }
    }

    c.innerHTML = `
        <div class="stream-back" onclick="showAnimeDetail('${series}')"><i class="fas fa-arrow-left"></i> Kembali</div>
        <div class="stream-container">
            <div class="stream-player">
                ${streamUrl ? 
                    `<video id="videoPlayer" controls autoplay><source src="${streamUrl}" type="video/mp4"></video>` :
                    `<div class="stream-placeholder"><i class="fas fa-video-slash"></i><p>Video tidak tersedia</p></div>`
                }
            </div>
            <div class="stream-info">
                <h2 class="stream-title"><i class="fas fa-play-circle"></i> ${currentEpisode}</h2>
                ${resolutions.length ? `
                    <div class="stream-quality">
                        <h4><i class="fas fa-cog"></i> Kualitas:</h4>
                        <div class="quality-buttons">
                            ${resolutions.map(r => {
                                const url = info.streams[r]?.[0]?.link || '';
                                return url ? `<button class="quality-btn ${r === currentReso ? 'active' : ''}" onclick="switchQuality('${url}', '${r}', this)">${r}</button>` : '';
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
                ${streamUrl ? `
                    <div class="stream-url-box">
                        <input type="text" class="stream-url-input" value="${streamUrl}" readonly>
                        <button class="stream-url-btn" onclick="copyUrl('${streamUrl}')" title="Copy"><i class="fas fa-copy"></i></button>
                        <a href="${streamUrl}" target="_blank" class="stream-url-btn" title="Download"><i class="fas fa-download"></i></a>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Helpers
function switchQuality(url, reso, btn) {
    const video = document.getElementById('videoPlayer');
    if (video) {
        const time = video.currentTime;
        video.src = url;
        video.load();
        video.currentTime = time;
        video.play();
    }
    document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function copyUrl(url) {
    navigator.clipboard?.writeText(url).then(() => alert('URL disalin!')).catch(() => {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('URL disalin!');
    });
}

function goBack() {
    if (currentSeries) showAnimeDetail(currentSeries);
    else showHome();
}
