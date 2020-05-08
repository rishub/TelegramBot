import asyncio
from flask import Flask, request, send_from_directory
import json
import os
import datetime
import sys
import requests
import time
import traceback

from telethon.sync import TelegramClient
from telethon.tl.functions.channels import CreateChannelRequest, InviteToChannelRequest

app = Flask(__name__, static_folder='')

BOT_API_KEY = "1197167345:AAFriOvxhWm7qyPG1h4gMAnN2aIDe_J3OmY"
SEND_MESSAGE_API = f"https://api.telegram.org/bot{BOT_API_KEY}/sendMessage"
GET_UPDATES_API = f"https://api.telegram.org/bot{BOT_API_KEY}/getUpdates"
CHATS_FILENAME = "chats.json"
TEAM_FILENAME = "team.json"
GROUPS_FILENAME = "groups.json"
TELEGRAM_API_ID = "1207385"
TELEGRAM_API_HASH = 'b577054ff6343928f95d4f0c4e081fdd'

def get_file(name):
  return os.path.join(app.static_folder, name)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'build/index.html')

loop = asyncio.get_event_loop()

# COMMON HELPERS

async def get_telegram_client(phone_number):
  session_path = f"sessions/{phone_number}"
  client = TelegramClient(session_path, TELEGRAM_API_ID, TELEGRAM_API_HASH)
  await client.connect()
  return client


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

@app.route("/checkAuth")
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

@app.route("/sendCode", methods=["POST"])
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


@app.route("/submitCode", methods=["POST"])
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

@app.route("/chatData")
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
          with open(get_file(TEAM_FILENAME)) as json_file:
            team = json.load(json_file)
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

@app.route("/sendMessage", methods=["POST"])
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

@app.route("/team")
def team():
  # Read current team from json file
  with open(get_file(TEAM_FILENAME)) as json_file:
      team = json.load(json_file)

  return { "team": team }


async def add_member_to_team(phone_number, username):
  try:
    client = await get_telegram_client(phone_number)
    error = False

    # Read current team from json file
    with open(get_file(TEAM_FILENAME)) as json_file:
        team = json.load(json_file)

    try:
      entity = await client.get_entity(username)
      user = {
        "id": entity.id,
        "username": entity.username,
        "firstName": entity.first_name,
        "lastName": entity.last_name
      }

      if user in team:
        team[team.index(user)] = user
      else:
        team.append(user)

      with open(get_file(TEAM_FILENAME),'w') as f:
        json.dump(team, f, indent=4)
    except:
      print(f"Failed to add member:")
      traceback.print_exc()
      error = True

    return { "error": error, "team": team }
  finally:
    await client.disconnect()

@app.route("/addMember", methods=["POST"])
def add_member():
  data = json.loads(request.data)
  phone_number = data['phoneNumber']
  username = data['username']
  response = loop.run_until_complete(add_member_to_team(phone_number, username))
  return response


@app.route("/removeMember", methods=["POST"])
def remove_member():
  data = json.loads(request.data)
  phone_number = data['phoneNumber']
  username = data['username']
  # Read current team from json file
  with open(get_file(TEAM_FILENAME)) as json_file:
      team = json.load(json_file)
  item = next((x for x in team if x['username'] == username), None)
  team.remove(item)
  with open(get_file(TEAM_FILENAME),'w') as f:
    json.dump(team, f, indent=4)
  return { "team": team }


# GROUPS


@app.route("/groups")
def groups():
  phone_number = request.args.get('phoneNumber')

  # Read current team from json file
  with open(get_file(GROUPS_FILENAME)) as json_file:
      groups = json.load(json_file)

  my_groups = [group for group in groups if group['phoneNumber'] == phone_number]

  return { "groups": my_groups }


@app.route("/addGroup", methods=["POST"])
def add_group():
  data = json.loads(request.data)
  group_name = data['groupName']
  phone_number = data['phoneNumber']
  # Read current team from json file
  with open(get_file(GROUPS_FILENAME)) as json_file:
      groups = json.load(json_file)
  groups.append({ "name": group_name, "phoneNumber": phone_number, "chats": [] })
  with open(get_file(GROUPS_FILENAME),'w') as f:
        json.dump(groups, f, indent=4)
  return { "groups": groups }

