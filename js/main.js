// 全局变量
let photoList = [];
let currentIndex = 0;

// 重试配置（照片加载失败时的重试规则）
const RETRY_CONFIG = {
    maxRetries: 2,
    delay: 1000 // 重试间隔1秒
};

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    // 核心配置（替换为你的GitHub Pages地址和兜底照片名）
    const CONFIG = {
        pagesUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/', // GitHub Pages目录地址
        baseUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/',   // 照片加载基础地址
        fallbackPhotos: ['photo1.jpg', 'photo2.png', 'macau_3.jpeg']          // 国内网络兜底的照片名
    };

    // 获取页面DOM元素
    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        currentPhoto: document.getElementById('current-photo'),
        photoInfo: document.getElementById('photo-info'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn')
    };

    // 校验DOM元素是否存在，避免后续报错
    if (!Object.values(elements).every(el => el)) {
        elements.error.style.display = 'block';
        elements.error.textContent = '页面核心元素加载异常，请刷新重试';
        return;
    }

    // 第一步：注册Service Worker，开启离线缓存功能
    let swRegistration = null;
    if ('serviceWorker' in navigator) {
        try {
            swRegistration = await navigator.serviceWorker.register('Rua_de_macau_Photos_file/js/offlinecache.js');
            console.log('Service Worker 注册成功，离线缓存已开启');
        } catch (error) {
            console.error('Service Worker 注册失败（不影响照片浏览）：', error);
        }
    }

    // 第二步：自动解析GitHub Pages目录中的照片列表
    async function parsePagesPhotoList() {
        try {
            // 发起请求，设置5秒超时避免国内网络卡顿
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(CONFIG.pagesUrl, {
                mode: 'cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Pages目录访问失败 [${response.status}]`);
            }

            // 解析HTML，提取jpg/png/jpeg格式的照片文件名
            const html = await response.text();
            const imgRegex = /href="([^"]+\.(jpg|png|jpeg))"/gi;
            const photoFiles = new Set(); // 用Set去重
            let match;

            while ((match = imgRegex.exec(html)) !== null) {
                const fileName = match[1].split('/').pop(); // 提取纯文件名（去掉路径）
                photoFiles.add(fileName);
            }

            const photoList = Array.from(photoFiles);
            return photoList.length > 0 ? photoList : CONFIG.fallbackPhotos;
        } catch (error) {
            // 国内网络访问失败时，自动使用兜底照片列表
            console.warn('自动解析照片列表失败，切换为兜底列表：', error);
            return CONFIG.fallbackPhotos;
        }
    }

    // 第三步：初始化照片列表并通知Service Worker缓存
    async function initPhotoList() {
        elements.loading.style.display = 'flex';
        photoList = await parsePagesPhotoList();

        if (photoList.length > 0) {
            // 生成所有照片的完整URL，通知Service Worker预缓存
            const photoUrls = photoList.map(fileName => CONFIG.baseUrl + fileName);
            if (swRegistration && swRegistration.active) {
                swRegistration.active.postMessage({
                    type: 'PRECACHE_PHOTOS',
                    photoUrls: photoUrls
                });
                console.log('已通知Service Worker缓存照片：', photoUrls);
            }

            // 加载首张照片
            loadPhoto(0);
            elements.loading.style.display = 'none';
        } else {
            // 无照片时显示错误
            elements.error.style.display = 'block';
            elements.error.textContent = '未检测到任何照片文件';
            elements.loading.style.display = 'none';
        }
    }

    // 第四步：加载指定照片（含自动重试逻辑）
    function loadPhoto(index, retryCount = 0) {
        if (index < 0 || index >= photoList.length) return;

        // 重置加载状态
        elements.loading.style.display = 'flex';
        elements.currentPhoto.style.display = 'none';
        elements.error.style.display = 'none';

        // 拼接照片完整URL
        const photoUrl = CONFIG.baseUrl + photoList[index];
        elements.currentPhoto.src = photoUrl;

        // 照片加载成功
        elements.currentPhoto.onload = function() {
            elements.loading.style.display = 'none';
            elements.currentPhoto.style.display = 'block';
            elements.photoInfo.textContent = `照片：${photoList[index]} / 共 ${photoList.length} 张`;
            updateNavButtons(); // 更新按钮禁用状态
        };

        // 照片加载失败（自动重试）
        elements.currentPhoto.onerror = function() {
            if (retryCount < RETRY_CONFIG.maxRetries) {
                setTimeout(() => {
                    loadPhoto(index, retryCount + 1);
                }, RETRY_CONFIG.delay);
            } else {
                // 重试次数用尽，显示错误
                elements.loading.style.display = 'none';
                elements.error.style.display = 'block';
                elements.error.textContent = `照片「${photoList[index]}」加载失败（已重试${RETRY_CONFIG.maxRetries}次）`;
            }
        };
    }

    // 第五步：更新导航按钮的禁用状态
    function updateNavButtons() {
        elements.prevBtn.disabled = currentIndex === 0;
        elements.nextBtn.disabled = currentIndex === photoList.length - 1;
    }

    // 第六步：绑定上一张/下一张按钮的点击事件
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

    // 启动：初始化照片列表
    initPhotoList();
});
