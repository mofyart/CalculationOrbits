import 'bootstrap/dist/css/bootstrap.min.css';

import { useState } from 'react';

import Header from './components/Header';
import ObservationsForm from './components/ObservationsForm/ObservationsForm';
import Orbit from './components/OrbitData';
import History from './components/History';

function App() {
  const title = "Don't look up";

  const [initialData, setInitialData] = useState(null);
  const [orbitData, setOrbitData] = useState(null);

  return (
    <div>
      <title>{title}</title>
      <Header title={title} />
      
      <main className="container">
        <div className="row">
          <div className="col-2">
            <History onSelect={setInitialData} />
          </div>

          <div className="col-10">
            <div>
              <ObservationsForm
                handleOrbitData={setOrbitData}
                initialData={initialData}
              />

              {orbitData && (
                <div className="mt-5">
                  <Orbit data={orbitData} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
