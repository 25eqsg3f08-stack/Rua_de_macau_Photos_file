// 直接使用 GitHub 仓库地址
const REPO_URL = "https://github.com/25eqsg3f08-stack/Rua_de_macau_Photos";
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// 全局状态
let photoList = [];
let currentIndex = 0;

// DOM 元素获取（带存在性校验）
function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`DOM元素#${id}未找到，请检查HTML中的ID`);
    return el;
}

// 初始化DOM元素引用
const el = {
    loading: getEl("loading"),
    error: getEl("error"),
    currentPhoto: getEl("current-photo"),
    photoInfo: getEl("photo-info"),
    prevBtn: getEl("prev-btn"),
    nextBtn: getEl("next-btn"),
    printBtn: getEl("print-btn"),
    mailBtn: getEl("mail-btn")
};

// 解析仓库图片
async function parseRepoImages() {
    if (!el.loading) return;
    el.loading.textContent = "正在解析仓库图片...";
    try {
        // 调用GitHub Contents API
        const apiUrl = `${REPO_URL.replace("github.com", "api.github.com/repos")}/contents/`;
        const response = await fetch(apiUrl, {
            headers: { "Accept": "application/vnd.github.v3+json" },
            cache: "no-cache"
        });

        if (!response.ok) throw new Error(`仓库请求失败 [${response.status}]`);
        const contents = await response.json();

        // 筛选图片文件
        const imageFiles = contents.filter(item => {
            if (item.type !== "file") return false;
            const ext = item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
            return IMAGE_EXTS.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        // 生成GitHub仓库可访问的图片地址
        photoList = imageFiles.map(file => {
            return `${REPO_URL}/raw/main/${file.name}`;
        });

        return photoList;
    } catch (err) {
        console.error("解析失败:", err);
        throw err;
    }
}

// 更新图片展示
function updatePhotoDisplay() {
    if (photoList.length === 0 || !el.currentPhoto || !el.photoInfo) return;
    
    const currentUrl = photoList[currentIndex];
    el.currentPhoto.style.display = "none";
    el.currentPhoto.onload = function() {
        el.currentPhoto.style.display = "block";
    };
    el.currentPhoto.onerror = function() {
        el.currentPhoto.src = "https://via.placeholder.com/400x300?text=图片加载失败";
        el.currentPhoto.style.display = "block";
    };
    el.currentPhoto.src = currentUrl;
    el.photoInfo.textContent = `${currentIndex + 1} / ${photoList.length}`;
    
    if (el.prevBtn) el.prevBtn.disabled = currentIndex === 0;
    if (el.nextBtn) el.nextBtn.disabled = currentIndex === photoList.length - 1;
    if (el.printBtn) el.printBtn.disabled = false;
    if (el.mailBtn) el.mailBtn.disabled = false;
}

// 加载图片
async function loadPhotos() {
    try {
        await parseRepoImages();
        if (el.loading) el.loading.textContent = `共加载 ${photoList.length} 张图片`;
        updatePhotoDisplay();
    } catch (err) {
        if (el.error) {
            el.error.textContent = `加载失败：${err.message}`;
            el.error.style.display = "block";
        }
        if (el.loading) el.loading.textContent = "图片加载失败";
    }
}

// 绑定事件
function bindEvents() {
    if (el.prevBtn) {
        el.prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                updatePhotoDisplay();
            }
        });
    }

    if (el.nextBtn) {
        el.nextBtn.addEventListener("click", () => {
            if (currentIndex < photoList.length - 1) {
                currentIndex++;
                updatePhotoDisplay();
            }
        });
    }

    // 打印和邮件分享按钮仅保留UI，实际逻辑需通过index.html的href跳转
    if (el.printBtn) {
        el.printBtn.addEventListener("click", () => {
            alert("打印功能请通过页面链接跳转");
        });
    }

    if (el.mailBtn) {
        el.mailBtn.addEventListener("click", () => {
            alert("邮件分享功能请通过页面链接跳转");
        });
    }
}

// 页面加载完成后执行
window.addEventListener("DOMContentLoaded", () => {
    loadPhotos();
    bindEvents();
});