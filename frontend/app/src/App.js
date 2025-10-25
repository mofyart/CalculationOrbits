import { useState } from 'react';
import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';

import Header from './components/Header';
import ObservationsForm from './components/ObservationsForm';

function RightBar() {
  return (
    <>
      <p>SideBrar Here</p>
    </>
  );
}

function Main() {

  const [orbitData, setOrbitData] = useState(null);

  const handleOrbitDataResponse = (orbitData) => {
    setOrbitData(orbitData);
  }

  return (
    <>
      <p>
        Main!
      </p>

      <ObservationsForm
        handleOrbitData={handleOrbitDataResponse}
      />

      <div>
        {orbitData && (
          <div>
            {JSON.stringify(orbitData)}
          </div>
        )}
      </div>
    </>
  );
}

function App() {
  const title = "Astro";

  return (
    <>
      <title>{title}</title>

      <Header title={title} />

      <main className="container">
        <div className="row">
          <div className="col-2">
            <RightBar />
          </div>

          <div className="col-10">
            <Main />
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
