const createTeamOverviewMessage = (teamMembers, nextHost, lastUpdated) => {
  const memberList = teamMembers.map((member, index) => {
    return `${index + 1}. ${member.displayName} (@${member.username})`;
  }).join('\n');

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎤 MicDrop Team Rotation'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Current Team* (${teamMembers.length} members):\n${memberList}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Next Host:* ${nextHost ? nextHost.displayName : 'TBD'}`
          },
          {
            type: 'mrkdwn',
            text: `*Last Updated:* ${lastUpdated}`
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Add Member'
            },
            style: 'primary',
            action_id: 'add_member_button'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Remove Member'
            },
            style: 'danger',
            action_id: 'remove_member_button'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Next Host'
            },
            action_id: 'view_next_host_button'
          }
        ]
      }
    ]
  };
};

const createAddMemberModal = (workspaceUsers) => {
  return {
    type: 'modal',
    callback_id: 'add_member_modal',
    title: {
      type: 'plain_text',
      text: 'Add Team Member'
    },
    submit: {
      type: 'plain_text',
      text: 'Add Member'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Select a team member to add to the standup rotation:'
        }
      },
      {
        type: 'input',
        block_id: 'user_select_block',
        element: {
          type: 'users_select',
          action_id: 'selected_user',
          placeholder: {
            type: 'plain_text',
            text: 'Select a user'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Team Member'
        }
      }
    ]
  };
};

const createRemoveMemberModal = (teamMembers) => {
  const options = teamMembers.map(member => ({
    text: {
      type: 'plain_text',
      text: member.displayName
    },
    value: member.userId
  }));

  return {
    type: 'modal',
    callback_id: 'remove_member_modal',
    title: {
      type: 'plain_text',
      text: 'Remove Team Member'
    },
    submit: {
      type: 'plain_text',
      text: 'Remove Member'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Select a team member to remove from the standup rotation:'
        }
      },
      {
        type: 'input',
        block_id: 'user_select_block',
        element: {
          type: 'static_select',
          action_id: 'selected_user',
          placeholder: {
            type: 'plain_text',
            text: 'Select a user to remove'
          },
          options
        },
        label: {
          type: 'plain_text',
          text: 'Team Member'
        }
      }
    ]
  };
};

const createStandupNotificationMessage = (hostUser, dayName, date) => {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎯 Tomorrow\'s Standup Host'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<@${hostUser.userId}>`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `📅 ${dayName}, ${date}`
          },
          {
            type: 'mrkdwn',
            text: '⏰ [Your usual standup time]'
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Thanks for hosting, ${hostUser.displayName}! 🙌`
        }
      }
    ]
  };
};

const createConfirmationMessage = (type, user, position = null) => {
  const messages = {
    added: {
      text: `✅ *Added to Team*: <@${user.userId}> has been added to the standup rotation`,
      details: position ? `Position: #${position} (alphabetical order)` : ''
    },
    removed: {
      text: `❌ *Removed from Team*: <@${user.userId}> has been removed from the standup rotation`,
      details: 'Rotation adjusted automatically'
    },
    error_exists: {
      text: `⚠️ *Error*: <@${user.userId}> is already in the team rotation`,
      details: ''
    },
    error_not_found: {
      text: `⚠️ *Error*: <@${user.userId}> is not in the team rotation`,
      details: ''
    }
  };

  const message = messages[type];
  return {
    text: message.text + (message.details ? `\n${message.details}` : ''),
    response_type: 'in_channel'
  };
};

const createErrorMessage = (errorType, context = {}) => {
  const errorMessages = {
    all_unavailable: {
      text: '⚠️ *Manual Host Assignment Needed*\nAll team members appear to be unavailable tomorrow. Please assign a standup host manually.'
    },
    technical_error: {
      text: `❌ *MicDrop Error*\nUnable to determine tomorrow's host due to a technical issue. Last host: <@${context.lastUserId}>\n\nUse \`/micdrop team\` to manage your standup rotation.`
    },
    empty_team: {
      text: '⚠️ *No Team Members*\nNo team members are configured. Use `/micdrop add @username` to add team members.'
    }
  };

  return {
    text: errorMessages[errorType]?.text || 'An unexpected error occurred.',
    response_type: 'ephemeral'
  };
};

const createAllUnavailableMessage = () => {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Manual Host Assignment Needed'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'All team members appear to be unavailable tomorrow. Please assign a standup host manually.\n\nUse `/micdrop team` to manage your standup rotation.'
        }
      }
    ]
  };
};

module.exports = {
  createTeamOverviewMessage,
  createAddMemberModal,
  createRemoveMemberModal,
  createStandupNotificationMessage,
  createAllUnavailableMessage,
  createConfirmationMessage,
  createErrorMessage
};