<img width="1920" height="1080" alt="screenshot" src="https://github.com/user-attachments/assets/2cab2c10-9ecd-4ac2-8b11-57354659782a" />



minimal fastapi webauth app

for run:
        
        local:
            pip install -r requirements.txt
            uvicorn main:app --reload

        on server:
            uvicorn main:app --host 0.0.0.0 --port $PORT
            
