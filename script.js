// 固定仓库信息
const REPO_INFO = {
    owner: "25eqsg3f08-stack",
    name: "Rua_de_macau_Photos",
    branch: "main" // 若仓库是 master 分支，改为 master
};

// 配置项
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const RAW_PREFIX = `https://raw.githubusercontent.com/${REPO_INFO.owner}/${REPO_INFO.name}/${REPO_INFO.branch}/`;
const PAGES_URL = `https://${REPO_INFO.owner}.github.io/${REPO_INFO.name}/`; // 仓库 Pages 地址
const PRINT_URL = "https://25eqsg3f08-stack.github.io/macau-photo-gallery/";

// DOM 元素
const el = {
    loading: document.querySelector(".loading"),
    error: document.getElementById("error"),
    currentPhoto: document.getElementById("current-photo"),
    photoInfo: document.getElementById("photo-info"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    printBtn: document.getElementById("print-btn"),
    mailBtn: document.getElementById("mail-btn"),
    mailModal: document.getElementById("mail-modal"),
    mailCancel: document.getElementById("mail-cancel"),
    mailSend: document.getElementById("mail-send"),
    mailTitle: document.getElementById("mail-title"),
    mailFrom: document.getElementById("mail-from"),
    mailTo: document.getElementById("mail-to"),
    mailContent: document.getElementById("mail-content")
};

// 全局状态
let photoList = [];
let currentIndex = 0;

// 核心：自动解析仓库 Pages 目录，提取实际图片名（无手动干预）
async function parseRepoImageNames() {
    try {
        // 请求仓库 Pages 目录页面
        const response = await fetch(PAGES_URL, { cache: "no-cache" });
        if (!response.ok) throw new Error("无法访问仓库目录页面");
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // 提取页面中所有链接，筛选图片文件
        const links = doc.querySelectorAll("a");
        const imageNames = [];
        
        links.forEach(link => {
            const href = link.getAttribute("href") || "";
            // 只保留文件（排除目录），且后缀匹配图片格式
            if (!href.endsWith("/")) {
                const ext = href.slice(href.lastIndexOf(".")).toLowerCase();
                if (IMAGE_EXTS.includes(ext)) {
                    imageNames.push(href);
                }
            }
        });
        
        if (imageNames.length === 0) throw new Error("目录中未找到图片文件");
        return imageNames;
    } catch (err) {
        console.error("解析失败:", err);
        throw err;
    }
}

// 验证图片是否可访问（兜底）
async function verifyImageUrls(imageNames) {
    const validUrls = [];
    for (const name of imageNames) {
        const url = `${RAW_PREFIX}${name}`;
        try {
            const res = await fetch(url, { method: "HEAD", cache: "no-cache" });
            if (res.ok) validUrls.push(url);
        } catch {
            continue;
        }
    }
    return validUrls;
}

// 更新图片展示
function updatePhotoDisplay() {
    if (photoList.length === 0) return;
    const currentUrl = photoList[currentIndex];
    el.currentPhoto.src = currentUrl;
    el.currentPhoto.style.display = "block";
    el.photoInfo.textContent = `${currentIndex + 1} / ${photoList.length}`;
    el.prevBtn.disabled = currentIndex === 0;
    el.nextBtn.disabled = currentIndex === photoList.length - 1;
    el.printBtn.disabled = false;
    el.mailBtn.disabled = false;
}

// 加载图片核心函数（完全自动，无手动干预）
async function loadPhotos() {
    el.loading.textContent = "正在解析仓库图片...";
    try {
        // 1. 自动提取仓库实际图片名
        const imageNames = await parseRepoImageNames();
        // 2. 验证图片可访问性
        photoList = await verifyImageUrls(imageNames);
        
        if (photoList.length === 0) throw new Error("所有图片均无法访问");
        
        el.loading.textContent = `共加载 ${photoList.length} 张图片`;
        updatePhotoDisplay();
    } catch (err) {
        el.error.textContent = `加载失败：${err.message}（请确认仓库 Pages 已开启且有图片）`;
        el.error.style.display = "block";
        el.loading.textContent = "加载完成";
    }
}

// 绑定事件（保持不变）
function bindEvents() {
    el.prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            updatePhotoDisplay();
        }
    });
    el.nextBtn.addEventListener("click", () => {
        if (currentIndex < photoList.length - 1) {
            currentIndex++;
            updatePhotoDisplay();
        }
    });
    el.printBtn.addEventListener("click", () => {
        window.open(PRINT_URL, "_blank").print();
    });
    el.mailBtn.addEventListener("click", () => {
        el.mailModal.style.display = "flex";
        el.mailTitle.value = `澳门内港照片 ${currentIndex + 1}`;
    });
    el.mailCancel.addEventListener("click", () => {
        el.mailModal.style.display = "none";
    });
    el.mailSend.addEventListener("click", () => {
        const mailto = `mailto:${el.mailTo.value}?subject=${encodeURIComponent(el.mailTitle.value)}&from=${encodeURIComponent(el.mailFrom.value)}&body=${encodeURIComponent(el.mailContent.value + "\n\n图片链接：" + photoList[currentIndex])}`;
        window.location.href = mailto;
        el.mailModal.style.display = "none";
    });
}

// 页面加载执行
window.addEventListener("DOMContentLoaded", () => {
    loadPhotos();
    bindEvents();
});
