const { createErrorMessage } = require('../templates/messageTemplates');
const { getTeamData } = require('../utils/database');

const nextHostHandler = async ({ respond }) => {
  try {
    const teamData = await getTeamData();

    if (!teamData || teamData.teamMembers.length === 0) {
      const errorMessage = createErrorMessage('empty_team');
      await respond(errorMessage);
      return;
    }

    const nextHost = teamData.teamMembers[teamData.currentIndex];

    await respond({
      text: `🎯 Next standup host: ${nextHost.displayName} (@${nextHost.username})`,
      response_type: 'ephemeral'
    });

  } catch (error) {
    console.error('Error in next host handler:', error);
    const errorMessage = createErrorMessage('technical_error');
    await respond(errorMessage);
  }
};

module.exports = { nextHostHandler };