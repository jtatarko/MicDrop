const { WebClient } = require('@slack/web-api');

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const createMockClient = (res) => {
  return {
    views: {
      open: async (view) => {
        // For Vercel, we need to return the view to Slack
        return res.status(200).json(view);
      }
    },
    chat: {
      postMessage: async (message) => {
        // Use the real Slack client for posting messages
        return await slack.chat.postMessage(message);
      },
      postEphemeral: async (message) => {
        // Use the real Slack client for ephemeral messages
        return await slack.chat.postEphemeral(message);
      }
    }
  };
};

module.exports = {
  slack,
  createMockClient
};