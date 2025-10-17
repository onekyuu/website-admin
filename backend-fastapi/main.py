from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends
import models
from database import engine, SessionLocal
from pydantic import BaseModel

app = FastAPI()
models.Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()
