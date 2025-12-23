// 第一步：先校验 repo.js 函数是否存在
if (typeof window.listGithubPrivateRepo !== 'function') {
  console.error('repo.js 未加载或函数缺失');
  const globalError = document.getElementById('global-error');
  if (globalError) {
    globalError.textContent = '依赖文件加载失败，请检查 repo.js';
    globalError.style.display = 'block';
  }
  // 终止脚本执行，避免后续错误
  throw new Error('listGithubPrivateRepo 函数未定义');
}

document.addEventListener('DOMContentLoaded', function() {
    // 1. 配置：私密图片仓库信息 & GitHub PAT
    const PHOTO_REPO = {
        owner: '25eqsg3f08-stack',
        name: 'Rua_de_macau_Photos',
        baseUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/',
        branch: 'main'
    };
    const GITHUB_PAT = '你的GitHub个人访问令牌'; // 替换为实际PAT

    // 2. DOM 元素获取（保留原逻辑）
    const currentPhoto = document.getElementById('current-photo');
    const photoLoading = document.getElementById('photo-loading');
    const photoError = document.getElementById('photo-error');
    const photoInfo = document.getElementById('photo-info');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const globalError = document.getElementById('global-error');

    // 检查核心DOM元素
    if (!currentPhoto || !photoLoading || !photoError || !photoInfo || !prevBtn || !nextBtn) {
        console.error('核心DOM元素缺失');
        if (globalError) {
            globalError.textContent = '页面元素加载异常，请刷新重试';
            globalError.style.display = 'block';
        }
        return;
    }

    let photoList = []; 
    let currentIndex = 0; 

    // 3. 从私密仓库获取照片列表
    async function getPhotos() {
        try {
            const files = await window.listGithubPrivateRepo(GITHUB_PAT, PHOTO_REPO.owner, PHOTO_REPO.name, PHOTO_REPO.branch);
            if (!files) throw new Error('仓库文件列表为空');

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
            if (photoError) {
                photoError.style.display = 'block';
                photoError.textContent = '加载照片列表失败，请检查PAT或仓库配置';
            }
            console.error('获取照片列表错误：', err);
            return [];
        }
    }

    // 4. 加载指定照片（修复onload逻辑+空值防护）
    function loadPhoto(index) {
        if (index < 0 || index >= photoList.length) return;

        // 重置状态
        if (photoLoading) photoLoading.style.display = 'flex';
        if (currentPhoto) currentPhoto.style.display = 'none';
        if (photoError) photoError.style.display = 'none';

        const photoUrl = PHOTO_REPO.baseUrl + photoList[index];
        if (currentPhoto) {
            currentPhoto.src = photoUrl;

            // 加载成功
            currentPhoto.onload = function() {
                if (photoLoading) photoLoading.style.display = 'none';
                if (currentPhoto) currentPhoto.style.display = 'block';
                // 空值校验后更新信息
                if (photoInfo) {
                    photoInfo.textContent = `照片：${photoList[index]} / 共 ${photoList.length} 张`;
                }
                updateNavButtons();
            };

            // 加载失败
            currentPhoto.onerror = function() {
                if (photoLoading) photoLoading.style.display = 'none';
                if (photoError) {
                    photoError.style.display = 'block';
                    photoError.textContent = `照片 ${photoList[index]} 加载失败`;
                }
            };
        }
    }

    // 5. 更新导航按钮状态
    function updateNavButtons() {
        if (prevBtn) prevBtn.disabled = currentIndex === 0;
        if (nextBtn) nextBtn.disabled = currentIndex === photoList.length - 1;
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
            if (photoError) {
                photoError.style.display = 'block';
                photoError.textContent = '图片仓库中暂无照片';
            }
            return;
        }
        loadPhoto(0);
    }

    init();
});