import WebSocket from 'ws';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fetch from 'node-fetch';

// API для проверки конфигураций VLESS и SOCKS
export default async function handler(req, res) {
  // Проверка метода запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }

  const { config } = req.body;
  if (!config) {
    return res.status(400).json({ error: 'Конфиг не предоставлен' });
  }

  try {
    // Парсинг конфига
    const url = new URL(config);
    const protocol = url.protocol.replace(':', '');
    const [uuid, address] = url.username ? [url.username, url.hostname] : ['', url.hostname];
    const port = url.port || (protocol === 'vless' ? 443 : 1080);
    const params = Object.fromEntries(url.searchParams);
    const name = url.hash.replace('#', '');

    const result = { ip: address, port, type: protocol, name };

    if (protocol === 'vless') {
      // Проверка VLESS через WebSocket
      const wsUrl = `wss://${address}:${port}${params.spx || '/'}?security=${params.security}&sni=${params.sni}&fp=${params.fp}`;
      const startTime = Date.now();
      let ping = null;

      try {
        const ws = new WebSocket(wsUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124' },
        });

        await new Promise((resolve, reject) => {
          ws.on('open', () => {
            ping = Date.now() - startTime;
            ws.close();
            resolve();
          });
          ws.on('error', (err) => reject(err));
          setTimeout(() => reject(new Error('Таймаут соединения')), 5000);
        });

        result.status = 'Работает';
        result.ping = ping;
        result.sni = params.sni;
      } catch (error) {
        result.status = 'Не работает';
        result.error = error.message;
      }
    } else if (protocol === 'socks') {
      // Проверка SOCKS через HTTP-запрос
      const agent = new SocksProxyAgent(`socks5://${address}:${port}`);
      const startTime = Date.now();
      let ping = null;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://api.ipify.org?format=json', {
          agent,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await response.json();
        ping = Date.now() - startTime;

        result.status = 'Работает';
        result.ping = ping;
        result.ip = data.ip;
      } catch (error) {
        result.status = 'Не работает';
        result.error = error.message;
      }
    } else {
      return res.status(400).json({ error: 'Неподдерживаемый протокол' });
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка обработки конфига: ' + error.message });
  }
}
