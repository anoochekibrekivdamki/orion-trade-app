from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(200), nullable=False)
    name = Column(String(1000), nullable=False)

    def __repr__(self):
        return f"<User {self.email}>"
