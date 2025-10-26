import { useState, useEffect } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import astroService from '../api/apiClient';

function HistoryCard({data, onSelect}) {
  return (
    <div>
      <button className="btn btn-outline-primary" onClick={() => onSelect(data)}>
        {data.nameComet}
      </button>
    </div>
  );
}

function History({onSelect}) {
  const [history, setHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true); 
    setError(null);
    
    try {
      const response = await astroService.getHistory();
      if (!response.ok) {
        throw new Error('Произошла ошибка при загрузке данных. Статус: ' + response.status);
      }
      setHistory((await response.json()).reverse());
    } catch (e) {
      console.error("Ошибка при загрузке истории:", e);
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (error) {
    return <div>Ошибка: {error.message || 'Неизвестная ошибка'}</div>;
  }

  return (
    <div>
      <button 
        className="btn btn-primary w-100 mb-5" 
        onClick={fetchHistory}
        disabled={isLoading}
      >
          <i className="bi bi-arrow-repeat"></i> Обновить
      </button>

      {history && Array.isArray(history) && history.length > 0 && history.map((data) => (
          <div key={data.id} className="mb-2">
            <HistoryCard data={data} onSelect={onSelect} />
          </div>
        ))
      }
    </div>
  );
}

export default History;