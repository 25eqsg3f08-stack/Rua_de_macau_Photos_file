document.addEventListener('DOMContentLoaded', function() {
    // 1. 配置：图片仓库信息
    const PHOTO_REPO = {
        owner: '25eqsg3f08-stack', // 替换为你的GitHub用户名
        name: 'Rua_de_macau_Photos', // 图片仓库名
        baseUrl: 'https://25eqsg3f08-stack.github.io/Rua_de_macau_Photos/' // 图片仓库Pages地址
    };

    // 2. DOM 元素（添加存在性检查）
    const currentPhoto = document.getElementById('current-photo');
    const photoLoading = document.getElementById('photo-loading');
    const photoError = document.getElementById('photo-error');
    const photoInfo = document.getElementById('photo-info');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const downloadBtn = document.getElementById('download-btn');
    const downloadCount = document.getElementById('download-count');

    // 检查核心DOM元素是否存在
    if (!currentPhoto || !photoLoading || !photoError || !photoInfo || !prevBtn || !nextBtn || !downloadBtn || !downloadCount) {
        console.error('核心DOM元素缺失，无法初始化照片查看器');
        // 若有错误提示元素，可在此显示全局错误
        const globalError = document.getElementById('global-error');
        if (globalError) {
            globalError.textContent = '页面元素加载异常，请刷新重试';
            globalError.style.display = 'block';
        }
        return;
    }

    let photoList = []; // 自动获取的照片列表
    let currentIndex = 0; // 当前显示的照片索引
    let downloadData = JSON.parse(localStorage.getItem('photoDownload')) || {
        date: new Date().toDateString(),
        remaining: 10
    };

    // 检查日期，重置下载次数
    if (downloadData.date !== new Date().toDateString()) {
        downloadData = {
            date: new Date().toDateString(),
            remaining: 10
        };
        localStorage.setItem('photoDownload', JSON.stringify(downloadData));
    }

    // 更新下载状态
    function updateDownloadStatus() {
        if (downloadCount) {
            downloadCount.textContent = `今日剩余下载次数：${downloadData.remaining}`;
        }
        const hasPhoto = currentPhoto.src && currentPhoto.style.display !== 'none';
        if (downloadBtn) {
            downloadBtn.disabled = !(hasPhoto && downloadData.remaining > 0);
        }
    }

    // 下载照片
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (!currentPhoto.src || downloadData.remaining <= 0) return;

            const photoNameMatch = photoInfo.textContent.match(/照片：(.+) \//);
            const photoName = photoNameMatch ? photoNameMatch[1] : 'macau-photo';

            const link = document.createElement('a');
            link.href = currentPhoto.src;
            link.download = photoName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            downloadData.remaining--;
            localStorage.setItem('photoDownload', JSON.stringify(downloadData));
            updateDownloadStatus();
            alert(`下载成功！剩余次数：${downloadData.remaining}`);
        });
    }

    // 3. 从GitHub API获取照片列表
    async function getPhotos() {
        try {
            // GitHub API：获取图片仓库根目录文件
            const apiUrl = `https://api.github.com/repos/${PHOTO_REPO.owner}/${PHOTO_REPO.name}/contents/`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('获取照片失败，HTTP状态码：' + response.status);

            const files = await response.json();
            // 筛选出.jpg/.jpeg/.png格式的照片
            const photos = files
                .filter(file => file.type === 'file')
                .filter(file => {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    return ['jpg', 'jpeg', 'png'].includes(ext);
                })
                .map(file => file.name); // 只保留文件名

            // 按文件名排序（按拍摄时间，如IMG_20251102_124457.jpg）
            photos.sort();
            return photos;
        } catch (err) {
            if (photoError) {
                photoError.style.display = 'block';
                photoError.textContent = '加载照片列表失败，请检查网络或仓库配置';
            }
            console.error('获取照片列表错误：', err);
            return [];
        }
    }

    // 4. 加载指定照片
    function loadPhoto(index) {
        if (index < 0 || index >= photoList.length) return;

        if (photoLoading) {
            photoLoading.style.display = 'flex';
        }
        if (currentPhoto) {
            currentPhoto.style.display = 'none';
        }
        if (photoError) {
            photoError.style.display = 'none';
        }

        const photoUrl = PHOTO_REPO.baseUrl + photoList[index];
        if (currentPhoto) {
            currentPhoto.src = photoUrl;
        }

        // 加载成功
        if (currentPhoto) {
            currentPhoto.onload = function() {
                if (photoLoading) {
                    photoLoading.style.display = 'none';
                }
                if (currentPhoto) {
                    currentPhoto.style.display = 'block';
                }
                if (photoInfo) {
                    photoInfo.textContent = `照片：${photoList[index]} / 共 ${photoList.length} 张`;
                }
                updateNavButtons();
                updateDownloadStatus();
            };
        }

        // 加载失败
        if (currentPhoto) {
            currentPhoto.onerror = function() {
                if (photoLoading) {
                    photoLoading.style.display = 'none';
                }
                if (photoError) {
                    photoError.style.display = 'block';
                    photoError.textContent = `照片 ${photoList[index]} 加载失败`;
                }
                updateNavButtons();
            };
        }
    }

    // 5. 更新导航按钮状态
    function updateNavButtons() {
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex === photoList.length - 1;
        }
    }

    // 6. 绑定导航按钮事件
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                loadPhoto(currentIndex);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < photoList.length - 1) {
                currentIndex++;
                loadPhoto(currentIndex);
            }
        });
    }

    // 7. 初始化：获取照片并加载第一张
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
