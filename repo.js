// repo.js - 全局暴露读取私密仓库的函数
window.listGithubPrivateRepo = async function(token, username, repo, branch = 'main') {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents?ref=${branch}`,
      { 
        headers: { 
          'Authorization': `token ${token}`, 
          'Accept': 'application/vnd.github.v3+json' 
        } 
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('仓库读取失败:', err);
    return null;
  }
};