import { useState, useRef } from 'react';

import './ObservationsForm.css'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function ObservationInput({ index, onChange, onDelete }) {
  return (
    <div className="row mb-1">
        <div className="col-3">
            <input
                className="Observation-Input-Coordinates w-100"
                type="text"
                name="directАscension"
                onChange={(e) => onChange(index, e)}
            >
            </input>
        </div>

        <div className="col-3">
            <input
                className="Observation-Input-Coordinates w-100"
                type="text"
                name="celestialDeclination"
                onChange={(e) => onChange(index, e)}
            >
            </input>
        </div>

        <div className="col-5">
            <input
                className="Observation-Input-Datetime w-100"
                type="datetime-local"
                name="date"
                onChange={(e) => onChange(index, e)}
                step="1"
            >
            </input>
        </div>

        <div className="col-1">
            <button onClick={() => onDelete(index)}>
                <i className="bi bi-trash"></i>
            </button>
        </div>
    </div>
  );
}

function ObservationsForm({ handleOrbitData }) {
    const rowId = useRef(0);

    const createRow = () => ({
        id: rowId.current++,
        directАscension: '',
        celestialDeclination: '',
        date: '',
    });

    const addRow = () => {
        setRows([...rows, createRow()]);
    };

    const removeRow = (index) => {
        const updatedRows = rows.filter((_, i) => i !== index);
        setRows(updatedRows);
    };

    const [rows, setRows] = useState(Array.from({length: 5}, createRow));

    const handleChange = (index, e) => {
        const { name, value } = e.target;
        const updatedRows = rows.map((row, i) => {
            if (i === index) {
                return { ...row, [name]: value };
            }
            return row;
        });
        setRows(updatedRows);
    };

    const getJson = () => {
        return JSON.stringify({
            "observations": rows.map(({id, ...rest}) => rest)
        });
    }

    const performCalculations = async () => {
        const data = getJson();

        const response = await fetch('api/get_orbit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: data,
        });

        // Hello World

        // const response = {
        //     "a": 1.505173,
        //     "e": 0.086673,
        //     "i": 1.8473,
        //     "Omega": 49.4706,
        //     "omega": 286.0646,
        //     "nu": 23.4665,
        //     "epoch": "2000-01-01 00:00:00.000",
        // };

        const calculatedData = await response.json();
        console.log(calculatedData);
        handleOrbitData(calculatedData);
    }

    return (
        <>
            <div>
                {rows.map((row, index) => (
                    <div key={row.id} className="mb-3">
                        <ObservationInput
                            index={index}
                            onChange={handleChange}
                            onDelete={removeRow}
                        />
                    </div>
                ))}

                <div className="col-12 mb-3">
                    <button className="w-100" onClick={addRow}>+</button>
                </div>
                
                <button onClick={() => {performCalculations()}}>
                    Рассчитать орбиту
                </button>
            </div>
        </>
    );
}

export default ObservationsForm;