// 全局变量
let photoList = [];
let currentIndex = 0;

// 重试配置
const RETRY_CONFIG = {
    maxRetries: 2,
    delay: 1000
};

document.addEventListener('DOMContentLoaded', function() {
    // 1. 配置信息（仅保留 Pages 地址，无需 GitHub PAT）
    const CONFIG = {
        pagesUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/', // GitHub Pages 目录地址
        baseUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/' // 照片加载基础地址
    };

    // 2. 获取DOM元素
    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        currentPhoto: document.getElementById('current-photo'),
        photoInfo: document.getElementById('photo-info'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn')
    };

    // 3. 校验核心DOM元素
    if (!Object.values(elements).every(el => el)) {
        console.error('核心DOM元素缺失');
        if (elements.error) {
            elements.error.style.display = 'block';
            elements.error.textContent = '页面元素加载异常，请刷新重试';
        }
        return;
    }

    // 4. 从 GitHub Pages 目录自动读取照片列表
    async function getPhotoList() {
        try {
            // 调用 repo.js 中的解析函数，仅传入 Pages 地址
            const files = await window.listGithubPrivateRepo(CONFIG.pagesUrl);
            if (!files) throw new Error('Pages 目录解析失败，未获取到文件列表');

            // 筛选图片文件并提取文件名
            photoList = files
                .filter(file => file.type === 'file')
                .map(file => file.name)
                .sort();

            if (photoList.length === 0) throw new Error('Pages 目录中未找到图片文件（jpg/jpeg/png）');
        } catch (err) {
            elements.error.style.display = 'block';
            elements.error.textContent = err.message;
            elements.loading.style.display = 'none';
        }
    }

    // 5. 加载指定照片（含自动重试逻辑）
    function loadPhoto(index, retryCount = 0) {
        if (index < 0 || index >= photoList.length) return;

        // 重置状态
        elements.loading.style.display = 'flex';
        elements.currentPhoto.style.display = 'none';
        elements.error.style.display = 'none';

        // 拼接照片完整URL
        const photoUrl = CONFIG.baseUrl + photoList[index];
        elements.currentPhoto.src = photoUrl;

        // 加载成功回调
        elements.currentPhoto.onload = function() {
            elements.loading.style.display = 'none';
            elements.currentPhoto.style.display = 'block';
            elements.photoInfo.textContent = `照片：${photoList[index]} / 共 ${photoList.length} 张`;
            updateNavButtons();
        };

        // 加载失败回调（自动重试）
        elements.currentPhoto.onerror = function() {
            if (retryCount < RETRY_CONFIG.maxRetries) {
                setTimeout(() => {
                    loadPhoto(index, retryCount + 1);
                }, RETRY_CONFIG.delay);
            } else {
                elements.loading.style.display = 'none';
                elements.error.style.display = 'block';
                elements.error.textContent = navigator.onLine ? 
                    `照片 ${photoList[index]} 加载失败（已重试${RETRY_CONFIG.maxRetries}次）` : 
                    '无网络连接，暂无缓存照片';
            }
        };
    }

    // 6. 更新导航按钮状态
    function updateNavButtons() {
        elements.prevBtn.disabled = currentIndex === 0;
        elements.nextBtn.disabled = currentIndex === photoList.length - 1;
    }

    // 7. 绑定按钮点击事件
    elements.prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            loadPhoto(currentIndex);
        }
    });

    elements.nextBtn.addEventListener('click', () => {
        if (currentIndex < photoList.length - 1) {
            currentIndex++;
            loadPhoto(currentIndex);
        }
    });

    // 8. 初始化页面（先读取照片列表，再加载首张）
    elements.loading.style.display = 'flex';
    getPhotoList().then(() => {
        if (photoList.length > 0) {
            loadPhoto(0);
        }
    });
});