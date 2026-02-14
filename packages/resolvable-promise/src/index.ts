
export type ResolvablePromise<T> = Promise<T> & {
  resolve: (value: T) => void;
  reject: (error: any) => void;
};

export function createResolvablePromise<T = undefined>(body?: (resolve: (value: T) => void, reject: (error: any) => void) => void) {
  let resolve: (value: T) => void = () => {};
  let reject: (error: any) => void = () => {};
  let isFinished = false;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = (value) => {
      if (isFinished) return;
      _resolve(value);
      isFinished = true;
    };
    reject = (error) => {
      if (isFinished) return;
      _reject(error);
      isFinished = true;
    };
    if (body) {
      body(resolve, reject);
    }
  });
  return Object.assign(promise, {
    resolve,
    reject,
  });
}
