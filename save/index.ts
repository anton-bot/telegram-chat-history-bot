import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    if (!req.body) {
        const msg = 'Invalid request - no body';
        context.log(msg);
        context.res = {
            status: 200, // We don't want Telegram to keep retrying to send this message to us
            body: msg,
        };
        return;
    }

    const { chatname = DEFAULT_PARTITION_KEY } = context.bindingData;
    if (!chatname) {
        const msg = 'Invalid request - no chatName in URL';
        context.log(msg);
        context.res = {
            status: 400,
            body: msg,
        };
        return;
    }

    // Update ID is the primary key for updates sent by Telegram
    const { update_id, ...rest } = req.body;
    
    context.bindings.tableBinding = [];
    context.bindings.tableBinding.push({
        PartitionKey: chatname,
        RowKey: String(update_id),
        ...rest,
    });

    context.res = { body: 'OK' };
};

const DEFAULT_PARTITION_KEY = 'telegram';

export default httpTrigger;
