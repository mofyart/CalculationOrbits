import OrbitVisualization from './OrbitVisualization';

import 'bootstrap/dist/css/bootstrap.min.css';

function Orbit({ data }) {
    return (
        <div>
            <div className="row">
                <div className="col-6">
                    <tt className="d-block">
                        A = {data.a}
                    </tt>

                    <tt className="d-block">
                        E = {data.e}
                    </tt>

                    <tt className="d-block">
                        I = {data.i}
                    </tt>

                    <tt className="d-block">
                        &Omega; = {data.Omega}
                    </tt>

                    <tt className="d-block">
                        &omega; = {data.omega}
                    </tt>

                    <tt className="d-block">
                        &nu; = {data.nu}
                    </tt>
                </div>

                <div className="col-6">
                    <tt className="d-block">
                        Минимальное расстояние = 0
                    </tt>

                    <tt className="d-block">
                        Дата = 0
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