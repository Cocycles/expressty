/**
 * default messages by httpCode
 * @type {{200: string, 500: string, 400: string, 404: string, 201: string, 502: string,
 * 403: string, 401: string, 301: string, 405: string, 204: string}}
 */
const defaultMessages = {
  200: 'ok',
  500: 'internal server error',
  400: 'bad request',
  404: 'resource not found',
  201: 'created',
  502: 'bad gateway',
  403: 'forbidden',
  401: 'unauthorized',
  301: 'not modified',
  405: 'method not allowed',
  204: 'no content',
  406: 'not acceptable'
};

/**
 *
 * @param {Object} body
 * @param {Array} mandatoryProps
 * @returns {Array}
 */
function filterMandatoryProps(body, mandatoryProps) {
  return mandatoryProps.filter((val) => !body.hasOwnProperty(val));
}

function composeValidation(body, mandatoryProps) {
  const missing = filterMandatoryProps(body, mandatoryProps);

  if (missing.length === 0) return null;

  return missing.join(', ');
}

/**
 *
 * @param httpCode
 * @param payload
 * @param message
 * @param responseCode
 * @returns {{code: *, message: *, payload: (*|null)}}
 */
function generateResponseObject(httpCode, payload, message, responseCode) {
  if (!httpCode) {
    throw new Error('cannot generate response object without httpCode');
  }

  return {
    code: responseCode || httpCode,
    message: message || defaultMessages[httpCode],
    payload: payload === undefined ? null : payload
  };
}

/**
 * Expressty middleware
 * @param req
 * @param res
 * @param next
 */
function expressty(req, res, next) {
  function respond(httpCode, payload, message, responseCode, jsonp) {
    if (jsonp) {
      res.jsonp(httpCode, generateResponseObject(httpCode, payload, message, responseCode));
      return;
    }

    res.json(httpCode, generateResponseObject(httpCode, payload, message, responseCode));
  }

  /**
   * Returns 200 ok response
   * @param {object} payload
   * @param {string} message
   * @param {number} httpCode
   * @param {number} responseCode
   * @param {boolean} jsonp
   */
  res.ok = function (payload, message, httpCode, responseCode, jsonp) {
    httpCode = httpCode || 200;

    if (httpCode >= 300 || httpCode < 200) {
      throw new Error('cannot respond ok with httpCode different from 2xx');
    }

    respond(httpCode, payload, message, responseCode, jsonp);
  };

  /**
   * Return 404 resource not found response
   */
  res.notFound = () => respond(404);

  /**
   * return 500 error
   * @param payload
   * @param message
   * @param responseCode
   * @param jsonp
   */
  res.error = (message, responseCode, payload, jsonp) => {
    if (typeof message === 'object' && message.name === 'ValidatorError') {
      const errors = message.errors;

      message = errors[Object.keys(errors)[0]].message;
    }

    if (message) {
      message = message.toString();
    }

    respond(500, payload, message, responseCode, jsonp);
  };

  /**
   * return unauthorized message
   * @param message
   * @param jsonp
   */
  res.unauthorized = (message, jsonp) => respond(401, null, message, null, jsonp);

  res.forbidden = (message) => respond(403, null, message);

  res.notAcceptable = (message) => respond(406, null, message);

  /**
   * Validates required properties for request and returns a string of the missing props
   * @param {Array} mandatoryProps
   * @returns {*}
   */
  req.validate = (mandatoryProps) => {
    const missing = composeValidation(req.body, mandatoryProps);

    if (!missing) return true;

    res.notAcceptable(`properties ${missing} are mandatory but yet missing`);
    return false;
  };

  next();
}

expressty.validate = (properties) => {
  properties = properties || [];

  return (req, res, next) => {
    if (!req.validate(properties)) {
      return next(new Error('missing'));
    }

    next();
  };
};

expressty.validateParams = (req, res, next) => {
  const arr = [];
  const params = req.params;
  let param;

  for (param in params) {
    if (!params.hasOwnProperty(param)) {
      continue;
    }

    arr.push(params[param]);
  }

  if (!req.validateIds(arr)) {
    return next(new Error('provided param ID invalid'));
  }

  next();
};

module.exports = expressty;
