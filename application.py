import asyncio
from flask import Flask, Blueprint, request, send_from_directory, jsonify
import json
import os
import datetime
import json
import sys
import requests
import time
import traceback
from urllib.parse import urlparse
from dotenv import load_dotenv
from telethon.sync import TelegramClient
from telethon.tl.functions.channels import CreateChannelRequest, InviteToChannelRequest
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.types import JSON


application = Flask(__name__, static_folder='build', static_url_path='')
bp = Blueprint('api', __name__)

load_dotenv()
application.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("JAWSDB_URL")
db = SQLAlchemy(application)

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

migrate = Migrate(application, db)

TELEGRAM_API_ID = "1207385"
TELEGRAM_API_HASH = 'b577054ff6343928f95d4f0c4e081fdd'

@application.route('/', defaults={'path': ''})
@application.route('/<path>')
def index(path):
    return send_from_directory(application.static_folder, 'index.html')


# COMMON HELPERS

loop = asyncio.get_event_loop()

async def get_telegram_client(phone_number):
  session_path = f"sessions/{phone_number}"
  client = TelegramClient(session_path, TELEGRAM_API_ID, TELEGRAM_API_HASH)
  await client.connect()
  return client

def get_file(name):
  return os.path.join(app.static_folder, name)

# LOG IN FLOW

async def open_session(auth):
  phone_number = ""
  logged_in = False
  for filename in os.listdir("sessions"):
    if filename.endswith(".session"):
      client = TelegramClient("sessions/" + filename, TELEGRAM_API_ID, TELEGRAM_API_HASH)
      auth_key = client.session.auth_key.key.hex()
      await client.disconnect()
      authed = auth_key == auth
      if authed:
        phone_number = filename.split(".session")[0]
        logged_in = True
    else:
        continue
  return { "loggedIn": logged_in, "phoneNumber": phone_number }

@bp.route("/checkAuth")
def check_auth():
  auth = request.args.get('auth')
  response = loop.run_until_complete(open_session(auth))
  return response


async def send_code_request(phone_number):
#   session_path = f"sessions/{phone_number}"
#   os.chdir(sys.path[0])
#   if f"{session_path}.session" in os.listdir():
#       os.remove(f"{session_path}.session")

  try:
    client = await get_telegram_client(phone_number)
    if not await client.is_user_authorized():
        response = await client.send_code_request("+1" + phone_number)
        phone_code_hash = response.phone_code_hash
        return { "loggedIn": False, "hash": phone_code_hash }
    else:
        auth_key = client.session.auth_key.key.hex()
        return { "loggedIn": True, "auth": auth_key }
  finally:
    await client.disconnect()

@bp.route("/sendCode", methods=["POST"])
def send_code():
  data = json.loads(request.data)
  phone_number = data['phoneNumber']
  response = loop.run_until_complete(send_code_request(phone_number))
  return response


async def submit_code_request(phone_number, code, hash):
  try:
    client = await get_telegram_client(phone_number)
    await client.sign_in("+1" + phone_number, code, phone_code_hash=hash)
    auth_key = client.session.auth_key.key.hex()
    return { "loggedIn": True, "auth": auth_key }
  finally:
    await client.disconnect()


@bp.route("/submitCode", methods=["POST"])
def submit_code():
  data = json.loads(request.data)
  code = data['code']
  hash = data['hash']
  phone_number = data['phoneNumber']
  response = loop.run_until_complete(submit_code_request(phone_number, code, hash))
  return response


# GET CHATS

async def get_chat_data(phone_number):
  try:
    client = await get_telegram_client(phone_number)
    chat_data = {}
    dialogs = await client.get_dialogs(archived=False)
    dialogs = sorted(dialogs, key=lambda dialog: dialog.date, reverse=True)
    chat_data = []
    for dialog in dialogs:
      entity = dialog.entity
#       msg_ids = []
#       async for msg in client.iter_messages(entity, limit=10):
#         msg_ids.append(msg.from_id)
      if hasattr(entity, 'migrated_to') and entity.migrated_to is not None:
        # chat has been renamed/moved so ignore
        continue
      if hasattr(entity, 'broadcast') and entity.broadcast:
        if hasattr(entity, 'creator') and not entity.creator:
          continue
      id = entity.id
      name = dialog.name
      chat_data.append({ "id": id, "name": name })
    return { "chatData": chat_data }
  finally:
    await client.disconnect()

