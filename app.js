// API Configuration
const API_BASE = 'https://api.sonzaix.indevs.in/anime';

// State Management
let currentPage = 1;
let currentSearchPage = 1;
let currentSearchQuery = '';
let currentAnimeSlug = '';
let currentSeries = '';

// DOM Elements
const loading = document.getElementById('loading');
const contentArea = document.getElementById('contentArea');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadLatestAnime();
    loadHeroContent();
});

// Show/Hide Loading
function showLoading() {
    loading.classList.add('active');
}

function hideLoading() {
    loading.classList.remove('active');
}

// Navigation Functions
function showHome() {
    hideAllSections();
    document.getElementById('latestSection').style.display = 'block';
    document.getElementById('heroSection').style.display = 'flex';
    updateActiveNav('nav-home');
    loadLatestAnime();
    closeMobileMenu();
}

function showOngoing() {
    hideAllSections();
    document.getElementById('ongoingSection').style.display = 'block';
    updateActiveNav('nav-ongoing');
    loadOngoingAnime();
    closeMobileMenu();
}

function showSchedule() {
    hideAllSections();
    document.getElementById('scheduleSection').style.display = 'block';
    updateActiveNav('nav-schedule');
    loadSchedule();
    closeMobileMenu();
}

function showAnimeList() {
    hideAllSections();
    document.getElementById('animeListSection').style.display = 'block';
    updateActiveNav('nav-list');
    loadAnimeList();
    closeMobileMenu();
}

function showSearchResults(query, page = 1) {
    hideAllSections();
    document.getElementById('searchSection').style.display = 'block';
    document.getElementById('searchQuery').textContent = query;
    currentSearchQuery = query;
    currentSearchPage = page;
    loadSearchResults(query, page);
}

function showAnimeDetail(series) {
    hideAllSections();
    document.getElementById('detailSection').style.display = 'block';
    currentSeries = series;
    loadAnimeDetail(series);
}

function showStream(slug, series, episode) {
    hideAllSections();
    document.getElementById('streamSection').style.display = 'block';
    currentAnimeSlug = slug;
    loadStream(slug, series, episode);
}

function hideAllSections() {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('latestSection').style.display = 'none';
    document.getElementById('ongoingSection').style.display = 'none';
    document.getElementById('scheduleSection').style.display = 'none';
    document.getElementById('animeListSection').style.display = 'none';
    document.getElementById('searchSection').style.display = 'none';
    document.getElementById('detailSection').style.display = 'none';
    document.getElementById('streamSection').style.display = 'none';
}

function updateActiveNav(activeId) {
    document.querySelectorAll('.nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(activeId)?.classList.add('active');
}

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    mobileNav.style.display = mobileNav.style.display === 'block' ? 'none' : 'block';
}

function closeMobileMenu() {
    document.getElementById('mobileNav').style.display = 'none';
}

// Search Function
function handleSearch(event) {
    if (event.key === 'Enter') {
        searchAnime();
    }
}

function searchAnime() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        showSearchResults(query);
    }
}

