// 仓库基础配置（使用Raw地址根路径）
const RAW_BASE_URL = "https://raw.githubusercontent.com/25eqsg3f08-stack/Rua_de_macau_Photos/main/";
const REPO_URL = "https://github.com/25eqsg3f08-stack/Rua_de_macau_Photos";
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// 全局状态
let photoList = [];
let currentIndex = 0;

// DOM 元素获取（带存在性校验，未找到返回null）
function getEl(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`DOM元素#${id}未找到，请检查HTML中的ID`);
        return null; // 未找到时返回null，避免后续操作报错
    }
    return el;
}

// 初始化DOM元素引用（仅保留必要元素）
const el = {
    loading: getEl("loading"),
    error: getEl("error"),
    currentPhoto: getEl("current-photo"),
    photoInfo: getEl("photo-info"),
    prevBtn: getEl("prev-btn"),
    nextBtn: getEl("next-btn")
};

// 解析仓库图片并生成Raw地址
async function parseRepoImages() {
    if (!el.loading) return;
    el.loading.textContent = "正在解析仓库图片...";
    try {
        const apiUrl = `${REPO_URL.replace("github.com", "api.github.com/repos")}/contents/`;
        const response = await fetch(apiUrl, {
            headers: { "Accept": "application/vnd.github.v3+json" },
            cache: "no-cache"
        });

        if (!response.ok) throw new Error(`仓库请求失败 [${response.status}]`);
        const contents = await response.json();

        const imageFiles = contents.filter(item => {
            if (item.type !== "file") return false;
            const ext = item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
            return IMAGE_EXTS.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        photoList = imageFiles.map(file => {
            const cleanFileName = file.name.trim().replace(/\s+/g, "");
            return RAW_BASE_URL + cleanFileName;
        });

        el.loading.textContent = `共加载 ${photoList.length} 张图片`;
        return photoList;

    } catch (err) {
        console.error("解析失败:", err);
        throw err;
    }
}

// 更新图片展示（添加多层判空，避免赋值undefined）
function updatePhotoDisplay() {
    // 先判空核心元素
    if (photoList.length === 0 || !el.currentPhoto || !el.photoInfo) return;
    
    const currentUrl = photoList[currentIndex];
    el.currentPhoto.src = "";
    el.currentPhoto.style.display = "none";
    el.currentPhoto.alt = `澳门内港照片 ${currentIndex + 1}`;

    el.currentPhoto.onload = function() {
        el.currentPhoto.style.display = "block";
    };

    el.currentPhoto.onerror = function() {
        el.currentPhoto.src = `https://picsum.photos/600/400?random=${currentIndex}`;
        el.currentPhoto.style.display = "block";
    };

    el.currentPhoto.src = currentUrl;
    el.photoInfo.textContent = `${currentIndex + 1} / ${photoList.length}`;
    
    // 给按钮赋值disabled前先判空，避免操作undefined
    if (el.prevBtn) {
        el.prevBtn.disabled = currentIndex === 0;
    }
    if (el.nextBtn) {
        el.nextBtn.disabled = currentIndex === photoList.length - 1;
    }
}

// 加载图片主逻辑
async function loadPhotos() {
    try {
        await parseRepoImages();
        updatePhotoDisplay();
    } catch (err) {
        if (el.error) {
            el.error.textContent = `加载失败：${err.message}`;
            el.error.style.display = "block";
        }
        if (el.loading) el.loading.textContent = "图片加载失败";
    }
}

// 绑定事件（绑定前先判空按钮是否存在）
function bindEvents() {
    // 上一个按钮
    if (el.prevBtn) {
        el.prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                updatePhotoDisplay();
            }
        });
    }

    // 下一个按钮
    if (el.nextBtn) {
        el.nextBtn.addEventListener("click", () => {
            if (currentIndex < photoList.length - 1) {
                currentIndex++;
                updatePhotoDisplay();
            }
        });
    }
}

// 页面加载完成后执行
window.addEventListener("DOMContentLoaded", () => {
    loadPhotos();
    bindEvents();
});