@bp.route("/chatData")
def chat_data():
  phone_number = request.args.get('phoneNumber')
  response = loop.run_until_complete(get_chat_data(phone_number))
  return response


# SEND MESSAGE

async def send_message_to_chats(phone_number, message, chats):
  try:
    client = await get_telegram_client(phone_number)

    success_ids = []
    failure_ids = []
    error_messages = {}
    for chat in chats:
        id = chat['id']
        name = chat['name']
        try:
          team = [item.as_dict() for item in Team.query.all()]
          team_ids = [member['id'] for member in team]
          entity = await client.get_input_entity(int(id))
          username = ""
          user_id = ""
          async for msg in client.iter_messages(entity, limit=10):
            from_id = msg.from_id
            if from_id and from_id not in team_ids:
              # member is not in team so at them
              user = await client.get_entity(from_id)
              username = user.username
              if not username:
                username = user.first_name
              user_id = from_id
              break
          if username:
            await client.send_message(entity, "["+username+"](tg://user?id="+str(user_id)+") " + message)
          else:
            await client.send_message(entity, message)
          success_ids.append(id)
        except:
          print(f"Failed to send message to {name}")
          traceback.print_exc()
          failure_ids.append(id)
          error_message = traceback.format_exc().splitlines()[-1]
          error_messages[id] = error_message
    return { "success_ids": success_ids, "failure_ids": failure_ids, "error_messages": error_messages }
  finally:
    await client.disconnect()

@bp.route("/sendMessage", methods=["POST"])
def send_message():
  data = json.loads(request.data)
  phone_number = data['phoneNumber']
  message = data['message']
  chats = data['chats']
  response = loop.run_until_complete(send_message_to_chats(phone_number, message, chats))
  return response

if __name__ == '__main__':
    app.run()


# TEAM

@bp.route("/team")
def team():
  team = [item.as_dict() for item in Team.query.all()]
  return { "team": team }


async def add_member_to_team(phone_number, username):
  try:
    client = await get_telegram_client(phone_number)
    error = False

    try:
      entity = await client.get_entity(username)
      new_member = Team(id=entity.id, username=entity.username, first_name=entity.first_name or '', last_name=entity.last_name or '')
      db.session.add(new_member)
      db.session.commit()
      team = [item.as_dict() for item in Team.query.all()]
    except:
      print(f"Failed to add member:")
      traceback.print_exc()
      error = True

    return { "error": error, "team": team }
  finally:
    await client.disconnect()

@bp.route("/addMember", methods=["POST"])
def add_member():
  data = json.loads(request.data)
  phone_number = data['phoneNumber']
  username = data['username']
  response = loop.run_until_complete(add_member_to_team(phone_number, username))
  return response


@bp.route("/removeMember", methods=["POST"])
def remove_member():
  data = json.loads(request.data)
  phone_number = data['phoneNumber']
  username = data['username']
  user = Team.query.filter_by(username=username).first()
  db.session.delete(user)
  db.session.commit()
  team = [item.as_dict() for item in Team.query.all()]
  return { "team": team }


# GROUPS


@bp.route("/groups")
def groups():
  phone_number = request.args.get('phoneNumber')
  groups = [item.as_dict() for item in Groups.query.filter_by(phone_number=phone_number).all()]
  return { "groups": groups }


@bp.route("/addGroup", methods=["POST"])
def add_group():
  data = json.loads(request.data)
  group_name = data['groupName']
  phone_number = data['phoneNumber']
  new_member = Groups(name=group_name, phone_number=phone_number, chats=[])
  db.session.add(new_member)
  db.session.commit()
  groups = [item.as_dict() for item in Groups.query.filter_by(phone_number=phone_number)]
  return { "groups": groups }

@bp.route("/removeGroup", methods=["POST"])
def remove_group():
  data = json.loads(request.data)
  group_name = data['groupName']
  phone_number = data['phoneNumber']
  group = Groups.query.filter_by(name=group_name, phone_number=phone_number).first()
  db.session.delete(group)
  db.session.commit()
  groups = [item.as_dict() for item in Groups.query.filter_by(phone_number=phone_number)]
  return { "groups": groups }

