// 全局变量
let photoList = [];
let currentIndex = 0;

// 重试配置
const RETRY_CONFIG = {
    maxRetries: 2,
    delay: 1000
};

document.addEventListener('DOMContentLoaded', function() {
    // 1. 配置信息（仅保留 GitHub Pages 地址）
    const CONFIG = {
        pagesUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/',
        baseUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/'
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
        elements.error.style.display = 'block';
        elements.error.textContent = '页面元素加载异常，请刷新重试';
        return;
    }

    // 4. 内置：从 Pages 目录解析照片列表（替代repo.js）
    async function parsePagesPhotoList(pagesUrl) {
        try {
            const response = await fetch(pagesUrl, { mode: 'cors' });
            if (!response.ok) {
                throw new Error(`Pages 目录访问失败 [${response.status}]，请检查仓库是否为公共且Pages已开启`);
            }

            const html = await response.text();
            const imgRegex = /href="([^"]+\.(jpg|jpeg|png))"/gi;
            const photoFiles = [];
            let match;

            while ((match = imgRegex.exec(html)) !== null) {
                const fileName = match[1].split('/').pop();
                if (!photoFiles.includes(fileName)) photoFiles.push(fileName);
            }

            if (photoFiles.length === 0) throw new Error('Pages 目录中未找到jpg/jpeg/png格式的照片');
            return photoFiles;
        } catch (err) {
            console.error('解析照片列表失败：', err);
            return null;
        }
    }

    // 5. 获取照片列表
    async function getPhotoList() {
        elements.loading.style.display = 'flex';
        const files = await parsePagesPhotoList(CONFIG.pagesUrl);
        
        if (!files) {
            elements.error.style.display = 'block';
            elements.error.textContent = '自动读取照片失败，请检查仓库配置';
            elements.loading.style.display = 'none';
            return;
        }

        photoList = files.sort();
        if (photoList.length > 0) loadPhoto(0);
        else {
            elements.error.style.display = 'block';
            elements.error.textContent = '仓库中未检测到照片文件';
            elements.loading.style.display = 'none';
        }
    }

    // 6. 加载指定照片（含重试）
    function loadPhoto(index, retryCount = 0) {
        if (index < 0 || index >= photoList.length) return;

        elements.loading.style.display = 'flex';
        elements.currentPhoto.style.display = 'none';
        elements.error.style.display = 'none';

        const photoUrl = CONFIG.baseUrl + photoList[index];
        elements.currentPhoto.src = photoUrl;

        elements.currentPhoto.onload = function() {
            elements.loading.style.display = 'none';
            elements.currentPhoto.style.display = 'block';
            elements.photoInfo.textContent = `照片：${photoList[index]} / 共 ${photoList.length} 张`;
            updateNavButtons();
        };

        elements.currentPhoto.onerror = function() {
            if (retryCount < RETRY_CONFIG.maxRetries) {
                setTimeout(() => loadPhoto(index, retryCount + 1), RETCount + 1), RETRY_CONFIG.delay);
            } else {
                elements.loading.style.display = 'none';
                elements.error.style.display = 'block';
                elements.error.textContent = navigator.onLine ? 
                    `照片 ${photoList[index]} 加载失败（已重试${RETRY_CONFIG.maxRetries}次）` : 
                    '无网络连接，暂无缓存照片';
            }
        };
    }

    // 7. 更新导航按钮
    function updateNavButtons() {
        elements.prevBtn.disabled = currentIndex === 0;
        elements.nextBtn.disabled = currentIndex === photoList.length - 1;
    }

    // 8. 绑定按钮事件
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

    // 9. 初始化
    getPhotoList();
});