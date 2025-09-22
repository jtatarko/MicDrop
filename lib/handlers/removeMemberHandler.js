const { createConfirmationMessage } = require('../templates/messageTemplates');
const { getTeamData, updateTeamData } = require('../utils/database');

const removeMemberHandler = async ({ command, respond }) => {
  try {
    const args = command.text.trim().split(' ');

    if (args.length < 2 || !args[1].startsWith('<@')) {
      await respond({
        text: 'Usage: `/micdrop remove @username`',
        response_type: 'ephemeral'
      });
      return;
    }

    const userMention = args[1];
    const userId = userMention.replace(/[<@>]/g, '').split('|')[0];

    const teamData = await getTeamData();
    const memberIndex = teamData.teamMembers.findIndex(member => member.userId === userId);

    if (memberIndex === -1) {
      const userInfo = { userId };
      const confirmationMessage = createConfirmationMessage('error_not_found', userInfo);
      await respond(confirmationMessage);
      return;
    }

    const removedMember = teamData.teamMembers[memberIndex];
    teamData.teamMembers.splice(memberIndex, 1);

    if (teamData.currentIndex >= memberIndex && teamData.currentIndex > 0) {
      teamData.currentIndex--;
    } else if (teamData.currentIndex >= teamData.teamMembers.length) {
      teamData.currentIndex = 0;
    }

    await updateTeamData(teamData);

    const confirmationMessage = createConfirmationMessage('removed', removedMember);
    await respond(confirmationMessage);

  } catch (error) {
    console.error('Error in remove member handler:', error);
    await respond({
      text: '❌ Error removing team member. Please check the username and try again.',
      response_type: 'ephemeral'
    });
  }
};

module.exports = { removeMemberHandler };