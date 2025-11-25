export function success(data: any, message = "OK") {
  return { success: true, message, data };
}

export function failure(message = "Error", code = "ERR") {
  return { success: false, message, code };
}
