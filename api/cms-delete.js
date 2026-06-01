const { deleteFile, handleError, sendJson } = require('./cms-utils');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { ok: false, message: 'Method not allowed.' });
  }

  try {
    const { path } = request.body || {};
    if (!path || typeof path !== 'string' || !path.startsWith('public/assets/uploads/')) {
      return sendJson(response, 400, { ok: false, message: 'Invalid media path.' });
    }

    await deleteFile(path, `Delete media: ${path.split('/').pop()}`);
    return sendJson(response, 200, { ok: true, message: 'Media deleted.' });
  } catch (error) {
    return handleError(response, error);
  }
};
