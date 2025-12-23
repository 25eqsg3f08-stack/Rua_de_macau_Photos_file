// 全局暴露读取 GitHub 私密仓库内容的函数
// 参数说明：
// token: GitHub 个人访问令牌（需勾选 repo 权限）
// username: 仓库所有者用户名
// repo: 仓库名称
// branch: 仓库分支，默认 main
window.listGithubPrivateRepo = async function(token, username, repo, branch = 'main') {
    try {
        // 拼接 GitHub Contents API 请求地址
        const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents?ref=${branch}`;
        
        // 发起 GET 请求
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        // 校验请求状态
        if (!response.ok) {
            throw new Error(`GitHub API 请求失败 [${response.status}]：${response.statusText}`);
        }

        // 返回仓库文件列表 JSON 数据
        return await response.json();
    } catch (err) {
        console.error('读取私密仓库失败：', err);
        return null;
    }
};