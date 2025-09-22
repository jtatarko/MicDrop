const { kv } = require('@vercel/kv');

const TEAM_CONFIG_KEY = 'team_config';

const getTeamData = async () => {
  try {
    const result = await kv.get(TEAM_CONFIG_KEY);

    if (!result) {
      const defaultTeamData = {
        id: 'team_config',
        teamMembers: [],
        currentIndex: 0,
        lastNotificationDate: null,
        channelId: process.env.SLACK_CHANNEL_ID
      };

      await updateTeamData(defaultTeamData);
      return defaultTeamData;
    }

    return result;
  } catch (error) {
    console.error('Error getting team data from Vercel KV:', error);
    return {
      id: 'team_config',
      teamMembers: [],
      currentIndex: 0,
      lastNotificationDate: null,
      channelId: process.env.SLACK_CHANNEL_ID
    };
  }
};

const updateTeamData = async (teamData) => {
  try {
    await kv.set(TEAM_CONFIG_KEY, teamData);
    return teamData;
  } catch (error) {
    console.error('Error updating team data in Vercel KV:', error);
    throw error;
  }
};

module.exports = {
  getTeamData,
  updateTeamData
};