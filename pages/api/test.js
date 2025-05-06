import fetch from 'node-fetch';
import net from 'net';
import dns from 'dns/promises';

// API для пинга IP или домена
export default async function handler(req, res) {
  // Проверка метода запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  const { target } = req.body;
  if (!target) {
    return res.status(400).json({ error: 'IP или домен не предоставлен' });
  }

  try {
    const result = { target };
    let resolvedIp;

    // Резолвинг DNS для домена
    try {
      const addresses = await dns.lookup(target);
      resolvedIp = addresses.address;
      result.resolvedIp = resolvedIp;
    } catch (error) {
      result.resolvedIp = 'Н/Д';
    }

    // Попытка HTTP-пинга
    const startTime = Date.now();
    let ping = null;
    try {
      const protocol = resolvedIp ? 'http' : 'https'; // IP — HTTP, домен — HTTPS
      const url = `${protocol}://${target}`;
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' },
        timeout: 5000,
      });

      if (response.ok) {
        ping = Date.now() - startTime;
        result.status = 'Доступен';
        result.ping = ping;
      } else {
        throw new Error('HTTP-запрос неуспешен');
      }
    } catch (httpError) {
      // Попытка TCP-пинга, если HTTP не удался
      try {
        const port = resolvedIp ? 80 : 443; // IP — порт 80, домен — 443
        await new Promise((resolve, reject) => {
          const socket = new net.Socket();
          socket.setTimeout(5000);

          socket.on('connect', () => {
            ping = Date.now() - startTime;
            socket.destroy();
            resolve();
          });

          socket.on('timeout', () => {
            socket.destroy();
            reject(new Error('Таймаут TCP-соединения'));
          });

          socket.on('error', (err) => {
            socket.destroy();
            reject(err);
          });

          socket.connect(port, resolvedIp || target);
        });

        result.status = 'Доступен (TCP)';
        result.ping = ping;
      } catch (tcpError) {
        result.status = 'Недоступен';
        result.error = `Ошибка: ${httpError.message}, TCP: ${tcpError.message}`;
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
  }
}
