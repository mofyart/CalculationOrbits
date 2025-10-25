import OrbitVisualization from './OrbitVisualization';

import 'bootstrap/dist/css/bootstrap.min.css';

function Orbit({ data }) {
    return (
        <div>
            <p>
                Рассчитанные параметры:
            </p>

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

            <tt className="d-block">
                Datetime = {data.epoch}
            </tt>

            <OrbitVisualization cometParams={data}/>
        </div>
    );
}

export default Orbit;