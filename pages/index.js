import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

// Главная страница для пинга IP или домена
export default function Home() {
  const [target, setTarget] = useState(''); // Введенный IP или домен
  const [result, setResult] = useState(null); // Результат пинга
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
        body: JSON.stringify({ target }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Ошибка при проверке: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>ASTRACAT Ping Tester</title>
        <meta name="description" content="Ping IP or domain for ASTRACAT" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>ASTRACAT Ping Tester</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Введите IP или домен (например, 85.209.2.112 или pubgmobile.com)"
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
                    <td>Введенный адрес</td>
                    <td>{result.target}</td>
                  </tr>
                  <tr>
                    <td>Резолвленный IP</td>
                    <td>{result.resolvedIp || 'Н/Д'}</td>
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
