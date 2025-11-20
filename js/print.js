// 🔴 核心配置（静态填写，无需修改）
const CONFIG = {
    // GitHub图片仓库地址（固定）
    imgRepoUrl: "https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/",
    // 图片格式（仅筛选以下格式，与主页面保持一致）
    imgExts: ["jpg", "jpeg", "png"],
    // 空内容配置（无预设文字，后续可手动在页面输入）
    contentList: []
};

// 全局状态（静态维护）
let currentIndex = 0; // 当前图片/内容索引
let currentColor = "#333333"; // 默认文字颜色
let currentImgSize = 120; // 默认图片高度（mm，精准匹配打印）
let imgList = []; // 存储仓库图片文件名（自动排序）
const DPI = 96; // 标准屏幕DPI，与打印机一致，确保尺寸无偏差
const MM_TO_INCH = 25.4; // 毫米转英寸系数（1英寸=25.4mm）

// DOM元素获取（适配输入框，替换原滑块，精准匹配页面结构）
const dom = {
    // 表单元素
    titleInput: document.getElementById("title"),
    contentInput: document.getElementById("content"),
    colorPicker: document.getElementById("color-picker"),
    imgSizeInput: document.getElementById("img-size-input"),
    sizeUnit: document.querySelector(".size-unit"),
    // 按钮元素
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    printBtn: document.getElementById("print-btn"),
    // 图片相关（框架内预览）
    currentImg: document.getElementById("frame-img"),
    imgLoading: document.getElementById("img-loading"),
    imgError: document.getElementById("img-error"),
    // 预览/打印元素（框架内内容）
    printFrame: document.getElementById("print-frame"),
    frameTitle: document.getElementById("frame-title"),
    frameText: document.getElementById("frame-text")
};

// 初始化页面：1.获取仓库图片列表 2.渲染第一张 3.绑定事件 4.启动自动预览
async function init() {
    showImgLoading();
    try {
        // 🌟 核心：读取GitHub仓库图片（纯静态，通过GitHub API获取文件列表）
        imgList = await getGithubImgList();
        // 初始化空内容列表（与图片数量一致，无预设文字）
        CONFIG.contentList = Array(imgList.length).fill({ title: "", text: "" });
        // 渲染第一张图片和空内容
        renderCurrent();
    } catch (err) {
        showImgError(err.message);
        console.error("初始化失败：", err);
    } finally {
        hideImgLoading();
    }
    // 绑定所有按钮、输入框事件（适配输入框，精准控制尺寸）
    bindEvents();
}

// 读取GitHub仓库图片列表（纯静态请求，无跨域，适配GitHub Pages）
async function getGithubImgList() {
    try {
        // GitHub API：获取仓库根目录文件列表
        const apiUrl = `https://api.github.com/repos/25eqsg3f08-stack/Rua_de_macau_Photos/contents/`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`GitHub API请求失败，状态码：${response.status}`);
        
        const files = await response.json();
        // 筛选图片文件（按格式）并按文件名排序（与主页面一致）
        return files
            .filter(file => file.type === "file") // 只保留文件（排除文件夹）
            .filter(file => {
                const ext = file.name.split(".").pop()?.toLowerCase();
                return CONFIG.imgExts.includes(ext);
            })
            .map(file => file.name) // 只保留文件名（如：tasha_street.jpg）
            .sort(); // 按文件名排序
    } catch (err) {
        throw new Error(`获取图片列表失败：${err.message}`);
    }
}

// 渲染当前索引的图片+内容（同步框架预览区，实现自动预览）
function renderCurrent() {
    if (imgList.length === 0) return;
    
    const currentImgName = imgList[currentIndex];
    const currentContent = CONFIG.contentList[currentIndex];
    const currentImgUrl = `${CONFIG.imgRepoUrl}${currentImgName}`;

    // 1. 渲染当前图片（框架内预览，处理加载状态）
    renderFrameImg(currentImgUrl);
    // 2. 同步表单输入框（空内容或已输入的内容）
    dom.titleInput.value = currentContent.title || "";
    dom.contentInput.value = currentContent.text || "";
    // 3. 同步框架内预览内容（标题+文本）
    dom.frameTitle.textContent = currentContent.title || "";
    dom.frameText.textContent = currentContent.text || "";
    // 4. 应用当前文字颜色和图片尺寸（精准计算）
    applyColor(currentColor);
    applyImgSize(currentImgSize);
    // 5. 显示框架预览区
    dom.printFrame.style.display = "flex";
}

// 渲染框架内图片（处理加载状态，确保打印时图片能正常显示）
function renderFrameImg(imgUrl) {
    showImgLoading();
    hideImgError();
    // 初始化图片样式，避免打印时继承隐藏属性
    dom.currentImg.style.display = "none";
    dom.currentImg.style.visibility = "visible";
    dom.currentImg.style.objectFit = "contain";

    dom.currentImg.src = imgUrl;
    // 图片加载成功后，强制应用样式并触发重绘，确保打印能捕获到图片
    dom.currentImg.onload = function() {
        hideImgLoading();
        dom.currentImg.style.display = "block";
        applyImgSize(currentImgSize);
        // 🔥 关键：触发浏览器重绘，避免图片加载延迟导致打印无图
        dom.currentImg.offsetHeight; // 强制刷新样式
        dom.printFrame.offsetHeight; // 刷新容器样式
    };
    // 图片加载失败
    dom.currentImg.onerror = function() {
        hideImgLoading();
        showImgError(`图片加载失败，地址：${imgUrl}`);
    };
}

