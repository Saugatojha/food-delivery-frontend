function error(res, status, message) {
  return res.status(status).json({ error: message })
}

function badRequest(res, message = 'Bad request') {
  return error(res, 400, message)
}

function unauthorized(res, message = 'Unauthorized') {
  return error(res, 401, message)
}

function forbidden(res, message = 'Forbidden') {
  return error(res, 403, message)
}

function notFound(res, message = 'Not found') {
  return error(res, 404, message)
}

function conflict(res, message = 'Conflict') {
  return error(res, 409, message)
}

function serverError(res, message = 'Internal server error') {
  return error(res, 500, message)
}

module.exports = { error, badRequest, unauthorized, forbidden, notFound, conflict, serverError }
