const { getTeamData, updateTeamData } = require('../../lib/database');
const { isUserUnavailable, sendMessage } = require('../../lib/slack');
const { createStandupNotificationMessage, createAllUnavailableMessage } = require('../../lib/templates/messageTemplates');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify cron secret
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if tomorrow is a standup day (Tuesday or Thursday)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayOfWeek = tomorrow.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Tuesday = 2, Thursday = 4
    if (dayOfWeek !== 2 && dayOfWeek !== 4) {
      console.log(`Tomorrow is not a standup day (${dayOfWeek}), skipping notification`);
      return res.status(200).json({
        message: 'Not a standup day',
        tomorrow: tomorrow.toDateString(),
        dayOfWeek
      });
    }

    // Load team data
    const teamData = await getTeamData();

    if (!teamData || teamData.teamMembers.length === 0) {
      console.log('No team members found');
      return res.status(200).json({ message: 'No team members configured' });
    }

    // Find next available host
    let attempts = 0;
    let hostFound = false;
    let selectedHost = null;
    const maxAttempts = teamData.teamMembers.length;

    while (attempts < maxAttempts && !hostFound) {
      const currentMember = teamData.teamMembers[teamData.currentIndex];
      const isUnavailable = await isUserUnavailable(currentMember.userId);

      if (!isUnavailable) {
        selectedHost = currentMember;
        hostFound = true;
      } else {
        console.log(`${currentMember.displayName} is unavailable, checking next member`);
        teamData.currentIndex = (teamData.currentIndex + 1) % teamData.teamMembers.length;
        attempts++;
      }
    }

    const channelId = teamData.channelId || process.env.SLACK_CHANNEL_ID;

    if (!hostFound) {
      // All users are unavailable
      console.log('All team members are unavailable');
      const message = createAllUnavailableMessage();
      await sendMessage(channelId, message);

      return res.status(200).json({
        message: 'All team members unavailable',
        notificationSent: true
      });
    }

    // Send notification with selected host
    const dayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
    const date = tomorrow.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const message = createStandupNotificationMessage(selectedHost, dayName, date);
    await sendMessage(channelId, message);

    // Update current index for next rotation
    teamData.currentIndex = (teamData.currentIndex + 1) % teamData.teamMembers.length;
    teamData.lastNotificationDate = new Date().toISOString().split('T')[0];

    await updateTeamData(teamData);

    console.log(`Standup notification sent for ${selectedHost.displayName}`);

    return res.status(200).json({
      message: 'Standup notification sent',
      host: selectedHost.displayName,
      nextIndex: teamData.currentIndex,
      date: tomorrow.toDateString()
    });

  } catch (error) {
    console.error('Cron handler error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}