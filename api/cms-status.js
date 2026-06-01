const { sendJson } = require('./cms-utils');

module.exports = async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { ok: false, message: 'Method not allowed.' });
  }

  return sendJson(response, 200, {
    ok: true,
    configured: Boolean(process.env.GITHUB_CMS_TOKEN)
  });
};
