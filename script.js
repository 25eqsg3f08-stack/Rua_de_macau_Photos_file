// 固定仓库基础地址（仅保留GitHub仓库根地址，无RAW前缀）
const REPO_BASE_URL = "https://github.com/25eqsg3f08-stack/Rua_de_macau_Photos";
// 配置项
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const PRINT_URL = "https://25eqsg3f08-stack.github.io/macau-photo-gallery/";
const MAIL_HTML_URL = "https://25eqsg3f08-stack.github.io/macau-photo-gallery/mail.html";
const REPO_BRANCH = "main"; // 仓库默认分支，可根据实际修改

// 全局状态
let photoList = [];
let currentIndex = 0;

// DOM 元素获取（封装函数，增加存在性校验）
function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`DOM元素#${id}未找到，请检查HTML中的ID是否正确`);
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
    mailBtn: getEl("mail-btn"),
    printTitle: getEl("print-title"),
    printSize: getEl("print-size"),
    printContent: getEl("print-content"),
    toPreview: getEl("to-preview")
};

// 解析仓库图片（动态拼接可访问的图片地址，无RAW_PREFIX）
async function parseRepoImages() {
    if (!el.loading) return;
    el.loading.textContent = "正在解析仓库图片...";
    try {
        // 从仓库基础地址拼接Contents API地址
        const apiUrl = `${REPO_BASE_URL.replace("github.com", "api.github.com/repos")}/contents/`;
        const response = await fetch(apiUrl, {
            headers: { "Accept": "application/vnd.github.v3+json" },
            cache: "no-cache"
        });

        if (!response.ok) throw new Error(`仓库请求失败 [${response.status}]`);
        const contents = await response.json();

        // 筛选图片文件并拼接可直接访问的地址（无RAW_PREFIX）
        const imageFiles = contents.filter(item => {
            if (item.type !== "file") return false;
            const ext = item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
            return IMAGE_EXTS.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        // 直接拼接GitHub Raw地址（无独立RAW_PREFIX变量）
        photoList = imageFiles.map(file => {
            return `${REPO_BASE_URL}/raw/${REPO_BRANCH}/${file.name}`;
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
    // 图片加载容错处理
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
    
    // 按钮状态更新（先判断元素是否存在）
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
        if (el.error) el.error.textContent = `加载失败：${err.message}`;
        if (el.error) el.error.style.display = "block";
        if (el.loading) el.loading.textContent = "加载完成";
    }
}

// 绑定事件（核心：所有事件绑定前先校验元素是否存在）
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

    // 打印按钮
    if (el.printBtn) {
        el.printBtn.addEventListener("click", () => {
            const printSetting = getEl("print-setting");
            if (printSetting) printSetting.style.display = "block";
            if (el.photoInfo && el.printTitle) {
                const photoNum = el.photoInfo.textContent.split(" / ")[0];
                el.printTitle.value = `澳门内港照片 ${photoNum}`;
            }
        });
    }

    // 前往预览按钮
    if (el.toPreview) {
        el.toPreview.addEventListener("click", () => {
            if (!el.currentPhoto || !el.printTitle || !el.printSize || !el.printContent) return;
            
            const imgUrl = encodeURIComponent(el.currentPhoto.src);
            const title = encodeURIComponent(el.printTitle.value.trim() || "澳门内港照片");
            const size = encodeURIComponent(el.printSize.value);
            const content = encodeURIComponent(el.printContent.value.trim());
            window.open(`preview.html?imgUrl=${imgUrl}&title=${title}&size=${size}&content=${content}`, "_blank");
        });
    }

    // 邮件分享按钮
    if (el.mailBtn) {
        el.mailBtn.addEventListener("click", () => {
            if (!el.currentPhoto) return;
            const currentImgUrl = encodeURIComponent(el.currentPhoto.src);
            const imgName = encodeURIComponent(`澳门内港照片 ${currentIndex + 1}`);
            const targetUrl = `${MAIL_HTML_URL}?imgUrl=${currentImgUrl}&imgName=${imgName}`;
            window.open(targetUrl, "_blank");
        });
    }
}

// 页面加载完成后执行（避免DOM未渲染时获取元素）
window.addEventListener("DOMContentLoaded", () => {
    loadPhotos();
    bindEvents();
});
