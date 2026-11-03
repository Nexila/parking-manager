export const asyncRoute = (handler) => (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
export const monthIsValid = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');
