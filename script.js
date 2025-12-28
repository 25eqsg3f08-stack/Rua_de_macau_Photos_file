const CONFIG = {
    // 强制指定目标仓库 Pages 地址（核心前提）
    TARGET_REPO_URL: "https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/",
    ERROR_IMG: "https://picsum.photos/id/1005/800/500",
    MACAU_COORD: [22.1987, 113.5439],
    MAP_ZOOM: 15,
    PRINT_PAGE_URL: "https://25eqsg3f08-stack.github.io/macau-photo-gallery/print.html",
    // 支持的图片格式
    IMG_EXTENSIONS: ["jpg", "jpeg", "png", "webp"]
};

let photoList = [];
let currentIndex = 0;

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
    L.marker(CONFIG.MACAU_COORD).addTo(map).bindPopup("澳门内港 · 主要拍摄区域").openPopup();
}

// 核心：纯前端解析目标仓库目录页面，提取所有图片（无后端）
async function parseRepoPhotos() {
    el.loading.textContent = "正在读取仓库图片列表...";
    try {
        // 1. 使用公共 CORS 代理请求目录页面（纯前端跨域唯一方案，无后端依赖）
        const corsProxy = "https://api.allorigins.win/get?url=";
        const targetUrl = corsProxy + encodeURIComponent(CONFIG.TARGET_REPO_URL);
        
        const res = await fetch(targetUrl);
        if (!res.ok) throw new Error("请求仓库目录失败");
        
        const data = await res.json();
        const dirHtml = data.contents; // 获取目录页面的 HTML 源码

        // 2. 正则提取所有图片链接（匹配目标仓库下的图片文件）
        const imgRegex = new RegExp(`href="([^"]+\\.(${CONFIG.IMG_EXTENSIONS.join("|")}))"`, "gi");
        const imgPaths = new Set();
        let match;

        while ((match = imgRegex.exec(dirHtml)) !== null) {
            const imgPath = match[1];
            // 拼接完整图片 URL（确保是目标仓库的地址）
            const fullImgUrl = new URL(imgPath, CONFIG.TARGET_REPO_URL).href;
            imgPaths.add(fullImgUrl);
        }

        // 3. 转换为数组并验证有效性
        photoList = Array.from(imgPaths);
        if (photoList.length === 0) throw new Error("仓库中未找到图片文件");

        updatePagination();
        loadCurrentPhoto();
    } catch (err) {
        console.error("解析失败:", err);
        el.loading.textContent = "读取失败，请检查仓库 Pages 配置";
        el.error.classList.remove("hidden");
    }
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
        el.photo.src = CONFIG.ERROR_IMG;
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
    parseRepoPhotos(); // 强制读取目标仓库
    bindEvents();
}

window.addEventListener("DOMContentLoaded", initApp);