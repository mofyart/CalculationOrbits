import 'bootstrap/dist/css/bootstrap.min.css';

function Header({title}) {
    return (
        <div className="container">
            {title}
        </div>
    );
}

export default Header;