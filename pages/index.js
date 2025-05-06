import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

// Главная страница для проверки VPN-конфигураций
export default function Home() {
  const [config, setConfig] = useState(''); // Введенный конфиг
  const [result, setResult] = useState(null); // Результат проверки
  const [loading, setLoading] = useState(false); // Состояние загрузки

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Ошибка при проверке конфига: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>ASTRACAT VPN Config Tester</title>
        <meta name="description" content="Test VLESS and SOCKS configurations for ASTRACAT VPN" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>ASTRACAT VPN Config Tester</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            placeholder="Введите конфиг (VLESS или SOCKS)"
            className={styles.input}
            required
          />
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Проверка...' : 'Проверить'}
          </button>
        </form>

        {result && (
          <div className={styles.result}>
            {result.error ? (
              <p className={styles.error}>{result.error}</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Параметр</th>
                    <th>Значение</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Статус</td>
                    <td>{result.status}</td>
                  </tr>
                  <tr>
                    <td>Пинг</td>
                    <td>{result.ping ? `${result.ping} ms` : 'Н/Д'}</td>
                  </tr>
                  <tr>
                    <td>IP</td>
                    <td>{result.ip}</td>
                  </tr>
                  <tr>
                    <td>Порт</td>
                    <td>{result.port}</td>
                  </tr>
                  <tr>
                    <td>SNI</td>
                    <td>{result.sni || 'Н/Д'}</td>
                  </tr>
                  <tr>
                    <td>Тип</td>
                    <td>{result.type}</td>
                  </tr>
                  <tr>
                    <td>Имя</td>
                    <td>{result.name || 'Н/Д'}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
