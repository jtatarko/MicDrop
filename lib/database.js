const { createClient } = require('redis');

const TEAM_CONFIG_KEY = 'team_config';

let redisClient = null;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await redisClient.connect();
  }
  return redisClient;
};

const getTeamData = async () => {
  try {
    const client = await getRedisClient();
    const result = await client.get(TEAM_CONFIG_KEY);

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

    return JSON.parse(result);
  } catch (error) {
    console.error('Error getting team data from Redis:', error);
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
    const client = await getRedisClient();
    await client.set(TEAM_CONFIG_KEY, JSON.stringify(teamData));
    return teamData;
  } catch (error) {
    console.error('Error updating team data in Redis:', error);
    throw error;
  }
};

module.exports = {
  getTeamData,
  updateTeamData
};