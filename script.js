/* ============================================
   极简黑白作品集 · script.js
   作品数据 + 网格渲染 + Lightbox 交互
   ============================================ */

const WORKS_JSON_URL = 'https://leezsworks-1479415940.cos.ap-guangzhou.myqcloud.com/assets/works.json';
let WORKS = [];

async function loadWorks() {
    try {
        const res = await fetch(WORKS_JSON_URL);
        if (!res.ok) throw new Error('Failed to load works.json');
        WORKS = await res.json();
    } catch (err) {
        console.error('加载作品数据失败:', err);
        WORKS = [];
    }
}

/* ---------- 渲染作品网格 ---------- */
const grid = document.getElementById('worksGrid');
const filterBar = document.getElementById('filterBar');

// 当前筛选后保留的作品（在 WORKS 中的原始索引列表）
let currentList = [];
// Lightbox 在 currentList 中的当前位置
let currentIndex = 0;

function getFilteredList(filter) {
    return WORKS.map((w, i) => i)
        .filter((i) => {
            if (filter === 'all') return true;
            if (filter === 'video') return WORKS[i].type === 'video' || WORKS[i].type === 'embed';
            return WORKS[i].type === filter;
        });
}

function renderWorks(filter = 'all') {
    currentList = getFilteredList(filter);
    grid.innerHTML = '';

    // 空状态
    if (currentList.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'works-empty';
        empty.innerHTML = `
            <i class="fas fa-image"></i>
            <p>作品准备中</p>
            <span>在 script.js 的 WORKS 数组里添加你的作品</span>
        `;
        grid.appendChild(empty);
        return;
    }

    const frag = document.createDocumentFragment();
    currentList.forEach((origIdx, pos) => {
        const w = WORKS[origIdx];
        const card = document.createElement('article');
        card.className = 'work-card';
        card.dataset.pos = pos;
        card.dataset.index = origIdx;

        // 媒体元素
        let media;
        if (w.type === 'video') {
            // 本地视频：网格里显示封面 poster，不自动播放
            media = document.createElement('img');
            media.src = w.thumb;
            media.alt = w.title;
            media.loading = 'lazy';
        } else if (w.type === 'embed') {
            media = document.createElement('img');
            media.src = w.thumb;
            media.alt = w.title;
            media.loading = 'lazy';
        } else {
            media = document.createElement('img');
            media.src = w.thumb;
            media.alt = w.title;
            media.loading = 'lazy';
        }
        media.className = 'work-media';

        // 类型徽标
        const badge = document.createElement('div');
        badge.className = 'work-badge';
        const isVideo = w.type === 'video' || w.type === 'embed';
        badge.innerHTML = isVideo
            ? '<i class="fas fa-play"></i>'
            : '<i class="fas fa-expand"></i>';

        // 文字信息
        const meta = document.createElement('div');
        meta.className = 'work-meta';
        const typeLabel = w.type === 'video' ? 'Video' : w.type === 'embed' ? 'Embed' : 'Photo';
        meta.innerHTML = `
            <span class="work-type">${typeLabel}</span>
            <h3 class="work-title">${w.title}</h3>
        `;

        card.appendChild(media);
        card.appendChild(badge);
        card.appendChild(meta);
        card.addEventListener('click', () => openLightbox(pos));

        frag.appendChild(card);
    });
    grid.appendChild(frag);
    observeCards();
}

/* ---------- 筛选 ---------- */
function setupFilter() {
    // 填充数量（embed 也算视频）
    const counts = {
        all: WORKS.length,
        image: WORKS.filter((w) => w.type === 'image').length,
        video: WORKS.filter((w) => w.type === 'video' || w.type === 'embed').length
    };
    filterBar.querySelectorAll('.filter-btn').forEach((btn) => {
        const f = btn.dataset.filter;
        const c = btn.querySelector('.count');
        if (c) c.textContent = `(${counts[f]})`;
    });

    filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        const filter = btn.dataset.filter;
        if (btn.classList.contains('is-active')) return;

        filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        renderWorks(filter);
        // 立即让新卡片可见（如果已在视口内，observeCards 会触发；这里补一道保险）
        requestAnimationFrame(() => {
            document.querySelectorAll('.work-card').forEach((c) => {
                const r = c.getBoundingClientRect();
                if (r.top < window.innerHeight && r.bottom > 0) {
                    c.classList.add('is-visible');
                }
            });
        });
    });
}

