import OrbitVisualization from './OrbitVisualization';

import 'bootstrap/dist/css/bootstrap.min.css';

function Orbit({ data }) {
    return (
        <div>
            <div className="row">
                <div className="col-6">
                    <tt className="d-block">
                        A = {data.largeSemiAxis}
                    </tt>

                    <tt className="d-block">
                        E = {data.eccentricity}
                    </tt>

                    <tt className="d-block">
                        I = {data.inclination}
                    </tt>

                    <tt className="d-block">
                        &Omega; = {data.longitude}
                    </tt>

                    <tt className="d-block">
                        &omega; = {data.pericenter}
                    </tt>

                    <tt className="d-block">
                        &nu; = {data.trueAnomaly}
                    </tt>
                </div>

                <div className="col-6">
                    <tt className="d-block">
                        Минимальное расстояние = {data.minDistance}
                    </tt>

                    <tt className="d-block">
                        Дата сближения = {data.minApproximationDate}
                    </tt>
                </div>
            </div>

            <div className="my-5">
                <OrbitVisualization cometParams={data}/>
            </div>
        </div>
    );
}

export default Orbit;
