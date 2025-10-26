import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function ObservationInput({ index, onChange, onDelete, errors, values, canDelete }) {
  return (
    <div className="row mb-1">
        <div className="col-3">
            <input
                className={`form-control w-100 ${errors?.directAscension ? 'is-invalid': ''}`}
                type="text"
                name="directAscension"
                value={values.directAscension}
                onChange={(e) => onChange(index, e)}
            />
            {errors?.directAscension && <div className="invalid-feedback d-block">{errors.directAscension}</div>}
        </div>

        <div className="col-3">
            <input
                className={`form-control w-100 ${errors?.directAscension ? 'is-invalid': ''}`}
                type="text"
                name="celestialDeclination"
                value={values.celestialDeclination}
                onChange={(e) => onChange(index, e)}
            />
            {errors?.celestialDeclination && <div className="invalid-feedback d-block">{errors.celestialDeclination}</div>}
        </div>

        <div className="col-5">
            <input
                className={`form-control w-100 ${errors?.directAscension ? 'is-invalid': ''}`}
                type="datetime-local"
                name="date"
                value={values.date}
                onChange={(e) => onChange(index, e)}
                max="9999-12-31T23:59:59"
                step="1"
            />
            {errors?.date && <div className="invalid-feedback d-block">{errors.date}</div>}
        </div>

        <div className="col-1 text-end">
            <button className={`btn btn-danger rounded-3 ${canDelete ? '' : 'disabled'}`} onClick={() => onDelete(index)}>
                <i className="bi bi-trash"></i>
            </button>
        </div>
    </div>
  );
}

export default ObservationInput;
