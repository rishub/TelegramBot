import asyncio
from flask import Flask, request, send_from_directory
import json
import os
import requests
import time

from telethon.sync import TelegramClient
from telethon import functions

app = Flask(__name__, static_folder='')

BOT_API_KEY = "1197167345:AAFriOvxhWm7qyPG1h4gMAnN2aIDe_J3OmY"
SEND_MESSAGE_API = f"https://api.telegram.org/bot{BOT_API_KEY}/sendMessage"
GET_UPDATES_API = f"https://api.telegram.org/bot{BOT_API_KEY}/getUpdates"
CHATS_FILENAME = "chats.json"
TELEGRAM_API_ID = "1207385"
TELEGRAM_API_HASH = 'b577054ff6343928f95d4f0c4e081fdd'

def get_chats_json_path():
  return os.path.join(app.static_folder, CHATS_FILENAME)

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
        return { "loggedIn": True }
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
    return { "loggedIn": True }
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

async def send_message_to_chats(phone_number, message, chat_ids):
  try:
    client = await get_telegram_client(phone_number)

    for chat_id in chat_ids:
        chat = await client.get_input_entity(int(chat_id))
        await client.send_message(chat, message)
        time.sleep(0.5)
    return { "success": True }
  finally:
    await client.disconnect()

@app.route("/sendMessage", methods=["POST"])
def send_message():
  data = json.loads(request.data)
  phone_number = data['phoneNumber']
  message = data['message']
  chat_ids = data['chatIds']
  response = loop.run_until_complete(send_message_to_chats(phone_number, message, chat_ids))
  return response

if __name__ == '__main__':
    app.run()



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
