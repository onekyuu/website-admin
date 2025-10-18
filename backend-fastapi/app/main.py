from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends
from app.models.user import User
from app.db.session import engine, get_db, Base

app = FastAPI()
Base.metadata.create_all(bind=engine)

db_dependency = Annotated[Session, Depends(get_db)]


@app.get("/users/{user_id}/")
def get_user(user_id: int, db: db_dependency):
    return db.query(User).filter(User.id == user_id).first()
