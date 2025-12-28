// 配置项
const CONFIG = {
    // GitHub Pages 托管的仓库图片根路径（关键：同源无跨域）
    // 格式：https://<用户名>.github.io/<仓库名>/
    REPO_PAGES_URL: "https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/",
    ERROR_IMG: "images/error.png",
    FALLBACK_ERROR_IMG: "https://picsum.photos/id/1005/800/500",
    MACAU_COORD: [22.1987, 113.5439],
    MAP_ZOOM: 15,
    PRINT_PAGE_URL: "https://25eqsg3f08-stack.github.io/macau-photo-gallery/print.html",
    // 支持的图片格式
    IMG_EXTENSIONS: ["jpg", "png", "jpeg", "webp"]
};

// 全局变量
let photoList = [];
let currentIndex = 0;

// DOM元素
const el = {
    photo: document.getElementById("current-photo"),
    loading: document.getElementById("loading"),
    error: document.getElementById("error"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    pageInfo: document.getElementById("page-info"),
    printBtn: document.getElementById("print-btn"),
    map: document.getElementById("map"),
    loadTime: document.getElementById("load-time")
};

// 初始化地图
function initMap() {
    const map = L.map(el.map).setView(CONFIG.MACAU_COORD, CONFIG.MAP_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker(CONFIG.MACAU_COORD).addTo(map)
        .bindPopup("澳门内港 · 主要拍摄区域").openPopup();
}

// 核心：通过预生成常见命名规则 + 可用性检测，自动获取图片列表
async function autoDetectPhotos() {
    el.loading.textContent = "正在自动检测仓库图片...";
    photoList = [];
    // 规则1：匹配 img-YYYYMMDD-XXX 格式（仓库常用命名）
    const datePrefixes = ["20251201", "20251202", "20251203", "20251204", "20251205"];
    const serials = ["001", "002", "003", "004", "005"];

    // 批量生成可能的图片路径并检测可用性
    const allPossibleUrls = [];
    for (const date of datePrefixes) {
        for (const s of serials) {
            for (const ext of CONFIG.IMG_EXTENSIONS) {
                allPossibleUrls.push(`${CONFIG.REPO_PAGES_URL}img-${date}-${s}.${ext}`);
            }
        }
    }

    // 并行检测图片是否存在
    const detectPromises = allPossibleUrls.map(async (url) => {
        try {
            const res = await fetch(url, { method: "HEAD" });
            return res.ok ? url : null;
        } catch {
            return null;
        }
    });

    // 过滤有效图片URL
    const results = await Promise.all(detectPromises);
    photoList = results.filter(url => url !== null);

    if (photoList.length === 0) {
        // 规则2：匹配简单命名（如 photo1.jpg, pic.png 等）
        const simpleNames = ["photo1", "photo2", "photo3", "pic1", "pic2", "macau1", "macau2"];
        const simpleUrls = [];
        for (const name of simpleNames) {
            for (const ext of CONFIG.IMG_EXTENSIONS) {
                simpleUrls.push(`${CONFIG.REPO_PAGES_URL}${name}.${ext}`);
            }
        }
        const simpleResults = await Promise.all(simpleUrls.map(async (url) => {
            try {
                const res = await fetch(url, { method: "HEAD" });
                return res.ok ? url : null;
            } catch {
                return null;
            }
        }));
        photoList = simpleResults.filter(url => url !== null);
    }

    if (photoList.length === 0) {
        throw new Error("未检测到任何有效图片");
    }

    updatePagination();
    loadCurrentPhoto();
}

// 加载当前图片
function loadCurrentPhoto() {
    if (photoList.length === 0) return;

    const imgUrl = photoList[currentIndex];
    el.loading.style.display = "block";
    el.photo.style.display = "none";
    el.error.classList.add("hidden");
    el.loadTime.classList.add("hidden");
    
    const loadStartTime = Date.now();
    const img = new Image();
    img.src = imgUrl;
    
    img.onload = () => {
        const duration = Date.now() - loadStartTime;
        el.photo.src = imgUrl;
        el.photo.style.display = "block";
        el.loading.style.display = "none";
        el.loadTime.textContent = `加载耗时 ${duration} ms`;
        el.loadTime.classList.remove("hidden");
    };
    
    img.onerror = () => {
        const duration = Date.now() - loadStartTime;
        el.loading.style.display = "none";
        el.error.classList.remove("hidden");
        el.loadTime.textContent = `加载失败（耗时 ${duration} ms）`;
        el.loadTime.classList.remove("hidden");
        el.photo.src = CONFIG.ERROR_IMG || CONFIG.FALLBACK_ERROR_IMG;
        el.photo.style.display = "block";
    };
}

// 更新分页
function updatePagination() {
    const total = photoList.length;
    el.pageInfo.textContent = `第 ${currentIndex + 1} 页 / 共 ${total} 页`;
    el.prevBtn.disabled = currentIndex === 0;
    el.nextBtn.disabled = currentIndex === total - 1;
}

// 绑定事件
function bindEvents() {
    el.prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            loadCurrentPhoto();
            updatePagination();
        }
    });

    el.nextBtn.addEventListener("click", () => {
        if (currentIndex < photoList.length - 1) {
            currentIndex++;
            loadCurrentPhoto();
            updatePagination();
        }
    });

    el.printBtn.addEventListener("click", () => {
        if (photoList.length === 0) return;
        const imgUrl = encodeURIComponent(photoList[currentIndex]);
        window.open(`${CONFIG.PRINT_PAGE_URL}?img=${imgUrl}`, "_blank");
    });
}

// 初始化应用
function initApp() {
    initMap();
    autoDetectPhotos().catch(err => {
        console.error(err);
        el.loading.textContent = "无法获取仓库图片，请确认仓库已开启GitHub Pages";
        el.error.classList.remove("hidden");
    });
    bindEvents();
}

window.addEventListener("DOMContentLoaded", initApp);
