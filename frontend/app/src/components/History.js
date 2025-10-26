import { useState, useEffect } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import astroService from '../api/apiClient';

function HistoryCard({data, onSelect, fetchHistory}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await astroService.deleteData(data.id);
      await fetchHistory();
    } catch (error) {
      console.error('Ошибка при удалении:', error);
      alert('Не удалось удалить объект');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <button 
        className="btn btn-outline-primary" 
        onClick={() => onSelect(data)}
        disabled={isDeleting}
      >
        {data.nameComet}
      </button>

      <button 
        className="btn btn-danger rounded-3" 
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <i className="bi bi-arrow-clockwise spinner-border spinner-border-sm"></i>
        ) : (
          <i className="bi bi-trash"></i>
        )}
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
            <HistoryCard data={data} onSelect={onSelect} fetchHistory={fetchHistory} />
          </div>
        ))
      }
    </div>
  );
}

export default History;