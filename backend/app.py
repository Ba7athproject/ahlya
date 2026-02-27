import uvicorn

# On importe ton instance FastAPI ('app') depuis ton fichier app/main.py
from app.main import app

# Hugging Face va exécuter ce fichier, qui lancera ton API sur le bon port
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)