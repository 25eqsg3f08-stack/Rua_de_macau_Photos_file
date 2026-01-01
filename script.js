// 仓库基础配置（确保仓库地址正确，末尾斜杠必须保留）
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

// 解析仓库图片（核心修复：优化API请求、增强错误排查、补充路径兼容）
async function fetchImages() {
    // 隐藏错误提示，显示加载状态
    if (dom.error) dom.error.style.display = "none";
    if (dom.loading) dom.loading.textContent = "正在解析仓库图片...";

    try {
        // 修复API路径：确保符合GitHub v3 API规范
        const repoPath = REPO_URL.replace("https://github.com/", "");
        const apiUrl = `https://api.github.com/repos/${repoPath}/contents/`;
        
        // 增强请求配置：兼容跨域、避免缓存
        const res = await fetch(apiUrl, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "MacauPhotoGallery/1.0" // GitHub API要求必须带User-Agent
            },
            cache: "no-store",
            mode: "cors"
        });

        // 详细错误提示：区分不同状态码
        if (!res.ok) {
            let errMsg = `仓库请求失败 [${res.status}]`;
            if (res.status === 404) errMsg += "（仓库不存在或路径错误）";
            if (res.status === 403) errMsg += "（访问频率限制，稍后重试）";
            throw new Error(errMsg);
        }

        const files = await res.json();
        console.log("仓库文件列表：", files); // 调试用，可保留

        // 严格筛选图片文件：兼容大小写扩展名、排除文件夹
        const imageFiles = files.filter(file => {
            if (file.type !== "file") return false; // 仅保留文件，排除文件夹
            const ext = `.${file.name.split(".").pop().toLowerCase()}`;
            return IMAGE_EXTS.includes(ext);
        });

        // 无图片时的友好提示
        if (imageFiles.length === 0) {
            throw new Error("仓库中未找到图片文件（支持格式：jpg/png/gif/webp）");
        }

        // 修复图片路径：处理文件名空格、特殊字符编码
        photoList = imageFiles.map(file => {
            const encodeFileName = encodeURIComponent(file.name.trim());
            return `${RAW_BASE_URL}${encodeFileName}`;
        });

        // 加载成功提示
        if (dom.loading) dom.loading.textContent = `共加载 ${photoList.length} 张图片`;
        console.log("图片加载完成，路径列表：", photoList); // 调试用，可保留

    } catch (err) {
        console.error("图片解析失败：", err);
        // 显示详细错误信息
        if (dom.error) {
            dom.error.textContent = `加载失败：${err.message}`;
            dom.error.style.display = "block";
        }
        if (dom.loading) dom.loading.textContent = "图片加载失败";
        // 清空图片列表，避免后续报错
        photoList = [];
    }
}

// 更新图片展示（全流程安全判空+加载占位）
function updateGallery() {
    // 核心元素不存在则直接退出
    if (photoList.length === 0 || !dom.currentPhoto || !dom.photoInfo) return;

    const imgUrl = photoList[currentIndex];
    // 重置图片状态+添加加载占位
    dom.currentPhoto.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="; // 1x1透明占位图
    dom.currentPhoto.style.display = "block";
    dom.currentPhoto.alt = `澳门内港照片 ${currentIndex + 1}`;

    // 加载成功处理
    dom.currentPhoto.onload = () => {
        dom.currentPhoto.style.display = "block";
    };

    // 加载失败处理：显示备用图
    dom.currentPhoto.onerror = () => {
        console.error(`图片加载失败：${imgUrl}`);
        dom.currentPhoto.src = `https://picsum.photos/800/600?random=${currentIndex}`;
        dom.currentPhoto.style.display = "block";
    };

    // 赋值图片地址（已编码特殊字符）
    dom.currentPhoto.src = imgUrl;
    // 更新图片计数
    dom.photoInfo.textContent = `${currentIndex + 1} / ${photoList.length}`;
    // 控制按钮状态
    setButtonDisabled(dom.prevBtn, currentIndex === 0);
    setButtonDisabled(dom.nextBtn, currentIndex === photoList.length - 1);
}

// 绑定事件（安全绑定+防重复点击）
function bindEvents() {
    // 上一张按钮
    if (dom.prevBtn) {
        dom.prevBtn.addEventListener("click", () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateGallery();
            }
        });
    }

    // 下一张按钮
    if (dom.nextBtn) {
        dom.nextBtn.addEventListener("click", () => {
            if (currentIndex < photoList.length - 1) {
                currentIndex++;
                updateGallery();
            }
        });
    }
}

// 初始化（确保DOM加载完成后执行）
async function init() {
    // 先初始化按钮状态（禁用）
    setButtonDisabled(dom.prevBtn, true);
    setButtonDisabled(dom.nextBtn, true);
    // 加载图片+绑定事件
    await fetchImages();
    updateGallery();
    bindEvents();
}

// 页面加载完成后执行（兼容不同浏览器）
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
