import 'bootstrap/dist/css/bootstrap.min.css';

import { useState } from 'react';

import Header from './components/Header';
import ObservationsForm from './components/ObservationsForm/ObservationsForm';
import Orbit from './components/OrbitData';
import History from './components/History';

function Main() {
  const [orbitData, setOrbitData] = useState(null);

  return (
    <div>
      <ObservationsForm
        handleOrbitData={setOrbitData}
      />

      {orbitData && (
        <div className="mt-5">
          <Orbit data={orbitData} />
        </div>
      )}
    </div>
  );
}

function App() {
  const title = "astro";

  return (
    <div>
      <title>{title}</title>
      <Header title={title} />
      
      <main className="container">
        <div className="row">
          <div className="col-2">
            <History />
          </div>

          <div className="col-10">
            <Main />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
