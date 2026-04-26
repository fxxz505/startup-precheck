import net from 'node:net';

export async function isPortInUse(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve(true);
        return;
      }

      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(false));
    });

    server.listen(port, host);
  });
}