@app.route("/removeGroup", methods=["POST"])
def remove_group():
  data = json.loads(request.data)
  group_name = data['groupName']
  phone_number = data['phoneNumber']
  # Read current team from json file
  with open(get_file(GROUPS_FILENAME)) as json_file:
      groups = json.load(json_file)
  groups = [group for group in groups if not (group['name'] == group_name and group["phoneNumber"] == phone_number)]
  with open(get_file(GROUPS_FILENAME),'w') as f:
        json.dump(groups, f, indent=4)
  return { "groups": groups }

@app.route("/addChatsToGroup", methods=["POST"])
def add_chats_to_group():
  data = json.loads(request.data)
  group_name = data['name']
  phone_number = data['phoneNumber']
  chats = data['chats']

  with open(get_file(GROUPS_FILENAME)) as json_file:
      groups = json.load(json_file)

  item = next((x for x in groups if x['name'] == group_name and x['phoneNumber'] == phone_number), None)
  if not item:
    raise Exception("Invalid group")

  item["chats"].extend(chats)
  # remove duplicates
  item["chats"] = list({v['id']:v for v in item["chats"]}.values())
  with open(get_file(GROUPS_FILENAME),'w') as f:
      json.dump(groups, f, indent=4)

  return { "group": item }


@app.route("/removeChatFromGroup", methods=["POST"])
def remove_chat_from_group():
  data = json.loads(request.data)
  group_name = data['name']
  phone_number = data['phoneNumber']
  chat_id = data['chatId']

  with open(get_file(GROUPS_FILENAME)) as json_file:
      groups = json.load(json_file)

  item = next((x for x in groups if x['name'] == group_name and x['phoneNumber'] == phone_number), None)
  if not item:
    raise Exception("Invalid group")

  chat = next((x for x in item["chats"] if x['id'] == chat_id), None)
  item["chats"].remove(chat)

  with open(get_file(GROUPS_FILENAME),'w') as f:
      json.dump(groups, f, indent=4)

  return { "group": item }


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

@app.route("/createChannel", methods=["POST"])
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
    with open(get_file(TEAM_FILENAME)) as json_file:
      team = json.load(json_file)
    usernames = [member['username'] for member in team]
    await client(InviteToChannelRequest(channel_name, usernames))
  except:
    print(f"Failed to add members to channel:")
    traceback.print_exc()
    success = False
  finally:
    await client.disconnect()
  return { "success": success }

@app.route("/addMembersToChannel", methods=["POST"])
def add_members_to_channel():
  data = json.loads(request.data)
  channel_name = data['channelName']
  phone_number = data['phoneNumber']
  response = loop.run_until_complete(add_members(phone_number, channel_name))
  return response


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
# @app.route("/numChats")
# def num_chats():
#   phone_number = request.args.get('phoneNumber')
#   response = loop.run_until_complete(get_num_chats(phone_number))
#   return response



# BOT API Code below

# @app.route('/chatData')
# def chat_data():
#     # Read current chats from json file
#     with open(get_chats_json_path()) as json_file:
#         chats = json.load(json_file)
#     return chats
#
# @app.route('/sendMessage', methods=["POST"])
# def send_message():
#   data = json.loads(request.data)
#   chat_ids = data['chatIds']
#   message = data['message']
#
#   for chat_id in chat_ids:
#     data = {
#       "chat_id": chat_id,
#       "text": message
#     }
#     r = requests.post(url = SEND_MESSAGE_API, data = data)
#
#   return { "success": True }
#
# @app.route('/updateChats', methods=['POST'])
# def update_chats():
#   response = requests.get(url = GET_UPDATES_API)
#   result = response.json().get('result')
#
#   # Read current chats from json file
#   with open(get_chats_json_path()) as json_file:
#       chats = json.load(json_file)
#
#   for update in result:
#   	if "channel_post" in update:
#   		chat = update["channel_post"]["chat"]
#   	if "message" in update:
#   		chat = update["message"]["chat"]
#   	chat_id = str(chat["id"])
#   	if "title" not in chat:
#   		# not a channel or a group
#   		continue
#   	chat_name = chat["title"]
#   	chats[chat_id] = chat_name
#
#   # Write updated json to file
#   with open(get_chats_json_path(),'w') as f:
#       json.dump(chats, f, indent=4)
#
#   return { "success": True }
