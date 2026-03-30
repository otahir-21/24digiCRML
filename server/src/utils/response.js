function success(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

function fail(res, message, code, status = 400) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      message,
      code,
    },
  });
}

module.exports = { success, fail };

