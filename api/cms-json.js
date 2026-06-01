const { handleError, putFile, sendJson } = require('./cms-utils');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { ok: false, message: 'Method not allowed.' });
  }

  try {
    const { data, path } = request.body || {};
    if (!path || typeof path !== 'string') {
      return sendJson(response, 400, { ok: false, message: 'Missing JSON path.' });
    }
    if (!path.startsWith('public/assets/data/') || !path.endsWith('.json')) {
      return sendJson(response, 400, { ok: false, message: 'Invalid JSON path.' });
    }

    const json = JSON.stringify(data, null, 2);
    const content = Buffer.from(json, 'utf8').toString('base64');
    await putFile(path, content, `Update ${path}`);
    return sendJson(response, 200, { ok: true, message: `${path} saved.` });
  } catch (error) {
    return handleError(response, error);
  }
};
