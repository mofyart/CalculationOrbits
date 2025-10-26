import { useState, useRef, useEffect } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import ImageUploader from './ImageUploader';
import ObservationInput from './ObservationInput';

import astroService from '../../api/apiClient';

function validateRow(row) {
  const errors = {};

  if (!row.directAscension.trim()) {
    errors.directAscension = 'Пустое поле';
  }

  if (!row.celestialDeclination.trim()) {
    errors.celestialDeclination = 'Пустое поле';
  }

  if (!row.date) {
    errors.date = 'Пустое поле';
  } else {
    const d = new Date(row.date);

    if (isNaN(d.getTime())) {
      errors.date = 'Некорректный формат';
    }
  }

  return errors;
}

function ObservationsForm({ handleOrbitData, initialData, onDataSubmit }) {
    const rowId = useRef(0);
    const minRowsCount = 5;

    const createRow = () => ({
        id: rowId.current++,
        directAscension: '',
        celestialDeclination: '',
        date: '',
    });

    const addRow = () => {
        setRows([...rows, createRow()]);
        setErrorsList([...errorsList, {}]);
    };

    const removeRow = (index) => {
        if (rows.length <= minRowsCount) {
            return;
        }

        const updatedRows = rows.filter((_, i) => i !== index);
        setRows(updatedRows);
        const updatedErrors = errorsList.filter((_, i) => i !== index);
        setErrorsList(updatedErrors);
    };

    const [nameComet, setName] = useState('Без названия');
    const [rows, setRows] = useState(Array.from({length: minRowsCount}, createRow));

    const [errorsList, setErrorsList] = useState(Array(minRowsCount).fill({}));
    const [nameEmptyError, setNameEmptyError] = useState(null);

    const handleChange = (index, e) => {
        const { name, value } = e.target;
        const updatedRows = rows.map((row, i) => {
            if (i === index) {
                return { ...row, [name]: value };
            }
            return row;
        });
        setRows(updatedRows);

        const updatedErrors = [...errorsList];
        if (updatedErrors[index] && updatedErrors[index][name]) {
            delete updatedErrors[index][name];
            setErrorsList(updatedErrors);
        }
    };

    const getJson = () => {
        return JSON.stringify({
            "nameComet": nameComet,
            "observations": rows.map(({id, ...rest}) => rest)
        });
    }

    const performCalculations = async () => {
        const newErrorsList = rows.map(validateRow);
        setErrorsList(newErrorsList);
        const isFormValid = newErrorsList.every(errors => Object.keys(errors).length === 0);

        if (!nameComet.trim()) {
            setNameEmptyError("Пустое поле");
            return;
        }

        if (!isFormValid) {
            return;
        }

        const data = getJson();

        const response = await astroService.getOrbitData(data);
        const orbitData = await response.json();

        // const response = {
        //     "a": 1.505173,
        //     "e": 0.086673,
        //     "i": 1.8473,
        //     "Omega": 49.4706,
        //     "omega": 286.0646,
        //     "nu": 23.4665,
        //     "epoch": "2000-01-01 00:00:00.000",
        // };

        if (onDataSubmit) {
            onDataSubmit();
        }

        handleOrbitData(orbitData);
    }

    useEffect(() => {
        if (initialData) {
            setName(initialData.nameComet);
            const initialRows = initialData.observations.map(obs => ({
                id: rowId.current++,
                ...obs
            }));
            setRows(initialRows);
            setErrorsList(Array(initialRows.length).fill({}));
            handleOrbitData(initialData.orbitalCharestic);
        }
    }, [initialData]); // Эффект сработает при изменении initialData

    return (
        <>
            <div className="mb-5">
                <div className="col-3">
                    <span className="fw-bold">Название</span>
                </div>
                <input
                    className={`d-block form-control w-100 ${nameEmptyError ? 'is-invalid': ''}`}
                    type="text"
                    name="nameComet" onChange={(e) => {setName(e.target.value); setNameEmptyError(null)}} value={nameComet} />
                {nameEmptyError && <div className="invalid-feedback d-block">{nameEmptyError}</div>}
            </div>

            <ImageUploader />

            <div className="row mb-3">
                <div className="col-3">
                    <span className="fw-bold">Восхождение</span>
                </div>
                <div className="col-3">
                    <span className="fw-bold">Склонение</span>
                </div>
                <div className="col-6">
                    <span className="fw-bold">Дата и время</span>
                </div>
            </div>
            <div>
                {rows.map((row, index) => (
                    <div key={row.id} className="mb-3">
                        <ObservationInput
                            index={index}
                            onChange={handleChange}
                            onDelete={removeRow}
                            errors={errorsList[index]}
                            values={row}
                            canDelete={rows.length > minRowsCount}
                        />
                    </div>
                ))}

                <div className="col-12 mb-3">
                    <button className="btn btn-outline-primary w-100" onClick={addRow}>+</button>
                </div>

                <button className="btn btn-primary" onClick={() => {performCalculations()}}>
                    Рассчитать орбиту
                </button>
            </div>
        </>
    );
}

export default ObservationsForm;
