const { createConfirmationMessage } = require('../templates/messageTemplates');
const { getTeamData, updateTeamData } = require('../database');
const { getUserInfo } = require('../slack');

const addMemberHandler = async ({ command, respond }) => {
  try {
    const args = command.text.trim().split(' ');

    if (args.length < 2 || !args[1].startsWith('<@')) {
      await respond({
        text: 'Usage: `/micdrop add @username`',
        response_type: 'ephemeral'
      });
      return;
    }

    const userMention = args[1];
    const userId = userMention.replace(/[<@>]/g, '').split('|')[0];

    const userInfo = await getUserInfo(null, userId);

    const teamData = await getTeamData();
    const existingMember = teamData.teamMembers.find(member => member.userId === userId);

    if (existingMember) {
      const confirmationMessage = createConfirmationMessage('error_exists', userInfo);
      await respond(confirmationMessage);
      return;
    }

    const newMember = {
      userId: userInfo.id,
      username: userInfo.name,
      displayName: userInfo.profile.display_name || userInfo.profile.real_name || userInfo.name
    };

    teamData.teamMembers.push(newMember);
    teamData.teamMembers.sort((a, b) => a.displayName.localeCompare(b.displayName));

    const newPosition = teamData.teamMembers.findIndex(member => member.userId === userId) + 1;

    await updateTeamData(teamData);

    const confirmationMessage = createConfirmationMessage('added', newMember, newPosition);
    await respond(confirmationMessage);

  } catch (error) {
    console.error('Error in add member handler:', error);
    await respond({
      text: '❌ Error adding team member. Please check the username and try again.',
      response_type: 'ephemeral'
    });
  }
};

module.exports = { addMemberHandler };