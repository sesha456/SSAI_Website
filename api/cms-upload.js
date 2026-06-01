const { branch, handleError, owner, putFile, repo, safeFileName, sendJson } = require('./cms-utils');
const { randomUUID } = require('crypto');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { ok: false, message: 'Method not allowed.' });
  }

  try {
    const { category, content, galleryId, name, size, type } = request.body || {};
    if (!category || !content || !name || !type) {
      return sendJson(response, 400, { ok: false, message: 'Missing upload fields.' });
    }

    const safeName = safeFileName(name);
    const path = `public/assets/uploads/${category}/${Date.now()}-${randomUUID()}-${safeName}`;
    await putFile(path, content, `Upload ${category} media: ${safeName}`);

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    return sendJson(response, 200, {
      ok: true,
      asset: {
        id: `${Date.now()}-${randomUUID()}`,
        name,
        category,
        url,
        path,
        ...(galleryId ? { galleryId } : {}),
        size: Number(size) || 0,
        type,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    return handleError(response, error);
  }
};
