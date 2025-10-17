from sqlalchemy import Column, Integer, String
from database import Base


class User(Base):
    __tablename__ = "api_user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
