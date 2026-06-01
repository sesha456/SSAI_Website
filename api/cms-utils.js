const owner = process.env.GITHUB_CMS_OWNER || 'sesha456';
const repo = process.env.GITHUB_CMS_REPO || 'SSAI_Website';
const branch = process.env.GITHUB_CMS_BRANCH || 'main';

function getToken() {
  const token = process.env.GITHUB_CMS_TOKEN;
  if (!token) {
    const error = new Error('GitHub CMS token is not configured.');
    error.statusCode = 500;
    throw error;
  }
  return token;
}

function sendJson(response, status, body) {
  response.status(status).json(body);
}

function safeFileName(name) {
  return String(name || 'image.jpg').toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/(^-|-$)/g, '') || 'image.jpg';
}

function encodePath(path) {
  return encodeURIComponent(path).replace(/%2F/g, '/');
}

async function githubRequest(path, init = {}) {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}${separator}ref=${encodeURIComponent(branch)}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`GitHub request failed: ${response.status} ${text}`);
    error.statusCode = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

async function getFile(path) {
  try {
    return await githubRequest(path, { method: 'GET' });
  } catch {
    return null;
  }
}

async function putFile(path, content, message) {
  const existing = await getFile(path);
  return githubRequest(path, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content,
      branch,
      ...(existing && existing.sha ? { sha: existing.sha } : {})
    })
  });
}

async function deleteFile(path, message) {
  const existing = await getFile(path);
  if (!existing || !existing.sha) return null;
  return githubRequest(path, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      sha: existing.sha,
      branch
    })
  });
}

function handleError(response, error) {
  sendJson(response, error.statusCode || 500, {
    ok: false,
    message: error.message || 'CMS request failed.'
  });
}

module.exports = {
  branch,
  deleteFile,
  handleError,
  owner,
  putFile,
  repo,
  safeFileName,
  sendJson
};
