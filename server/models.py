from sqlalchemy.types import JSON
import json
try:
  from server.app import db
except:
  from app import db

class Groups(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(120), unique=True, nullable=False)
  phone_number = db.Column(db.String(12), nullable=False)
  chats = db.Column(JSON, default=[])

  def as_dict(self):
       return {c.name: str(getattr(self, c.name)) if c.name != 'chats' else getattr(self, c.name) for c in self.__table__.columns}

class Team(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  username = db.Column(db.String(120), unique=True, nullable=False)
  first_name = db.Column(db.String(120), nullable=False)
  last_name = db.Column(db.String(120), nullable=False)

  def as_dict(self):
     return {c.name: str(getattr(self, c.name)) for c in self.__table__.columns}
