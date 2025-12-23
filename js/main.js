// 全局变量
let photoList = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    // 1. 配置信息（替换为你的GitHub PAT）
    const CONFIG = {
        githubToken:
'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',
        owner: '25eqsg3f08-stack',
        repo: 'Rua_de_macau_Photos',
        branch: 'main',
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
        const errEl = document.getElementById('error');
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = '页面元素加载异常，请刷新重试';
        }
        return;
    }

    // 4. 从GitHub私密仓库获取照片列表
    async function getPhotoList() {
        try {
            const files = await window.listGithubPrivateRepo(
                CONFIG.githubToken,
                CONFIG.owner,
                CONFIG.repo,
                CONFIG.branch
            );

            if (!files) throw new Error('仓库文件列表获取失败');

            // 筛选图片文件
            photoList = files
                .filter(file => file.type === 'file')
                .filter(file => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ['jpg', 'jpeg', 'png'].includes(ext);
                })
                .map(file => file.name)
                .sort();

            if (photoList.length === 0) throw new Error('仓库中未找到图片文件');
        } catch (err) {
            elements.error.style.display = 'block';
            elements.error.textContent = err.message;
            elements.loading.style.display = 'none';
        }
    }

    // 5. 加载指定照片
    function loadPhoto(index) {
        if (index < 0 || index >= photoList.length) return;

        // 重置状态
        elements.loading.style.display = 'flex';
        elements.currentPhoto.style.display = 'none';
        elements.error.style.display = 'none';

        // 拼接照片URL
        const photoUrl = CONFIG.baseUrl + photoList[index];
        elements.currentPhoto.src = photoUrl;

        // 加载成功回调
        elements.currentPhoto.onload = function() {
            elements.loading.style.display = 'none';
            elements.currentPhoto.style.display = 'block';
            elements.photoInfo.textContent = `照片：${photoList[index]} / 共 ${photoList.length} 张`;
            updateNavButtons();
        };

        // 加载失败回调
        elements.currentPhoto.onerror = function() {
            elements.loading.style.display = 'none';
            elements.error.style.display = 'block';
            elements.error.textContent = navigator.onLine ? `照片 ${photoList[index]} 加载失败` : '无网络连接，暂无缓存照片';
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

    // 8. 初始化
    getPhotoList().then(() => {
        if (photoList.length > 0) {
            loadPhoto(0);
        }
    });
});