export function createMessageQueue({ intervalMs, logger }) {
  const queue = [];
  let running = false;

  async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function processQueue() {
    if (running) return;
    running = true;

    while (queue.length) {
      const job = queue.shift();

      try {
        await job();
      } catch (error) {
        logger.error({ err: error }, 'Falha ao enviar mensagem da fila');
      }

      await wait(intervalMs);
    }

    running = false;
  }

  return {
    add(job) {
      queue.push(job);
      void processQueue();
    },
    size() {
      return queue.length;
    },
  };
}
