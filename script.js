// 固定仓库信息
const REPO_INFO = {
    owner: "25eqsg3f08-stack",
    name: "Rua_de_macau_Photos",
    branch: "main"
};

// 配置项
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const SCAN_RANGE = [1, 50];
const RAW_PREFIX = `https://raw.githubusercontent.com/${REPO_INFO.owner}/${REPO_INFO.name}/${REPO_INFO.branch}/`;
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

// 验证图片是否存在
async function checkImageExists(url) {
    try {
        const response = await fetch(url, { method: "HEAD", cache: "no-cache" });
        return response.ok;
    } catch {
        return false;
    }
}

// 更新图片展示
function updatePhotoDisplay() {
    if (photoList.length === 0) return;
    const currentUrl = photoList[currentIndex];
    el.currentPhoto.src = currentUrl;
    el.currentPhoto.style.display = "block";
    el.photoInfo.textContent = `${currentIndex + 1} / ${photoList.length}`;
    // 更新按钮状态
    el.prevBtn.disabled = currentIndex === 0;
    el.nextBtn.disabled = currentIndex === photoList.length - 1;
    el.printBtn.disabled = false;
    el.mailBtn.disabled = false;
}

// 加载图片核心函数
async function loadPhotos() {
    const allPossibleUrls = [];
    // 生成所有可能的 URL
    for (let i = SCAN_RANGE[0]; i <= SCAN_RANGE[1]; i++) {
        const formats = [i, String(i).padStart(3, "0")];
        formats.forEach(format => {
            IMAGE_EXTS.forEach(ext => {
                allPossibleUrls.push(`${RAW_PREFIX}${format}${ext}`);
            });
        });
    }
    // 并行验证
    const promises = allPossibleUrls.map(async url => await checkImageExists(url) ? url : null);
    const results = await Promise.all(promises);
    photoList = results.filter(url => url !== null);
    // 渲染结果
    if (photoList.length === 0) {
        el.error.textContent = "未找到有效图片，请检查仓库或扩大扫描范围";
        el.error.style.display = "block";
        el.loading.textContent = "加载完成";
        return;
    }
    el.loading.textContent = `共加载 ${photoList.length} 张图片`;
    updatePhotoDisplay();
}

// 绑定事件
function bindEvents() {
    // 上一个/下一个
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
    // 打印
    el.printBtn.addEventListener("click", () => {
        window.open(PRINT_URL, "_blank").print();
    });
    // 邮件弹窗
    el.mailBtn.addEventListener("click", () => {
        el.mailModal.style.display = "flex";
        // 填充默认标题
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