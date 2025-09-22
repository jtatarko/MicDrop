const { createAddMemberModal, createRemoveMemberModal, createConfirmationMessage } = require('../templates/messageTemplates');
const { getTeamData, updateTeamData } = require('../database');
const { getUserInfo } = require('../slack');

const interactiveHandler = {
  addMemberButton: async ({ ack, body, client }) => {
    await ack();

    try {
      const modal = createAddMemberModal();
      await client.views.open({
        trigger_id: body.trigger_id,
        view: modal
      });
    } catch (error) {
      console.error('Error opening add member modal:', error);
    }
  },

  removeMemberButton: async ({ ack, body, client }) => {
    await ack();

    try {
      const teamData = await getTeamData();
      if (!teamData || teamData.teamMembers.length === 0) {
        await client.chat.postEphemeral({
          channel: body.channel.id,
          user: body.user.id,
          text: '⚠️ No team members to remove.'
        });
        return;
      }

      const modal = createRemoveMemberModal(teamData.teamMembers);
      await client.views.open({
        trigger_id: body.trigger_id,
        view: modal
      });
    } catch (error) {
      console.error('Error opening remove member modal:', error);
    }
  },

  viewNextHostButton: async ({ ack, body, client }) => {
    await ack();

    try {
      const teamData = await getTeamData();
      if (!teamData || teamData.teamMembers.length === 0) {
        await client.chat.postEphemeral({
          channel: body.channel.id,
          user: body.user.id,
          text: '⚠️ No team members configured.'
        });
        return;
      }

      const nextHost = teamData.teamMembers[teamData.currentIndex];
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: `🎯 Next host: ${nextHost.displayName} (@${nextHost.username})`
      });
    } catch (error) {
      console.error('Error showing next host:', error);
      await client.chat.postEphemeral({
        channel: body.channel.id,
        user: body.user.id,
        text: '❌ Error determining next host.'
      });
    }
  },

  addMemberSubmission: async ({ ack, body, view, client }) => {
    await ack();

    try {
      const userId = view.state.values.user_select_block.selected_user.selected_user;
      const userInfo = await getUserInfo(client, userId);

      const teamData = await getTeamData();
      const existingMember = teamData.teamMembers.find(member => member.userId === userId);

      if (existingMember) {
        const confirmationMessage = createConfirmationMessage('error_exists', userInfo);
        await client.chat.postMessage({
          channel: process.env.SLACK_CHANNEL_ID,
          ...confirmationMessage
        });
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
      await client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID,
        ...confirmationMessage
      });

    } catch (error) {
      console.error('Error adding team member:', error);
      await client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID,
        text: '❌ Error adding team member. Please try again.',
        response_type: 'ephemeral'
      });
    }
  },

  removeMemberSubmission: async ({ ack, body, view, client }) => {
    await ack();

    try {
      const userId = view.state.values.user_select_block.selected_user.selected_option.value;

      const teamData = await getTeamData();
      const memberIndex = teamData.teamMembers.findIndex(member => member.userId === userId);

      if (memberIndex === -1) {
        const userInfo = { userId };
        const confirmationMessage = createConfirmationMessage('error_not_found', userInfo);
        await client.chat.postMessage({
          channel: process.env.SLACK_CHANNEL_ID,
          ...confirmationMessage
        });
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
      await client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID,
        ...confirmationMessage
      });

    } catch (error) {
      console.error('Error removing team member:', error);
      await client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID,
        text: '❌ Error removing team member. Please try again.',
        response_type: 'ephemeral'
      });
    }
  }
};

module.exports = { interactiveHandler };