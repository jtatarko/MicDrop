const { createTeamOverviewMessage, createErrorMessage } = require('../templates/messageTemplates');
const { getTeamData } = require('../database');

const teamCommandHandler = async ({ respond }) => {
  try {
    const teamData = await getTeamData();

    if (!teamData || teamData.teamMembers.length === 0) {
      const errorMessage = createErrorMessage('empty_team');
      await respond(errorMessage);
      return;
    }

    const nextHost = teamData.teamMembers[teamData.currentIndex];
    const lastUpdated = new Date().toLocaleString('en-US', {
      timeZone: 'Europe/Vienna',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    const message = createTeamOverviewMessage(teamData.teamMembers, nextHost, lastUpdated);

    await respond({
      ...message,
      response_type: 'in_channel'
    });

  } catch (error) {
    console.error('Error in team command handler:', error);
    const errorMessage = createErrorMessage('technical_error');
    await respond(errorMessage);
  }
};

module.exports = { teamCommandHandler };