@bp.route("/addChatsToGroup", methods=["POST"])
def add_chats_to_group():
  data = json.loads(request.data)
  group_name = data['name']
  phone_number = data['phoneNumber']
  chats = data['chats']

  group = Groups.query.filter_by(name=group_name, phone_number=phone_number).first()

  group.chats.extend(chats)
  group.chats = list({v['id']:v for v in group.chats}.values()) # remove duplicates

  flag_modified(group, "chats")
  db.session.merge(group)
  db.session.commit()
  return { "group": group.as_dict() }


@bp.route("/removeChatFromGroup", methods=["POST"])
def remove_chat_from_group():
  data = json.loads(request.data)
  group_name = data['name']
  phone_number = data['phoneNumber']
  chat_id = data['chatId']

  group = Groups.query.filter_by(name=group_name, phone_number=phone_number).first()

  chat = next((x for x in group.chats if x['id'] == chat_id), None)
  group.chats.remove(chat)

  flag_modified(group, "chats")
  db.session.merge(group)
  db.session.commit()
  return { "group": group.as_dict() }


# CREATE A CHANNEL FLOW

async def create_channel_request(phone_number, channel_name):
  success = True
  try:
    client = await get_telegram_client(phone_number)
    await client(CreateChannelRequest(channel_name, "", megagroup=True))
  except:
    print(f"Failed to create channel:")
    traceback.print_exc()
    success = False
  finally:
    await client.disconnect()
  return { "success": success }

@bp.route("/createChannel", methods=["POST"])
def create_channel():
  data = json.loads(request.data)
  channel_name = data['channelName']
  phone_number = data['phoneNumber']
  response = loop.run_until_complete(create_channel_request(phone_number, channel_name))
  return response


async def add_members(phone_number, channel_name):
  success = True
  try:
    client = await get_telegram_client(phone_number)
    team = [item.as_dict() for item in Team.query.all()]
    usernames = [member['username'] for member in team]
    await client(InviteToChannelRequest(channel_name, usernames))
  except:
    print(f"Failed to add members to channel:")
    traceback.print_exc()
    success = False
  finally:
    await client.disconnect()
  return { "success": success }

@bp.route("/addMembersToChannel", methods=["POST"])
def add_members_to_channel():
  data = json.loads(request.data)
  channel_name = data['channelName']
  phone_number = data['phoneNumber']
  response = loop.run_until_complete(add_members(phone_number, channel_name))
  return response


application.register_blueprint(bp, url_prefix="/api")

if __name__ == '__main__':
    application.run()

# async def get_num_chats(phone_number):
#   try:
#     client = await get_telegram_client(phone_number)
#     chat_data = {}
#     dialogs = await client.get_dialogs(archived=False)
#     dialogs = sorted(dialogs, key=lambda dialog: dialog.date, reverse=True)
#     chat_data = []
#     for dialog in dialogs:
#       if len(chat_data) == 10:
#         break
#       num_chats = 0
#       name = dialog.name
#       if not any([item in name for item in ["Alchemy +", "+ Alchemy", "<> Alchemy", "Alchemy <>"]]):
#         continue
#       entity = dialog.entity
#       id = entity.id
#
#       if hasattr(entity, 'migrated_to') and entity.migrated_to is not None:
#         # chat has been renamed/moved so ignore
#         continue
#       if hasattr(entity, 'broadcast') and entity.broadcast:
#         if hasattr(entity, 'creator') and not entity.creator:
#           continue
#
#       two_months_ago = (datetime.date.today() - datetime.timedelta(2*365/12))
#       start_id = -1
#       async for msg in client.iter_messages(entity, limit=1, offset_date=two_months_ago):
#         print(msg)
#         start_id = msg.id
#       async for msg in client.iter_messages(entity, min_id=start_id):
#         num_chats += 1
#       chat_data.append({ "id": id, "name": name, "numChats": num_chats })
#
#     chat_data = sorted(chat_data, key=lambda chat: chat['numChats'], reverse=True)
#     return { "chatData": chat_data }
#   finally:
#     await client.disconnect()
#
# @bp.route("/numChats")
# def num_chats():
#   phone_number = request.args.get('phoneNumber')
#   response = loop.run_until_complete(get_num_chats(phone_number))
#   return response


