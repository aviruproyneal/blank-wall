function resolveApi(path) {
  const parts = path.split('.');
  const method = parts.pop();
  const parent = parts.reduce((value, key) => value?.[key], globalThis.chrome);
  return { parent, method: parent?.[method] };
}

export function callChromeApi(path, ...args) {
  const { parent, method } = resolveApi(path);

  if (typeof method !== 'function') {
    return Promise.reject(new Error(`Blank Wall API unavailable: ${path}`));
  }

  return new Promise((resolve, reject) => {
    try {
      method.call(parent, ...args, (result) => {
        const error = globalThis.chrome.runtime.lastError;
        if (error) {
          reject(new Error(error.message));
        } else {
          resolve(result);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
