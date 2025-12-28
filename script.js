// 目标仓库信息（固定不变）
const repoOwner = "25eqsg3f08-stack";
const repoName = "Rua_de_macau_Photos";
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/`;
// 支持的图片格式（保留要求的所有格式）
const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// 加载照片函数（逻辑完全保留，仅解决跨域适配）
async function loadPhotos() {
    const loadingEl = document.querySelector(".loading");
    const containerEl = document.getElementById("photoContainer");
    const errorEl = document.getElementById("error") || document.createElement("div");
    
    // 初始化 DOM 状态
    if (loadingEl) loadingEl.textContent = "正在加载仓库图片...";
    if (containerEl) containerEl.innerHTML = "";
    errorEl.id = "error";
    errorEl.style.color = "red";
    errorEl.style.textAlign = "center";
    errorEl.style.margin = "10px 0";
    if (!document.getElementById("error")) document.body.insertBefore(errorEl, containerEl);

    try {
        // 直接请求 GitHub API（注：需浏览器开启跨域允许，或使用浏览器插件临时解决）
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Accept": "application/vnd.github.v3+json"
            },
            cache: "no-cache"
        });

        if (!response.ok) throw new Error(`API 请求失败 [${response.status}]`);
        const repoContents = await response.json();

        // 过滤图片文件
        const imageFiles = repoContents.filter(item => {
            if (item.type !== "file") return false;
            const ext = item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
            return imageExts.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        // 渲染图片到容器
        imageFiles.forEach(file => {
            const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${file.name}`;
            const imgEl = document.createElement("img");
            imgEl.src = rawUrl;
            imgEl.alt = file.name;
            imgEl.style.maxWidth = "100%";
            imgEl.style.margin = "8px";
            imgEl.loading = "lazy";
            containerEl.appendChild(imgEl);
        });

    } catch (err) {
        console.error("加载失败:", err);
        if (loadingEl) loadingEl.textContent = "加载失败";
        errorEl.textContent = err.message;
    }
}

// 页面加载执行
window.addEventListener("DOMContentLoaded", loadPhotos);