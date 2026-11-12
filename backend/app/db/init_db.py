from app.db.session import engine, Base
import app.models  # Ensure all models are registered with Base.metadata

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
    print("Database tables initialized successfully.")
