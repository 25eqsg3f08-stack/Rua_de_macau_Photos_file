// 全局暴露读取 GitHub 私密仓库内容的函数
// 参数说明：
// token: GitHub 个人访问令牌（需勾选 repo 权限）
// username: 仓库所有者用户名
// repo: 仓库名称
// branch: 仓库分支，默认 main
window.listGithubPrivateRepo = async function(token, username, repo, branch = 'main') {
    try {
        // 1. 前置参数校验，避免空值/非法值导致的请求错误
        if (!token || typeof token !== 'string') {
            throw new Error('GitHub 令牌为空或格式错误（必须是字符串）');
        }
        if (!username || !repo) {
            throw new Error('仓库所有者/仓库名称不能为空');
        }

        // 2. 对令牌进行合规处理：去除首尾空格+编码特殊字符（防止非ISO-8859-1字符）
        const validToken = encodeURIComponent(token.trim());
        // 拼接 GitHub Contents API 请求地址
        const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents?ref=${branch}`;
        
        // 3. 发起 GET 请求（严格遵循请求头格式）
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `token ${validToken}`, // token后必须有一个英文空格
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json; charset=utf-8' // 明确编码，避免解析错误
            },
            mode: 'cors' // 处理跨域（GitHub API 支持CORS）
        });

        // 4. 细化 HTTP 错误提示
        if (!response.ok) {
            let errorMsg = `GitHub API 请求失败 [${response.status}]`;
            switch (response.status) {
                case 401:
                    errorMsg += '：令牌无效/权限不足（请检查PAT是否勾选repo权限）';
                    break;
                case 403:
                    errorMsg += '：API 请求次数超限/令牌被限制';
                    break;
                case 404:
                    errorMsg += '：仓库/分支不存在';
                    break;
                default:
                    errorMsg += `：${response.statusText}`;
            }
            throw new Error(errorMsg);
        }

        // 5. 返回仓库文件列表 JSON 数据
        const data = await response.json();
        return data;

    } catch (err) {
        // 分类打印错误，方便定位问题
        if (err.message.includes('non ISO-8859-1 code point')) {
            console.error('读取私密仓库失败：请求头包含非法字符，请检查令牌是否有中文/全角符号/隐藏空格', err);
        } else if (err.message.includes('Failed to fetch')) {
            console.error('读取私密仓库失败：网络错误/跨域限制', err);
        } else {
            console.error('读取私密仓库失败：', err);
        }
        return null;
    }
};