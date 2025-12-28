// 目标仓库信息（固定不变）
const repoOwner = "25eqsg3f08-stack";
const repoName = "Rua_de_macau_Photos";
// 支持的图片格式
const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
// 扫描序号范围（按需调整）
const scanRange = [1, 50];
// RAW 图片地址前缀
const rawPrefix = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/`;

// 加载照片函数（逻辑保留，移除 API 依赖）
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
        // 生成所有可能的图片 URL（纯序号 + 多格式）
        const allUrls = [];
        for (let i = scanRange[0]; i <= scanRange[1]; i++) {
            imageExts.forEach(ext => {
                allUrls.push(`${rawPrefix}${i}${ext}`);
                allUrls.push(`${rawPrefix}${String(i).padStart(3, '0')}${ext}`);
            });
        }

        // 并行验证 URL 有效性
        const validUrls = [];
        const verifyPromises = allUrls.map(async url => {
            try {
                const res = await fetch(url, { method: "HEAD", cache: "no-cache" });
                if (res.ok) validUrls.push(url);
            } catch (err) { /* 无效 URL 忽略 */ }
        });
        await Promise.all(verifyPromises);

        if (validUrls.length === 0) throw new Error("仓库中未找到图片文件");

        // 渲染有效图片
        validUrls.forEach(url => {
            const imgEl = document.createElement("img");
            imgEl.src = url;
            imgEl.alt = url.split("/").pop();
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