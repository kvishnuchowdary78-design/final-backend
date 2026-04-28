const { parentPort, workerData } = require('worker_threads');

function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

const result = fib(workerData.num);

parentPort.postMessage(result);