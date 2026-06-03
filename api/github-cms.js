const allowedMethods = new Set(['GET', 'PUT', 'DELETE']);

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).send('Method not allowed');
    return;
  }

  const token = process.env.GITHUB_CMS_TOKEN;
  if (!token) {
    response.status(500).send('GITHUB_CMS_TOKEN is not configured on Vercel.');
    return;
  }

  const { owner, repo, branch, path, init } = request.body ?? {};
  const method = init?.method ?? 'GET';
  if (!owner || !repo || !branch || !path || !allowedMethods.has(method)) {
    response.status(400).send('Invalid GitHub CMS request.');
    return;
  }

  const separator = String(path).includes('?') ? '&' : '?';
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}${separator}ref=${encodeURIComponent(branch)}`;
  const githubResponse = await fetch(url, {
    method,
    body: init?.body,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  const body = await githubResponse.text();
  response.status(githubResponse.status);
  response.setHeader('Content-Type', githubResponse.headers.get('content-type') || 'application/json');
  response.send(body);
}
