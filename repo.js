// 读取GitHub私密仓库根目录文件列表 - 极简版
async function listGithubPrivateRepo(token, username, repo, branch = 'main') {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${username}/${repo}/contents?ref=${branch}`,
      { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('读取失败:', err);
    return null;
  }
}

// 使用示例（替换为你的信息）
const PAT = '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';
listGithubPrivateRepo(PAT, '25eqsg3f08-stack', 'Rua_de_macau_Photos').then(fileList => {
  if (fileList) console.log('仓库根目录文件:', fileList);
});


