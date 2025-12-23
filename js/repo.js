// 全局暴露读取 GitHub 私密仓库内容的函数
window.listGithubPrivateRepo = async function(token, username, repo, branch = 'main') {
    try {
        // 调用 GitHub Contents API
        const response = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents?ref=${branch}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API 请求失败：${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (err) {
        console.error('读取私密仓库失败：', err);
        return null;
    }
};