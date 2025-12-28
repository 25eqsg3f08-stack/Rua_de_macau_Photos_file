// 仓库基础配置（直接使用raw地址根路径，避免拼接错误）
const RAW_BASE_URL = "https://raw.githubusercontent.com/25eqsg3f08-stack/Rua_de_macau_Photos/main/";
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const PRINT_URL = "https://25eqsg3f08-stack.github.io/macau-photo-gallery/";
const MAIL_HTML_URL = "https://25eqsg3f08-stack.github.io/macau-photo-gallery/mail.html";

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
    mailBtn: getEl("mail-btn"),
    printTitle: getEl("print-title"),
    printSize: getEl("print-size"),
    printContent: getEl("print-content"),
    toPreview: getEl("to-preview")
};

// 检测图片地址是否有效（异步校验）
async function checkImageValidity(url) {
    try {
        const response = await fetch(url, { method: "HEAD" });
        return response.ok;
    } catch (err) {
        return false;
    }
}

// 解析仓库图片并校验地址
async function parseRepoImages() {
    if (!el.loading) return;
    el.loading.textContent = "正在解析仓库图片...";
    
    try {
        // 调用GitHub Contents API获取文件列表
        const apiUrl = "https://api.github.com/repos/25eqsg3f08-stack/Rua_de_macau_Photos/contents/";
        const response = await fetch(apiUrl, {
            headers: { "Accept": "application/vnd.github.v3+json" },
            cache: "no-cache"
        });

        if (!response.ok) throw new Error(`仓库请求失败 [${response.status}]`);
        const contents = await response.json();

        // 筛选图片文件并生成有效地址
        const imageFiles = contents.filter(item => {
            if (item.type !== "file") return false;
            const ext = item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
            return IMAGE_EXTS.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        // 生成Raw地址并校验有效性
        const validPhotoUrls = [];
        el.loading.textContent = "正在校验图片地址...";
        for (const file of imageFiles) {
            const rawUrl = RAW_BASE_URL + file.name;
            const isValid = await checkImageValidity(rawUrl);
            if (isValid) {
                validPhotoUrls.push(rawUrl);
            } else {
                console.warn(`图片地址无效：${rawUrl}`);
            }
        }

        if (validPhotoUrls.length === 0) throw new Error("无有效可访问的图片地址");
        photoList = validPhotoUrls;
        el.loading.textContent = `共加载 ${photoList.length} 张有效图片`;
        return photoList;

    } catch (err) {
        console.error("解析失败:", err);
        throw err;
    }
}

// 更新图片展示（强化加载容错）
function updatePhotoDisplay() {
    if (photoList.length === 0 || !el.currentPhoto || !el.photoInfo) return;
    
    const currentUrl = photoList[currentIndex];
    // 重置图片状态
    el.currentPhoto.src = "";
    el.currentPhoto.style.display = "none";
    el.currentPhoto.alt = `澳门内港照片 ${currentIndex + 1}`;

    // 加载成功/失败处理
    el.currentPhoto.onload = function() {
        el.currentPhoto.style.display = "block";
        console.log(`图片 ${currentIndex + 1} 加载成功`);
    };
    el.currentPhoto.onerror = function() {
        console.error(`图片 ${currentIndex + 1} 加载失败: ${currentUrl}`);
        // 显示兜底占位图
        el.currentPhoto.src = `https://picsum.photos/400/300?random=${currentIndex}`;
        el.currentPhoto.style.display = "block";
    };

    // 赋值图片地址
    el.currentPhoto.src = currentUrl;
    el.photoInfo.textContent = `${currentIndex + 1} / ${photoList.length}`;
    
    // 更新按钮状态
    if (el.prevBtn) el.prevBtn.disabled = currentIndex === 0;
    if (el.nextBtn) el.nextBtn.disabled = currentIndex === photoList.length - 1;
    if (el.printBtn) el.printBtn.disabled = false;
    if (el.mailBtn) el.mailBtn.disabled = false;
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

// 绑定事件（全量判空）
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

// 页面加载完成后执行
window.addEventListener("DOMContentLoaded", () => {
    loadPhotos();
    bindEvents();
});
