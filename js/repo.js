// 全局暴露：从 GitHub Pages 目录索引自动读取图片文件列表
window.listGithubPrivateRepo = async function(pagesUrl) {
    try {
        // 1. 请求 GitHub Pages 目录索引页面
        const response = await fetch(pagesUrl, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`Pages 目录请求失败 [${response.status}]：请检查仓库是否为公共且 Pages 已开启`);
        }

        // 2. 解析 HTML 提取图片文件名（匹配 jpg/jpeg/png）
        const html = await response.text();
        const imgRegex = /href="([^"]+\.(jpg|jpeg|png))"/gi;
        const photoFiles = [];
        let match;

        while ((match = imgRegex.exec(html)) !== null) {
            const fileName = match[1].split('/').pop(); // 提取文件名（去掉路径）
            if (!photoFiles.includes(fileName)) {
                photoFiles.push(fileName);
            }
        }

        // 3. 无图片时抛出错误
        if (photoFiles.length === 0) {
            throw new Error('Pages 目录中未找到图片文件（jpg/jpeg/png）');
        }

        // 模拟 GitHub API 返回格式，兼容原有代码逻辑
        return photoFiles.map(fileName => ({
            name: fileName,
            type: 'file'
        }));

    } catch (err) {
        console.error('自动读取仓库照片失败：', err);
        return null;
    }
};