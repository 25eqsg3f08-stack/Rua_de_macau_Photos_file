// 1. 暴露全局变量（关键：放在 DOMContentLoaded 外面）
let photoList = [];
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    // 2. 配置信息（替换为你的 GitHub PAT）
    const CONFIG = {
        githubToken: '你的GitHub个人访问令牌',
        owner: '25eqsg3f08-stack',
        repo: 'Rua_de_macau_Photos',
        branch: 'main',
        baseUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/'
    };

    // 3. 获取 DOM 元素
    const elements = {
        loading: document.getElementById('loading'),
        error: document.getElementById('error'),
        currentPhoto: document.getElementById('current-photo'),
        photoInfo: document.getElementById('photo-info'),
        prevBtn: document.getElementById('prev-btn'),
        nextBtn: document.getElementById('next-btn')
    };

    // 4. 校验核心元素
    if (!Object.values(elements).every(el => el)) {
        console.error('DOM元素缺失');
        elements.error.style.display = 'block';
        elements.error.textContent = '页面元素加载异常，请刷新重试';
        elements.loading.style.display = 'none';
        return;
    }

    // 5. 获取照片列表
    async function getPhotoList() {
        try {
            const files = await window.listGithubPrivateRepo(
                CONFIG.githubToken,
                CONFIG.owner,
                CONFIG.repo,
                CONFIG.branch
            );
            if (!files) throw new Error('仓库文件列表获取失败');
            photoList = files
                .filter(file => file.type === 'file')
                .filter(file => ['jpg','jpeg','png'].includes(file.name.split('.').pop()?.toLowerCase()))
                .map(file => file.name)
                .sort();
            if (photoList.length === 0) throw new Error('仓库中未找到图片文件');
        } catch (err) {
            elements.error.style.display = 'block';
            elements.error.textContent = err.message;
            elements.loading.style.display = 'none';
        }
    }

    // 6. 加载照片
    function loadPhoto(index) {
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

            // 【新增】加载照片时，地图自动定位到对应位置
            const photoLocationMap = window.photoLocationMap;
            const macauMap = window.macauMap;
            if (photoLocationMap && macauMap && photoLocationMap[photoList[index]]) {
                const [lat, lng] = photoLocationMap[photoList[index]];
                macauMap.setView([lat, lng], 16);
            }
        };

        elements.currentPhoto.onerror = function() {
            elements.loading.style.display = 'none';
            elements.error.style.display = 'block';
            elements.error.textContent = navigator.onLine ? `照片 ${photoList[index]} 加载失败` : '无网络连接，暂无缓存照片';
        };
    }

    // 7. 更新导航按钮
    function updateNavButtons() {
        elements.prevBtn.disabled = currentIndex === 0;
        elements.nextBtn.disabled = currentIndex === photoList.length - 1;
    }

    // 8. 绑定按钮事件
    elements.prevBtn.addEventListener('click', () => currentIndex > 0 && (currentIndex--, loadPhoto(currentIndex)));
    elements.nextBtn.addEventListener('click', () => currentIndex < photoList.length - 1 && (currentIndex++, loadPhoto(currentIndex)));

    // 9. 初始化
    getPhotoList().then(() => photoList.length > 0 && loadPhoto(0));
});
