from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_get_orbit():
    data = {
        "observations": [
            {
                "directAscension": "1234",
                "celestialDeclination": 1,
                "date": "1111-11-11T11:11:11"
            }
        ]
    }

    response = client.post(
        "/get_orbit",
        json=data
    )

    print(response.json())
    assert response.status_code == 200
