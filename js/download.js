document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('download-btn');
    const currentPhoto = document.getElementById('current-photo');
    const downloadCount = document.getElementById('download-count');
    const photoInfo = document.getElementById('photo-info');

    // 下载次数（本地存储，按天重置）
    let downloadData = JSON.parse(localStorage.getItem('photoDownload')) || {
        date: new Date().toDateString(),
        remaining: 10
    };

    // 检查日期，重置次数
    if (downloadData.date !== new Date().toDateString()) {
        downloadData = {
            date: new Date().toDateString(),
            remaining: 10
        };
        localStorage.setItem('photoDownload', JSON.stringify(downloadData));
    }

    // 更新下载状态
    function updateDownloadStatus() {
        downloadCount.textContent = `今日剩余下载次数：${downloadData.remaining}`;
        const hasPhoto = currentPhoto.src && currentPhoto.style.display !== 'none';
        downloadBtn.disabled = !(hasPhoto && downloadData.remaining > 0);
    }

    // 下载照片
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

    // 照片加载时更新下载按钮
    currentPhoto.addEventListener('load', updateDownloadStatus);
    updateDownloadStatus();
});


