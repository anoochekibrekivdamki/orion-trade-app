minimal fastapi webauth app

for run:
        local:
            pip install -r requirements.txt
            uvicorn main:app --reload

        on server:
            uvicorn main:app --host 0.0.0.0 --port $PORT