/* ---------- 滚动渐入 ---------- */
const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const pos = parseInt(entry.target.dataset.pos, 10) || 0;
            const delay = (pos % 4) * 80;
            setTimeout(() => entry.target.classList.add('is-visible'), delay);
            revealIO.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

function observeCards() {
    document.querySelectorAll('.work-card').forEach((c) => revealIO.observe(c));
}

function setupReveal() {
    observeCards();
}

/* ---------- 视频悬停播放 ---------- */
function setupVideoHover() {
    grid.addEventListener('mouseover', (e) => {
        const v = e.target.closest('video');
        if (v) {
            const p = v.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
        }
    });
    grid.addEventListener('mouseout', (e) => {
        const v = e.target.closest('video');
        if (v) {
            v.pause();
        }
    });
}

/* ---------- 导航栏滚动样式 ---------- */
function setupNavbar() {
    const nav = document.getElementById('navbar');
    const onScroll = () => {
        if (window.scrollY > 40) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById('lightbox');
const stage = document.getElementById('lightboxStage');
const caption = document.getElementById('lightboxCaption');

function openLightbox(pos) {
    currentIndex = pos;
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // 暂停视频
    const v = stage.querySelector('video');
    if (v) v.pause();
    setTimeout(() => { stage.innerHTML = ''; caption.innerHTML = ''; }, 400);
}

function renderLightbox() {
    const w = WORKS[currentList[currentIndex]];
    stage.innerHTML = '';

    let el;
    if (w.type === 'video') {
        el = document.createElement('video');
        el.src = w.src;
        el.controls = true;
        el.autoplay = true;
        el.loop = true;
        el.playsInline = true;
    } else if (w.type === 'embed') {
        // B 站等嵌入视频：用 iframe 加载，固定 16:9 比例
        el = document.createElement('div');
        el.className = 'lightbox-embed';
        const iframe = document.createElement('iframe');
        iframe.src = w.src;
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
        iframe.setAttribute('referrerPolicy', 'no-referrer');
        // 注意：不要加 sandbox，B 站播放器需要完整权限才能正常加载和播放
        el.appendChild(iframe);
    } else {
        el = document.createElement('img');
        el.src = w.src;
        el.alt = w.title || '';
    }
    stage.appendChild(el);

    caption.innerHTML = `
        <div class="cap-title">${w.title || ''}</div>
        ${w.desc ? `<div class="cap-desc">${w.desc}</div>` : ''}
    `;
}

function navigate(dir) {
    const n = currentList.length;
    if (n <= 1) return;
    currentIndex = (currentIndex + dir + n) % n;
    renderLightbox();
}

/* ---------- 事件绑定 ---------- */
function setupLightboxEvents() {
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxBackdrop').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', () => navigate(-1));
    document.getElementById('lightboxNext').addEventListener('click', () => navigate(1));

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('is-open')) return;
        switch (e.key) {
            case 'Escape':  closeLightbox(); break;
            case 'ArrowLeft':  navigate(-1); break;
            case 'ArrowRight': navigate(1);  break;
        }
    });

    // 触摸滑动
    let touchX = 0;
    stage.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 60) navigate(dx > 0 ? -1 : 1);
    }, { passive: true });
}

/* ---------- 初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
    await loadWorks();
    renderWorks();
    setupReveal();
    setupFilter();
    setupVideoHover();
    setupNavbar();
    setupLightboxEvents();
});
