const { WebClient } = require('@slack/web-api');
const crypto = require('crypto');

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

const verifySlackRequest = (req) => {
  try {
    // Debug logging
    console.log('Environment variables check:', {
      SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET ? 'SET' : 'UNDEFINED',
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ? 'SET' : 'UNDEFINED',
      SLACK_CHANNEL_ID: process.env.SLACK_CHANNEL_ID ? 'SET' : 'UNDEFINED',
      CRON_SECRET: process.env.CRON_SECRET ? 'SET' : 'UNDEFINED'
    });

    const slackSignature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    const body = JSON.stringify(req.body);

    if (!slackSignature || !timestamp) {
      return false;
    }

    // Check if request is not too old (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      return false;
    }

    const sigBasestring = `v0:${timestamp}:${body}`;
    const expectedSignature = `v0=${crypto
      .createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
      .update(sigBasestring)
      .digest('hex')}`;

    return crypto.timingSafeEqual(
      Buffer.from(slackSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying Slack request:', error);
    return false;
  }
};

const getUserInfo = async (client = null, userId) => {
  try {
    const slackClient = client || slack;
    const result = await slackClient.users.info({ user: userId });
    return result.user;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
};

const getUserPresence = async (userId) => {
  try {
    const result = await slack.users.getPresence({ user: userId });
    return result.presence;
  } catch (error) {
    console.error('Error getting user presence:', error);
    return 'unknown';
  }
};

const getUserProfile = async (userId) => {
  try {
    const result = await slack.users.profile.get({ user: userId });
    return result.profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

const isUserUnavailable = async (userId) => {
  try {
    const profile = await getUserProfile(userId);

    if (!profile) return false;

    const statusText = (profile.status_text || '').toLowerCase();
    const statusEmoji = profile.status_emoji || '';

    const unavailableIndicators = [
      'vacationing',
      'sick',
      'out of office',
      'ooo',
      'vacation',
      'holiday',
      'away',
      'off'
    ];

    const unavailableEmojis = [
      ':palm_tree:',
      ':airplane:',
      ':face_with_thermometer:',
      ':hospital:',
      ':house:'
    ];

    const hasUnavailableText = unavailableIndicators.some(indicator =>
      statusText.includes(indicator)
    );

    const hasUnavailableEmoji = unavailableEmojis.some(emoji =>
      statusEmoji.includes(emoji)
    );

    return hasUnavailableText || hasUnavailableEmoji;
  } catch (error) {
    console.error('Error checking user availability:', error);
    return false;
  }
};

const sendMessage = async (channel, message) => {
  try {
    const result = await slack.chat.postMessage({
      channel,
      ...message
    });
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

module.exports = {
  verifySlackRequest,
  getUserInfo,
  getUserPresence,
  getUserProfile,
  isUserUnavailable,
  sendMessage
};