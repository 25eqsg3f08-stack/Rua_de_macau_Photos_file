// 目标仓库配置
const repoOwner = "25eqsg3f08-stack";
const repoName = "Rua_de_macau_Photos";
// GitHub Contents API 地址 + 公共 CORS 代理（解决前端跨域）
const corsProxy = "https://api.allorigins.win/get?url=";
const apiUrl = `${corsProxy}${encodeURIComponent(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/`)}`;
// 支持的图片格式
const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

// DOM 元素
const el = {
    loading: document.querySelector(".loading"),
    container: document.getElementById("photoContainer"),
    error: document.getElementById("error") // 需在 HTML 中添加 error 元素
};

// 加载照片核心函数
async function loadPhotos() {
    if (!el.loading || !el.container) return;

    el.loading.textContent = "正在加载仓库图片...";
    el.container.innerHTML = "";
    if (el.error) el.error.style.display = "none";

    try {
        // 1. 请求 GitHub Contents API（通过 CORS 代理）
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-cache"
        });

        if (!response.ok) throw new Error("API 请求失败");

        // 2. 解析代理返回的数据（allorigins.win 会把结果放在 contents 字段）
        const proxyData = await response.json();
        const repoContents = JSON.parse(proxyData.contents);

        // 3. 过滤出图片文件
        const imageFiles = repoContents.filter(item => {
            // 排除文件夹，只保留文件
            if (item.type !== "file") return false;
            // 匹配图片后缀
            const ext = item.name.slice(item.name.lastIndexOf(".")).toLowerCase();
            return imageExts.includes(ext);
        });

        if (imageFiles.length === 0) throw new Error("仓库中未找到图片文件");

        // 4. 生成图片 URL 并渲染到页面
        imageFiles.forEach(file => {
            // 拼接 RAW 图片地址（直接访问原图）
            const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${file.name}`;
            
            const imgEl = document.createElement("img");
            imgEl.src = rawUrl;
            imgEl.alt = file.name;
            imgEl.style.maxWidth = "100%";
            imgEl.style.margin = "8px";
            imgEl.loading = "lazy"; // 懒加载优化

            el.container.appendChild(imgEl);
        });

    } catch (err) {
        console.error("加载失败:", err);
        el.loading.textContent = "加载失败";
        if (el.error) {
            el.error.style.display = "block";
            el.error.textContent = err.message;
        }
    } finally {
        el.loading.style.opacity = "0.5";
    }
}

// 页面加载完成后执行
window.addEventListener("DOMContentLoaded", loadPhotos);
