/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const line = require('@line/bot-sdk');
const admin = require('firebase-admin');

// LINE SDKの設定
const lineConfig = {
    channelAccessToken: '0HBQ9TOPXbglNQhGnystSUpM+ASNyGnZTkUYJYx7yr7GU9+VJAz96bJaKAc73r1b8v6bi3n50tiS4ahjuJI/5OZPUwuqDqjgrY4AJugAJmDyA9Io6SWwiJyZu9+YQz7mxf6iZqNnwARWu8RGePBMAQdB04t89/1O/w1cDnyilFU=', // LINE Developersで取得したアクセストークン
    channelSecret: '25dff7120d3b7f055b4e30ae8c0363db' // LINE Developersで取得したチャネルシークレット
};

const client = new line.Client(lineConfig);
admin.initializeApp();
const db = admin.firestore();

exports.lineWebhook = onRequest(async (req, res) => {
    try {
        await Promise
            .all(req.body.events.map(event => {
                if (event.type === 'message' && event.message.type === 'text') {
                    return handleText(event);
                }

            }));
        res.status(200).end();
    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

async function handleText(event) {
    // ユーザーが「リマインド設定」ボタンを押したかチェック
    if (event.message.text === 'リマインド設定') {
        // ユーザーにリマインドする内容を尋ねる
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'リマインドする内容を送信してください。'
        });
    }
    // リマインド内容をデータベースに保存
    const userId = event.source.userId; // ユーザーIDを取得
    const reminderText = event.message.text; // ユーザーが送信したリマインド内容
    // Firestoreにリマインド内容を保存
    await db.collection('reminders').add({
        userId: userId,
        text: reminderText,
        // 他の必要な情報をここに追加...
    });

    // ユーザーに確認メッセージを送信
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'リマインドを登録しました。次に、リマインドする日時を設定してください。'
    });
    // 他のテキストメッセージに対する処理...
    // 例えば、ユーザーからのリマインド内容を処理するコードなど

    // クイックリプライの作成（前の例と同じ）
    const quickReply = {
        items: [
            {
                type: 'action',
                action: {
                    type: 'message',
                    label: 'リマインドを設定する',
                    text: 'リマインド設定'
                }
            }
        ]
    };

    // クイックリプライを含むメッセージの送信
    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'このBOTではリマインド設定が可能です。',
        quickReply: quickReply
    });
}