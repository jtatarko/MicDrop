const { WebClient } = require('@slack/web-api');

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

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
  getUserInfo,
  getUserPresence,
  getUserProfile,
  isUserUnavailable,
  sendMessage
};