import { useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import astroService from '../api/apiClient';

function History() {
  const [history, setHistory] = useState(null);

  const updateHistory = async () => {
    const response = await astroService.getHistory();
    console.log(await response.json());
  }

  return (
    <div>
      <button className="btn btn-primary w-100" onClick={updateHistory}>
          <i className="bi bi-arrow-repeat"></i> Обновить
      </button>
    </div>
  );
}

export default History;