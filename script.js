// 配置项
const CONFIG = {
    GITHUB_REPO_API: "https://api.github.com/repos/25eqsg3f08-stack/Rua_de_macau_Photos/contents/",
    RAW_BASE_URL: "https://raw.githubusercontent.com/25eqsg3f08-stack/Rua_de_macau_Photos/main/",
    ERROR_IMG: "images/error.png", // 本地错误图
    FALLBACK_ERROR_IMG: "https://picsum.photos/id/1005/800/500", // CDN兜底
    MACAU_COORD: [22.1987, 113.5439], // 澳门内港坐标
    MAP_ZOOM: 15,
    // 新增：GitHub Pages 打印页地址
    PRINT_PAGE_URL: "https://25eqsg3f08-stack.github.io/macau-photo-gallery/print.html"
};

// 全局变量
let photoList = []; // 图片URL列表
let currentIndex = 0; // 当前图片索引

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
    loadTime: document.getElementById("load-time") // 加载时间标签
};

// 初始化地图
function initMap() {
    const map = L.map(el.map).setView(CONFIG.MACAU_COORD, CONFIG.MAP_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker(CONFIG.MACAU_COORD).addTo(map)
        .bindPopup("澳门内港 · 主要拍摄区域")
        .openPopup();
}

// 从GitHub API获取图片列表
async function fetchPhotoList() {
    try {
        const res = await fetch(CONFIG.GITHUB_REPO_API);
        if (!res.ok) throw new Error("API请求失败");
        const data = await res.json();
        
        // 筛选图片文件（支持 jpg/png/jpeg/webp）
        photoList = data.filter(item => {
            const ext = item.name.split(".").pop().toLowerCase();
            return ["jpg", "png", "jpeg", "webp"].includes(ext);
        }).map(item => CONFIG.RAW_BASE_URL + item.name);

        updatePagination();
        loadCurrentPhoto();
    } catch (err) {
        console.error("获取图片列表失败:", err);
        el.loading.textContent = "无法连接GitHub，建议切换本地图片模式";
        // 本地调试时可手动添加图片URL
        // photoList = ["images/photo1.jpg", "images/photo2.jpg"];
    }
}

// 加载当前图片
function loadCurrentPhoto() {
    if (photoList.length === 0) return;

    const imgUrl = photoList[currentIndex];
    el.loading.style.display = "block";
    el.photo.style.display = "none";
    el.error.classList.add("hidden");
    el.loadTime.classList.add("hidden"); // 隐藏上一次的耗时
    
    const loadStartTime = Date.now(); // 记录加载开始时间

    const img = new Image();
    img.src = imgUrl;
    
    img.onload = () => {
        const loadDuration = Date.now() - loadStartTime; // 计算耗时（ms）
        el.photo.src = imgUrl;
        el.photo.style.display = "block";
        el.loading.style.display = "none";
        // 显示加载耗时
        el.loadTime.textContent = `加载耗时 ${loadDuration} ms`;
        el.loadTime.classList.remove("hidden");
    };

    img.onerror = () => {
        el.loading.style.display = "none";
        el.error.classList.remove("hidden");
        // 加载失败也显示耗时（标记失败）
        const loadDuration = Date.now() - loadStartTime;
        el.loadTime.textContent = `加载失败（耗时 ${loadDuration} ms）`;
        el.loadTime.classList.remove("hidden");
        // 加载错误图
        el.photo.src = CONFIG.ERROR_IMG;
        el.photo.onerror = () => {
            el.photo.src = CONFIG.FALLBACK_ERROR_IMG;
        };
        el.photo.style.display = "block";
    };
}

// 更新分页状态
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

    // 核心修改：打印按钮跳转到 GitHub Pages 地址，传递当前图片URL
    el.printBtn.addEventListener("click", () => {
        if (photoList.length === 0) return;
        const currentImgUrl = encodeURIComponent(photoList[currentIndex]);
        const targetUrl = `${CONFIG.PRINT_PAGE_URL}?img=${currentImgUrl}`;
        window.open(targetUrl, "_blank");
    });
}

// 初始化应用
function initApp() {
    initMap();
    fetchPhotoList();
    bindEvents();
}

// 页面加载后执行
window.addEventListener("DOMContentLoaded", initApp);