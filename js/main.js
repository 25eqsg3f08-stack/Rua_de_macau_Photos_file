// 1. 先引入 repo.js 的核心函数（极简版，用于读取私密仓库）
async function readGithubPrivateFile(token, username, repo, filePath, branch = 'main') {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3.raw' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.text();
  } catch (err) {
    console.error('读取失败:', err);
    return null;
  }
}

// 读取私密仓库目录列表（新增：获取目录下文件信息）
async function listGithubPrivateRepo(token, username, repo, path = '', branch = 'main') {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`,
      { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('获取目录列表失败:', err);
    return [];
  }
}

// 2. 原照片查看器逻辑 + 整合私密仓库读取
document.addEventListener('DOMContentLoaded', function() {
    // 配置：私密仓库信息 + PAT 令牌（**务必替换为你的有效 PAT**）
    const GITHUB_CONFIG = {
        token: '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', // 必须勾选 repo 权限
        owner: '25eqsg3f08-stack',
        repo: 'Rua_de_macau_Photos',
        branch: 'main'
    };
    const PHOTO_REPO = {
        baseUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/' // Pages 地址不变（用于加载图片）
    };

    // DOM 元素
    const currentPhoto = document.getElementById('current-photo');
    const photoLoading = document.getElementById('photo-loading');
    const photoError = document.getElementById('photo-error');
    const photoInfo = document.getElementById('photo-info');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // 检查核心DOM元素
    if (!currentPhoto || !photoLoading || !photoError || !photoInfo || !prevBtn || !nextBtn) {
        console.error('核心DOM元素缺失，无法初始化照片查看器');
        const globalError = document.getElementById('global-error');
        if (globalError) {
            globalError.textContent = '页面元素加载异常，请刷新重试';
            globalError.style.display = 'block';
        }
        return;
    }

    let photoList = [];
    let currentIndex = 0;

    // 3. 从私密仓库获取照片列表（替换原公开 API 调用）
    async function getPhotos() {
        try {
            // 调用私密仓库目录读取函数
            const files = await listGithubPrivateRepo(
                GITHUB_CONFIG.token,
                GITHUB_CONFIG.owner,
                GITHUB_CONFIG.repo,
                '', // 根目录
                GITHUB_CONFIG.branch
            );
            // 筛选图片文件
            const photos = files
                .filter(file => file.type === 'file')
                .filter(file => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ['jpg', 'jpeg', 'png'].includes(ext);
                })
                .map(file => file.name);
            photos.sort();
            return photos;
        } catch (err) {
            photoError.style.display = 'block';
            photoError.textContent = '加载照片列表失败，请检查 PAT 或仓库配置';
            console.error('获取照片列表错误：', err);
            return [];
        }
    }

    // 4. 加载指定照片
    function loadPhoto(index) {
        if (index < 0 || index >= photoList.length) return;

        photoLoading.style.display = 'flex';
        currentPhoto.style.display = 'none';
        photoError.style.display = 'none';

        const photoUrl = PHOTO_REPO.baseUrl + photoList[index];
        currentPhoto.src = photoUrl;

        currentPhoto.onload = function() {
            photoLoading.style.display = 'none';
            currentPhoto.style.display = 'block';
            // 显示照片信息
            if (photoInfo) {
                photoInfo.textContent = `照片：${photoList[index]} / 共 ${photoList.length} 张`;
            }
            updateNavButtons();
        };

        currentPhoto.onerror = function() {
            photoLoading.style.display = 'none';
            photoError.style.display = 'block';
            photoError.textContent = `照片 ${photoList[index]} 加载失败`;
        };
    }

    // 5. 更新导航按钮状态
    function updateNavButtons() {
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === photoList.length - 1;
    }

    // 6. 绑定导航按钮事件
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            loadPhoto(currentIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < photoList.length - 1) {
            currentIndex++;
            loadPhoto(currentIndex);
        }
    });

    // 7. 初始化
    async function init() {
        photoList = await getPhotos();
        if (photoList.length === 0) {
            photoError.style.display = 'block';
            photoError.textContent = '图片仓库中暂无照片';
            return;
        }
        loadPhoto(0);
    }

    init();
});
