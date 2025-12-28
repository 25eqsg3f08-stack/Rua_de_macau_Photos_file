// 仓库基础配置
const RAW_BASE_URL = "https://raw.githubusercontent.com/25eqsg3f08-stack/Rua_de_macau_Photos/main/";
const REPO_URL = "https://github.com/25eqsg3f08-stack/Rua_de_macau_Photos";
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// 全局状态
let photoList = [];
let currentIndex = 0;

// DOM 元素获取：严格判空，未找到直接返回
function getEl(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`DOM元素#${id}未找到，跳过相关操作`);
        return null;
    }
    return element;
}

// 初始化DOM元素（仅保留必要项）
const dom = {
    loading: getEl("loading"),
    error: getEl("error"),
    currentPhoto: getEl("current-photo"),
    photoInfo: getEl("photo-info"),
    prevBtn: getEl("prev-btn"),
    nextBtn: getEl("next-btn")
};

// 安全设置按钮禁用状态
function setButtonDisabled(btn, isDisabled) {
    if (btn && typeof btn.disabled !== "undefined") {
        btn.disabled = isDisabled;
    }
}

// 解析仓库图片
async function fetchImages() {
    if (!dom.loading) return;
    dom.loading.textContent = "正在解析仓库图片...";

    try {
        const apiUrl = `${REPO_URL.replace("github.com", "api.github.com/repos")}/contents/`;
        const res = await fetch(apiUrl, {
            headers: { "Accept": "application/vnd.github.v3+json" },
            cache: "no-cache"
        });

        if (!res.ok) throw new Error(`仓库请求失败 [${res.status}]`);
        const files = await res.json();

        const imageFiles = files.filter(file => {
            if (file.type !== "file") return false;
            const ext = file.name.split(".").pop().toLowerCase();
            return IMAGE_EXTS.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        photoList = imageFiles.map(file => RAW_BASE_URL + file.name.trim());
        dom.loading.textContent = `共加载 ${photoList.length} 张图片`;

    } catch (err) {
        console.error("图片解析失败：", err);
        if (dom.error) {
            dom.error.textContent = `加载失败：${err.message}`;
            dom.error.style.display = "block";
        }
        if (dom.loading) dom.loading.textContent = "图片加载失败";
    }
}

// 更新图片展示（全流程安全判空）
function updateGallery() {
    // 核心元素不存在则直接退出
    if (photoList.length === 0 || !dom.currentPhoto || !dom.photoInfo) return;

    const imgUrl = photoList[currentIndex];
    // 重置图片状态
    dom.currentPhoto.src = "";
    dom.currentPhoto.style.display = "none";
    dom.currentPhoto.alt = `澳门内港照片 ${currentIndex + 1}`;

    // 加载成功/失败处理
    dom.currentPhoto.onload = () => {
        dom.currentPhoto.style.display = "block";
    };
    dom.currentPhoto.onerror = () => {
        dom.currentPhoto.src = `https://picsum.photos/600/400?random=${currentIndex}`;
        dom.currentPhoto.style.display = "block";
    };

    // 赋值图片地址
    dom.currentPhoto.src = imgUrl;
    // 更新图片计数
    dom.photoInfo.textContent = `${currentIndex + 1} / ${photoList.length}`;
    // 安全设置按钮状态
    setButtonDisabled(dom.prevBtn, currentIndex === 0);
    setButtonDisabled(dom.nextBtn, currentIndex === photoList.length - 1);
}

// 绑定事件（安全绑定）
function bindEvents() {
    if (dom.prevBtn) {
        dom.prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateGallery();
            }
        });
    }

    if (dom.nextBtn) {
        dom.nextBtn.addEventListener("click", () => {
            if (currentIndex < photoList.length - 1) {
                currentIndex++;
                updateGallery();
            }
        });
    }
}

// 初始化
async function init() {
    await fetchImages();
    updateGallery();
    bindEvents();
}

// 页面加载完成后执行
window.addEventListener("DOMContentLoaded", init);