import 'bootstrap/dist/css/bootstrap.min.css';
import logo from "./logo.svg"

function Header({title}) {
    return (
        <div className="d-flex container mb-3 align-items-center">
            <img src={logo} className="me-3" alt="logo" width="50px"/>
            <span className="fs-3">
                {title}
            </span>
        </div>
    );
}

export default Header;