// API Functions
async function fetchAPI(endpoint, params = {}) {
    showLoading();
    try {
        const url = new URL(`${API_BASE}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url);
        const data = await response.json();
        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        console.error('API Error:', error);
        showError('Gagal memuat data. Silakan coba lagi.');
        return null;
    }
}

// Load Latest Anime
async function loadLatestAnime(page = 1) {
    currentPage = page;
    const data = await fetchAPI('/home', { page });
    if (data && data.data) {
        renderAnimeGrid(data.data, 'latestAnime');
        if (data.totalPages || data.lastPage) {
            renderPagination(data.totalPages || data.lastPage, page, 'latestPagination', 'loadLatestAnime');
        }
    }
}

// Load Hero Content
async function loadHeroContent() {
    const data = await fetchAPI('/ongoing');
    if (data && data.data && data.data.length > 0) {
        const heroAnime = data.data.slice(0, 5);
        renderHeroSlider(heroAnime);
    }
}

// Load Ongoing Anime
async function loadOngoingAnime() {
    const data = await fetchAPI('/ongoing');
    if (data && data.data) {
        renderAnimeGrid(data.data, 'ongoingAnime');
    }
}

// Load Schedule
async function loadSchedule() {
    const data = await fetchAPI('/jadwal');
    if (data && data.data) {
        renderSchedule(data.data);
    }
}

// Load Anime List
async function loadAnimeList() {
    const data = await fetchAPI('/anime-list');
    if (data && data.data) {
        renderAnimeList(data.data);
    }
}

// Load Search Results
async function loadSearchResults(query, page = 1) {
    currentSearchPage = page;
    const data = await fetchAPI('/search', { query, page });
    if (data && data.data) {
        renderAnimeGrid(data.data, 'searchResults');
        if (data.totalPages || data.lastPage) {
            renderPagination(data.totalPages || data.lastPage, page, 'searchPagination', 'loadSearchResultsWrapper');
        }
    }
}

// Wrapper for search pagination
function loadSearchResultsWrapper(page) {
    loadSearchResults(currentSearchQuery, page);
}

// Load Anime Detail
async function loadAnimeDetail(series) {
    const data = await fetchAPI('/detail', { series });
    if (data && data.data) {
        renderAnimeDetail(data.data);
    } else if (data) {
        renderAnimeDetail(data);
    }
}

// Load Stream
async function loadStream(slug, series, episode) {
    const data = await fetchAPI('/stream', { slug, series, episode });
    if (data && data.data) {
        renderStream(data.data, series, episode);
    } else if (data) {
        renderStream(data, series, episode);
    }
}

// Render Functions
function renderAnimeGrid(animeList, containerId) {
    const container = document.getElementById(containerId);
    if (!animeList || animeList.length === 0) {
        container.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1;">
                <i class="fas fa-inbox"></i>
                <h3>Tidak ada data</h3>
                <p>Anime tidak ditemukan</p>
            </div>
        `;
        return;
    }

    container.innerHTML = animeList.map((anime, index) => {
        const slug = anime.url || anime.slug || anime.series || anime.id;
        const title = anime.judul || anime.title || 'Untitled';
        const cover = anime.cover || anime.thumbnail || anime.image || anime.poster;
        const type = anime.type || '';
        const score = anime.score || '';
        const episode = anime.lastch || anime.episode || anime.total_episode || '';
        
        return `
            <div class="anime-card" onclick="showAnimeDetail('${slug}')" style="animation-delay: ${index * 0.05}s">
                <div class="anime-card-image">
                    ${cover ? 
                        `<img src="${cover}" alt="${title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'><i class=\\'fas fa-film\\'></i></div>'">` :
                        `<div class="no-image"><i class="fas fa-film"></i></div>`
                    }
                    ${type ? `<span class="anime-card-badge">${type}</span>` : ''}
                    ${score ? `<span class="anime-card-rating"><i class="fas fa-star"></i> ${score}</span>` : ''}
                </div>
                <div class="anime-card-info">
                    <h3 class="anime-card-title">${title}</h3>
                    <div class="anime-card-meta">
                        <span>${episode}</span>
                        ${anime.status ? `<span class="anime-card-type">${anime.status}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderHeroSlider(animeList) {
    const slider = document.getElementById('heroSlider');
    let currentIndex = 0;

    function updateHero() {
        const anime = animeList[currentIndex];
        document.getElementById('heroTitle').textContent = anime.judul || anime.title;
        document.getElementById('heroDesc').textContent = anime.sinopsis || anime.description || 'Nonton anime subtitle Indonesia terlengkap';
        
        const cover = anime.cover || anime.thumbnail || anime.image || anime.poster;
        if (cover) {
            slider.style.backgroundImage = `url(${cover})`;
            slider.style.backgroundSize = 'cover';
            slider.style.backgroundPosition = 'center';
        }

        currentIndex = (currentIndex + 1) % animeList.length;
    }

    updateHero();
    setInterval(updateHero, 5000);
}

function renderSchedule(scheduleData) {
    const container = document.getElementById('scheduleAnime');
    
    if (!scheduleData || scheduleData.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-calendar-times"></i>
                <h3>Jadwal tidak tersedia</h3>
                <p>Silakan cek kembali nanti</p>
            </div>
        `;
        return;
    }

    container.innerHTML = scheduleData.map(day => {
        const dayName = day.day || day.hari || day.title || 'Hari';
        const animeList = day.anime || day.list || day.data || [];
        
        return `
            <div class="schedule-card">
                <div class="schedule-day">
                    <i class="fas fa-calendar-day"></i> ${dayName}
                </div>
                ${animeList.length > 0 ? animeList.map(anime => `
                    <div class="schedule-anime-item" onclick="showAnimeDetail('${anime.url || anime.slug || anime.id}')">
                        ${anime.cover || anime.thumbnail || anime.image ? 
                            `<img src="${anime.cover || anime.thumbnail || anime.image}" alt="${anime.judul || anime.title}" class="schedule-anime-img" onerror="this.style.display='none'">` : 
                            ''
                        }
                        <div class="schedule-anime-info">
                            <h4>${anime.judul || anime.title || 'Untitled'}</h4>
                            <p>${anime.time || anime.waktu || anime.episode || ''}</p>
                        </div>
                    </div>
                `).join('') : '<p style="color: var(--gray); padding: 10px 0;">Tidak ada jadwal</p>'}
            </div>
        `;
    }).join('');
}

function renderAnimeList(animeData) {
    const container = document.getElementById('animeList');
    
    if (!animeData || animeData.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-list-alt"></i>
                <h3>Daftar anime kosong</h3>
                <p>Silakan cek kembali nanti</p>
            </div>
        `;
        return;
    }

    // Group by first letter
    const grouped = {};
    animeData.forEach(anime => {
        const title = anime.judul || anime.title || anime.name || '';
        const firstLetter = title.charAt(0).toUpperCase();
        if (!grouped[firstLetter]) {
            grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(anime);
    });

    container.innerHTML = Object.keys(grouped).sort().map(letter => `
        <div class="anime-list-group">
            <div class="anime-list-letter">${letter}</div>
            <div class="anime-list-items">
                ${grouped[letter].map(anime => `
                    <a class="anime-list-item" onclick="showAnimeDetail('${anime.url || anime.slug || anime.id}')">
                        ${anime.judul || anime.title || anime.name || 'Untitled'}
                    </a>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function renderAnimeDetail(anime) {
    const container = document.getElementById('animeDetail');
    
    if (!anime) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Anime tidak ditemukan</h3>
                <p>Silakan coba anime lain</p>
            </div>
        `;
        return;
    }

    const episodes = anime.episodes || [];
    const genres = anime.genre || anime.genres || [];
    const title = anime.judul || anime.title || 'Untitled';
    const cover = anime.cover || anime.thumbnail || anime.image || anime.poster;
    const synopsis = anime.sinopsis || anime.description || 'Sinopsis tidak tersedia.';
    
    container.innerHTML = `
        <button class="back-btn" onclick="goBack()">
            <i class="fas fa-arrow-left"></i> Kembali
        </button>
        <div class="detail-header">
            <div class="detail-image">
                ${cover ? 
                    `<img src="${cover}" alt="${title}" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'><i class=\\'fas fa-film\\'></i></div>'">` :
                    `<div class="no-image"><i class="fas fa-film"></i></div>`
                }
            </div>
            <div class="detail-info">
                <h1 class="detail-title">${title}</h1>
                <div class="detail-meta">
                    ${anime.status ? `<div class="detail-meta-item"><i class="fas fa-info-circle"></i> ${anime.status}</div>` : ''}
                    ${anime.type ? `<div class="detail-meta-item"><i class="fas fa-tv"></i> ${anime.type}</div>` : ''}
                    ${anime.score ? `<div class="detail-meta-item"><i class="fas fa-star"></i> ${anime.score}</div>` : ''}
                    ${anime.rilis || anime.release || anime.aired ? `<div class="detail-meta-item"><i class="fas fa-calendar"></i> ${anime.rilis || anime.release || anime.aired}</div>` : ''}
                    ${anime.studio ? `<div class="detail-meta-item"><i class="fas fa-film"></i> ${anime.studio}</div>` : ''}
                    ${anime.total_episode ? `<div class="detail-meta-item"><i class="fas fa-list"></i> ${anime.total_episode} Episode</div>` : ''}
                </div>
                <div class="detail-genres">
                    ${genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
                <p class="detail-synopsis">${synopsis}</p>
            </div>
        </div>
        <div class="detail-body">
            <h2 class="detail-section-title"><i class="fas fa-list-ol"></i> Daftar Episode</h2>
            <div class="episodes-grid">
                ${episodes.length > 0 ? episodes.map(ep => {
                    const epSlug = ep.slug || ep.url || ep.id;
                    const epTitle = ep.title || ep.judul || `Episode ${ep.episode || ep.number || ''}`;
                    const epNumber = ep.episode || ep.number || epTitle;
                    
                    return `
                        <button class="episode-btn" onclick="showStream('${epSlug}', '${anime.url || anime.slug || anime.id}', '${epNumber}')">
                            ${epTitle}
                        </button>
                    `;
                }).join('') : '<p>Episode belum tersedia</p>'}
            </div>
        </div>
    `;
}

function renderStream(streamData, series, currentEpisode) {
    const container = document.getElementById('streamContainer');
    
    if (!streamData) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Video tidak tersedia</h3>
                <p>Silakan coba episode lain</p>
            </div>
        `;
        return;
    }

    const streamUrl = streamData.url || streamData.stream || streamData.video || streamData.embed || streamData.link || '';
    const episodes = streamData.episodes || [];
    const title = streamData.title || streamData.judul || `Episode ${currentEpisode}`;
    const servers = streamData.servers || streamData.server || [];

    container.innerHTML = `
        <button class="back-btn" onclick="showAnimeDetail('${series}')">
            <i class="fas fa-arrow-left"></i> Kembali ke Detail
        </button>
        <div class="stream-video">
            ${streamUrl.includes('youtube') || streamUrl.includes('youtu.be') ? 
                `<iframe src="${streamUrl}" allowfullscreen></iframe>` :
                streamUrl.includes('.m3u8') || streamUrl.includes('.mp4') ?
                `<video controls autoplay><source src="${streamUrl}" type="video/mp4">Browser tidak mendukung video player</video>` :
                streamUrl ?
                `<iframe src="${streamUrl}" allowfullscreen></iframe>` :
                `<div class="no-image"><i class="fas fa-video-slash"></i><p>Video tidak tersedia</p></div>`
            }
        </div>
        <div class="stream-info">
            <h2 class="stream-title">${title}</h2>
            ${servers.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="margin-bottom: 10px;"><i class="fas fa-server"></i> Server:</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${servers.map(server => `
                            <button class="episode-btn" onclick="loadStream('${server.slug || server.url || server.link}', '${series}', '${currentEpisode}')">
                                ${server.name || server.server || server.label || 'Server'}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            ${episodes.length > 0 ? `
                <div class="stream-episodes">
                    <h3><i class="fas fa-list"></i> Episode Lainnya</h3>
                    <div class="stream-episodes-grid">
                        ${episodes.map(ep => {
                            const epSlug = ep.slug || ep.url || ep.id;
                            const epNumber = ep.episode || ep.number || ep.title || '';
                            
                            return `
                                <button class="stream-episode-btn ${String(epNumber) === String(currentEpisode) ? 'active' : ''}" 
                                    onclick="showStream('${epSlug}', '${series}', '${epNumber}')">
                                    ${epNumber}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderPagination(totalPages, currentPage, containerId, callbackName) {
    const container = document.getElementById(containerId);
    if (!totalPages || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let buttons = [];
    
    // Previous button
    buttons.push(`<button ${currentPage === 1 ? 'disabled' : ''} onclick="${callbackName}(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        buttons.push(`<button onclick="${callbackName}(1)">1</button>`);
        if (startPage > 2) {
            buttons.push(`<button disabled>...</button>`);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        buttons.push(`<button class="${i === currentPage ? 'active' : ''}" onclick="${callbackName}(${i})">${i}</button>`);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            buttons.push(`<button disabled>...</button>`);
        }
        buttons.push(`<button onclick="${callbackName}(${totalPages})">${totalPages}</button>`);
    }
    
    // Next button
    buttons.push(`<button ${currentPage === totalPages ? 'disabled' : ''} onclick="${callbackName}(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`);
    
    container.innerHTML = buttons.join('');
}

function showError(message) {
    const container = document.getElementById('contentArea');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Terjadi Kesalahan</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                <i class="fas fa-refresh"></i> Muat Ulang
            </button>
        </div>
    `;
}

function goBack() {
    if (currentSeries) {
        showAnimeDetail(currentSeries);
    } else {
        showHome();
    }
}

// Utility Functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}
