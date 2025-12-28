// 固定仓库地址（仅保留 GitHub 仓库根地址）
const REPO_URL = "https://github.com/25eqsg3f08-stack/Rua_de_macau_Photos";
// 配置项
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
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

// 核心：解析仓库目录并拼接 blob 图片地址（直接基于 GitHub 仓库地址）
async function parseRepoImages() {
    el.loading.textContent = "正在解析仓库图片...";
    try {
        // 拼接仓库 contents API 地址（基于 GitHub 仓库根地址）
        const apiUrl = `${REPO_URL.replace("github.com", "api.github.com/repos")}/contents/`;
        
        // 请求仓库文件列表（需浏览器跨域插件支持）
        const response = await fetch(apiUrl, {
            headers: {
                "Accept": "application/vnd.github.v3+json"
            },
            cache: "no-cache"
        });

        if (!response.ok) throw new Error(`仓库请求失败 [${response.status}]`);
        const contents = await response.json();

        // 筛选图片文件并拼接 GitHub Blob 可访问地址
        const imageFiles = contents.filter(item => {
            if (item.type !== "file") return false;
            const ext = item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
            return IMAGE_EXTS.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        // 拼接可直接访问的 blob 地址
        photoList = imageFiles.map(file => {
            return `https://github.com/25eqsg3f08-stack/Rua_de_macau_Photos/raw/main/${file.name}`;
        });

        return photoList;
    } catch (err) {
        console.error("解析失败:", err);
        throw err;
    }
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

// 加载图片核心函数
async function loadPhotos() {
    try {
        await parseRepoImages();
        el.loading.textContent = `共加载 ${photoList.length} 张图片`;
        updatePhotoDisplay();
    } catch (err) {
        el.error.textContent = `加载失败：${err.message}`;
        el.error.style.display = "block";
        el.loading.textContent = "加载完成";
    }
}

// 绑定事件
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
