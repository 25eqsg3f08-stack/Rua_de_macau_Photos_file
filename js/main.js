// 全局变量
let photoUrls = []; // 存储所有照片URL
let currentPage = 1; // 当前页码
const githubRepo = "https://github.com/25eqsg3f08-stack/Rua_de_macau_Photos"; // GitHub图片基础路径

// DOM元素
const currentPhotoEl = document.getElementById('current-photo');
const loadingEl = document.getElementById('photo-loading');
const errorEl = document.getElementById('photo-error');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageInfoEl = document.getElementById('page-info');
const printBtn = document.getElementById('print-btn');
const mapEl = document.getElementById('map');

// 初始化地图（Leaflet）
function initMap() {
    // 澳门内港中心点坐标
    const macauCenter = [22.1987, 113.5439];
    const map = L.map(mapEl).setView(macauCenter, 15);

    // 加载OpenStreetMap瓦片图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 添加内港区域标记
    L.marker(macauCenter).addTo(map)
        .bindPopup('澳门内港 - 主要拍摄区域')
        .openPopup();
}

// 读取GitHub仓库图片（需提前知道图片命名规则，这里假设是photo1.jpg、photo2.jpg...）
// 实际项目中可通过GitHub API获取文件列表，此处简化为预设数量+自动检测
async function loadPhotoUrls() {
    const maxPhotos = 50; // 最大检测数量
    const tempUrls = [];

    // 循环检测图片是否存在
    for (let i = 1; i <= maxPhotos; i++) {
        const photoUrl = `${githubRepo}photo${i}.jpg`; // 假设图片命名格式
        try {
            // 检测图片是否可访问
            const response = await fetch(photoUrl, { method: 'HEAD' });
            if (response.ok) {
                tempUrls.push(photoUrl);
            } else {
                break; // 无更多图片时停止
            }
        } catch (error) {
            console.log(`图片${i}加载失败：`, error);
            break;
        }
    }

    photoUrls = tempUrls;
    updatePagination();
    loadCurrentPhoto();
}

// 加载当前页图片
function loadCurrentPhoto() {
    if (photoUrls.length === 0) {
        loadingEl.textContent = "暂无照片数据";
        return;
    }

    const photoUrl = photoUrls[currentPage - 1];
    loadingEl.style.display = "block";
    currentPhotoEl.style.display = "none";
    errorEl.style.display = "none";

    // 预加载图片
    const img = new Image();
    img.src = photoUrl;
    img.onload = () => {
        currentPhotoEl.src = photoUrl;
        currentPhotoEl.style.display = "block";
        loadingEl.style.display = "none";
    };
    img.onerror = () => {
        errorEl.style.display = "block";
        loadingEl.style.display = "none";
    };
}

// 更新分页控件
function updatePagination() {
    const totalPages = photoUrls.length;
    pageInfoEl.textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;

    // 控制按钮状态
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// 绑定事件
function bindEvents() {
    // 上一页
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadCurrentPhoto();
            updatePagination();
        }
    });

    // 下一页
    nextBtn.addEventListener('click', () => {
        if (currentPage < photoUrls.length) {
            currentPage++;
            loadCurrentPhoto();
            updatePagination();
        }
    });

    // 打印功能（跳转至print.html，需自行创建打印页面）
    printBtn.addEventListener('click', () => {
        if (photoUrls.length === 0) return;
        const currentPhotoUrl = photoUrls[currentPage - 1];
        // 跳转到打印页面并传递当前图片URL
        window.open(`print.html?photo=${encodeURIComponent(currentPhotoUrl)}`, '_blank');
    });
}

// 初始化应用
function initApp() {
    initMap();
    loadPhotoUrls();
    bindEvents();
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initApp);