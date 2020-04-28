chat_id = "-1001253378971"
api_id = "1207385"
api_hash = 'b577054ff6343928f95d4f0c4e081fdd'
BOT_API_KEY = "1197167345:AAFriOvxhWm7qyPG1h4gMAnN2aIDe_J3OmY"

import csv

from telethon.sync import TelegramClient
from telethon.tl.functions.messages import ImportChatInviteRequest
from telethon.errors.rpcerrorlist import UserAlreadyParticipantError
import time

client = TelegramClient('sessions/4086217236', api_id, api_hash)
client.connect()


# Example: client(ImportChatInviteRequest("KEbM5w4xZ1ECseH9_iK7vQ"))

with open('server/channels.csv', newline='') as csvfile:
  spamreader = csv.reader(csvfile, delimiter=',', quotechar='|')
  for row in spamreader:
    name = row[1]
    join_link = row[2]
    if "https://t.me" in join_link:
      id = join_link.split("joinchat/")[1]
      try:
        print(name)
        client(ImportChatInviteRequest(id))
      except UserAlreadyParticipantError as e:
        print("already in " + name)

      time.sleep(60 * 3) # can only attempt to join one channel every 3 minutes RIP
