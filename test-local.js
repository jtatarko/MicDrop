require('dotenv').config();

const { App } = require('@slack/bolt');

console.log('🧪 Testing MicDrop Slack UI...');
console.log('Environment check:');
console.log('- SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? '✓ Set' : '❌ Missing');
console.log('- SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? '✓ Set' : '❌ Missing');
console.log('- SLACK_CHANNEL_ID:', process.env.SLACK_CHANNEL_ID ? '✓ Set' : '❌ Missing');

if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  console.log('\n❌ Please create a .env file with your Slack credentials');
  console.log('Copy .env.example to .env and fill in your values');
  process.exit(1);
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  port: process.env.PORT || 3000
});

app.command('/micdrop', async ({ command, ack, respond }) => {
  await ack();
  console.log('📝 Slash command received:', command.text);

  await respond({
    text: `✅ MicDrop is working! Command: "${command.text}"`,
    response_type: 'ephemeral'
  });
});

(async () => {
  try {
    await app.start();
    console.log('\n⚡️ MicDrop test server is running on port', process.env.PORT || 3000);
    console.log('📱 Use ngrok or similar to expose this port to test with Slack');
    console.log('🔗 Configure your Slack app request URL to: https://your-ngrok-url.ngrok.io/slack/events');
  } catch (error) {
    console.error('❌ Failed to start test server:', error);
  }
})();