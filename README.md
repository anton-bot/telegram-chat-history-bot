# Telegram Chat History Bot.

Add this bot to your Telegram group to save all messages to a database.

Requirements:

- The bot must be an admin in the group.
- You must have an Azure account.

## Build, deploy and configure ##

### Create Azure infrastructure ###

1. [Install Azure CLI](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local/), if you don't have it: you will need `az` and `func`. Run `az login` if you did not log in yet.

2. Run these commands to create a new Azure Function App and its storage account.

In these and all other commands, replace `telegram-bots-app` with a unique name for your function app, and `telegrambotsstorage` with a unique name for your Azure storage account.

```bash
az group create --name telegram-bots --location eastus2
az storage account create --name telegrambotsstorage --location eastus2 --resource-group telegram-bots --sku Standard_LRS
az functionapp create --resource-group telegram-bots --consumption-plan-location eastus2 --runtime node --functions-version 4 --name telegram-bots-app --storage-account telegrambotsstorage

```

3. Build and deploy this repository into the function app.

```bash
npm i
npm run build
func azure functionapp publish telegram-bots-app
```

4. After deployment, you will see a URL like `https://telegram-bots-app.azurewebsites.net/api/save/{chatname}/` in the console. Save that URL. 

Get the secret key to call your function, which prevents it from being called by anyone else.

```bash
az functionapp function keys list --function-name save --name telegram-bots-app --resource-group telegram-bots
```

You will see a key under `default`. Save that key.

The complete function URL including the secret key will be:

```
https://telegram-bots-app.azurewebsites.net/api/save/<CHAT_NAME>/?code=<SECRET KEY>
```

Replace `<CHAT_NAME>` with any unique name you choose for your chat. It will be used as the partition key in the database.

This will be the URL that Telegram will call to send messages to your function. Save this URL for the next steps.

5. Configure storage. Get storage connection string, returned as "connectionString" in the JSON response from this command:

```bash
az storage account show-connection-string --name telegrambotsstorage
```

Now save the connection string as an environment variable in the function app. Replace `<CONNECTION_STRING>` with the connection string you just got.

```bash
az functionapp config appsettings set --name telegram-bots-app \
    --resource-group telegram-bots \
    --settings TelegramChatStorageConnection="<CONNECTION STRING>"
```

### Create Telegram bot ###

1. Create a new bot with [BotFather](https://t.me/botfather). You will get a token like `123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`.

2. Add your new bot to your Telegram group. The bot must be an admin in the group.

3. Change bot privacy settings. Message @BotFather with the command `/setprivacy` and select your bot. Select `Disable` to allow the bot to collect messages.

4. Using the bot token you just received, tell Telegram to send all messages to your Azure function. Replace `<TELEGRAM BOT TOKEN>` with your bot token, and `<URL>` with the function URL created previously (which includes the secret key). 

```bash
curl -X "POST" "https://api.telegram.org/bot<TELEGRAM BOT TOKEN>/setWebhook" \
    -d '{"url": "<URL>", "allowed_updates": ["message"]}' \
    -H 'Content-Type: application/json; charset=utf-8'
```

## Test ##

Send a message into the group. The bot should save it to the database. Try to fetch the records from the table to test this:

```bash
az storage entity query --table-name chats --account-name telegrambotsstorage
```
