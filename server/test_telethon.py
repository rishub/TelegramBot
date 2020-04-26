chat_id = "-1001253378971"
api_id = "1207385"
api_hash = 'b577054ff6343928f95d4f0c4e081fdd'
BOT_API_KEY = "1197167345:AAFriOvxhWm7qyPG1h4gMAnN2aIDe_J3OmY"

from telethon.sync import TelegramClient

# client = TelegramClient('sessions', api_id, api_hash)
#
# with client:
#     chat = client.get_input_entity(int(chat_id))
#
#     #     # get last 10 messages
#     #     for msg in client.iter_messages(chat, limit=10):
#     #         print(msg.text)
#
# #     client.send_message(chat, 'hi')
#
#     for dialog in client.get_dialogs(archived=False):
#       chat_name = dialog.name
#       print(chat_name)
# #       if "+ Alchemy" in chat_name:
# #         client.send_message(dialog, 'hi')
#
#

phone_number = "+14086217236"
# client = TelegramClient('sessions/' + phone_number, api_id, api_hash)
# client.connect()
#
# if not client.is_user_authorized():
#     hash = client.send_code_request(phone_number)
#     print(hash)


client.sign_in(phone_number, 46770, phone_code_hash="040441ac23587f1113")
for dialog in client.get_dialogs(archived=False):
      chat_name = dialog.name
      print(chat_name)


