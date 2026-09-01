/* ============================================
   极简黑白作品集 · script.js
   作品数据 + 网格渲染 + Lightbox 交互
   ============================================ */

/**
 * 作品数据
 * ----------
 * 替换为你自己的素材：
 *   type: 'image' 或 'video'
 *   src:   原图 / 视频文件地址
 *   thumb: 网格缩略图（视频用 poster 封面图）
 *   title: 作品标题
 *   desc:  作品描述（Lightbox 中显示，可留空）
 *   span:  网格大小 'big' | 'mid' | 'small'（影响节奏，可省略）
 *
 * 本地素材示例：把图片放进 ./assets/，然后
 *   src: 'assets/my-photo.jpg'
 *   thumb: 'assets/my-photo-thumb.jpg'
 */
const WORKS = [
    // ---------- 模板 1：图片作品 ----------
    // 把 src / thumb 换成你的文件路径，如 'assets/photo1.jpg'
    // 不需要就删掉这一整块（包括结尾的逗号）
    {
        type: 'image',
        title: '作品标题',
        desc: '一句话描述，留空可写 ""',
        src: 'https://picsum.photos/seed/template-image/1600/1200',
        thumb: 'https://picsum.photos/seed/template-image/800/600'
        // span: 'big'  // 可选：'big' | 'mid' | 'small'，不加则按位置自动分配
    },

    // ---------- 模板 2：本地视频作品 ----------
    // thumb 是视频封面图（poster），可用播放器截图或一张相关图片
    {
        type: 'video',
        title: '作品标题',
        desc: '一句话描述，留空可写 ""',
        src: 'assets/my-video.mp4',
        thumb: 'assets/my-video-poster.jpg'
        // span: 'mid'
    },

    // ---------- 模板 3：B 站嵌入视频 ----------
    // 视频 > 100MB 时推荐用这种方式
    // src 填 B 站嵌入链接：在 B 站视频页 → 分享 → 复制「嵌入代码」
    //   <iframe src="//player.bilibili.com/player.php?bvid=BVxxxxxx&page=1" ...>
    // 把 //player... 这段 URL 复制到下面的 src（建议加 https: 前缀）
    {
        type: 'embed',
        title: 'B 站作品标题',
        desc: '一句话描述，留空可写 ""',
        src: 'https://player.bilibili.com/player.php?bvid=BV1xx411c7mD&page=1',
        thumb: 'https://picsum.photos/seed/bilibili-cover/800/600'
        // span: 'mid'
    }

    // ---------- 添加更多作品 ----------
    // 在上面复制任意一个模板，粘贴到这里之前（注意上一个对象结尾要有逗号）
];

/* ---------- 渲染作品网格 ---------- */
const grid = document.getElementById('worksGrid');
const filterBar = document.getElementById('filterBar');

// 当前筛选后保留的作品（在 WORKS 中的原始索引列表）
let currentList = [];
// Lightbox 在 currentList 中的当前位置
let currentIndex = 0;

function getFilteredList(filter) {
    return WORKS.map((w, i) => i)
        .filter((i) => filter === 'all' || WORKS[i].type === filter);
}

function renderWorks(filter = 'all') {
    currentList = getFilteredList(filter);
    grid.innerHTML = '';
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
            media = document.createElement('video');
            media.muted = true;
            media.loop = true;
            media.playsInline = true;
            media.preload = 'metadata';
            media.crossOrigin = 'anonymous';
            media.poster = w.thumb;
            const source = document.createElement('source');
            source.src = w.src;
            source.type = 'video/mp4';
            media.appendChild(source);
        } else if (w.type === 'embed') {
            // 嵌入式视频（B 站等）在网格里显示封面图，点击后打开 Lightbox 播放
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
    // 填充数量
    const counts = {
        all: WORKS.length,
        image: WORKS.filter((w) => w.type === 'image').length,
        video: WORKS.filter((w) => w.type === 'video').length
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
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups');
        iframe.setAttribute('referrer', 'no-referrer');
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
document.addEventListener('DOMContentLoaded', () => {
    renderWorks();
    setupReveal();
    setupFilter();
    setupVideoHover();
    setupNavbar();
    setupLightboxEvents();
});