// 应用文字颜色（同步框架内标题和文本，自动预览）
function applyColor(color) {
    currentColor = color;
    // 同步框架内预览文字颜色
    dom.frameTitle.style.color = color;
    dom.frameText.style.color = color;
    // 同步输入框文字颜色
    dom.titleInput.style.color = color;
    dom.contentInput.style.color = color;
}

// 🔥 核心优化：按输入的mm数值，精准计算图片尺寸（与打印偏差≤1mm）
function applyImgSize(mmSize) {
    currentImgSize = mmSize;
    // 同步输入框数值
    dom.imgSizeInput.value = mmSize;
    
    // 计算：mm转px（按标准DPI，与打印机一致，确保无偏差）
    const pxSize = Math.round((mmSize / MM_TO_INCH) * DPI);
    // 保持图片比例，仅设置高度（宽度自动适配），同时确保打印时不被压缩
    dom.currentImg.style.height = `${pxSize}px`;
    dom.currentImg.style.width = "auto";
    dom.currentImg.style.maxHeight = `${pxSize}px`;
    dom.currentImg.style.maxWidth = "100%";
}

// 绑定所有事件（适配输入框，精准控制尺寸，确保打印正常）
function bindEvents() {
    // 上一张图片（切换时保存当前输入内容）
    dom.prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
            saveCurrentInput();
            currentIndex--;
            renderCurrent();
        } else {
            alert("已到第一张图片");
        }
    });

    // 下一张图片（切换时保存当前输入内容）
    dom.nextBtn.addEventListener("click", () => {
        if (currentIndex < imgList.length - 1) {
            saveCurrentInput();
            currentIndex++;
            renderCurrent();
        } else {
            alert("已到最后一张图片");
        }
    });

    // 列印（调用浏览器打印，打印前确保图片加载完成）
    dom.printBtn.addEventListener("click", () => {
        saveCurrentInput();
        // 额外判断：确保图片已加载，避免打印无图
        if (dom.currentImg.complete) {
            window.print();
        } else {
            alert("图片正在加载中，请稍等片刻再打印～");
            // 图片加载完成后自动触发打印
            dom.currentImg.onload = function() {
                window.print();
            };
        }
    });

    // 颜色选择器变化（实时应用颜色，自动预览）
    dom.colorPicker.addEventListener("input", (e) => {
        applyColor(e.target.value);
    });

    // 🔥 图片尺寸输入框（实时应用，精准匹配打印尺寸）
    dom.imgSizeInput.addEventListener("input", (e) => {
        let size = parseInt(e.target.value);
        // 强制限制范围（50-180mm，A4纵向最大可用高度）
        if (isNaN(size)) size = 120;
        if (size < 50) size = 50;
        if (size > 180) size = 180;
        // 应用精准尺寸
        applyImgSize(size);
        // 同步输入框数值（防止输入超出范围的数值）
        dom.imgSizeInput.value = size;
    });

    // 标题输入框实时同步（自动预览）
    dom.titleInput.addEventListener("input", (e) => {
        const title = e.target.value.trim();
        dom.frameTitle.textContent = title;
        // 实时保存输入内容
        CONFIG.contentList[currentIndex].title = title;
    });

    // 文本输入框实时同步（自动预览）
    dom.contentInput.addEventListener("input", (e) => {
        const text = e.target.value.trim();
        dom.frameText.textContent = text;
        // 实时保存输入内容
        CONFIG.contentList[currentIndex].text = text;
    });
}

// 保存当前输入的标题和文本到contentList（切换图片时保留内容）
function saveCurrentInput() {
    if (imgList.length === 0) return;
    CONFIG.contentList[currentIndex] = {
        title: dom.titleInput.value.trim(),
        text: dom.contentInput.value.trim()
    };
}

// 图片加载状态控制（适配框架内样式）
function showImgLoading() {
    dom.imgLoading.style.display = "block";
    dom.currentImg.style.display = "none";
    dom.imgError.style.display = "none";
}
function hideImgLoading() {
    dom.imgLoading.style.display = "none";
}

// 图片加载错误控制（适配框架内样式）
function showImgError(msg) {
    dom.imgError.style.display = "block";
    dom.imgError.textContent = msg || "图片加载失败，请检查网络";
    dom.currentImg.style.display = "none";
    dom.imgLoading.style.display = "none";
}

// 隐藏图片错误的函数（解决之前的引用错误）
function hideImgError() {
    dom.imgError.style.display = "none";
}

// 启动页面（静态执行，无延迟，启动自动预览）
init();
