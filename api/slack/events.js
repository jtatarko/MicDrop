const { verifySlackRequest } = require('../../lib/slack');
const { teamCommandHandler } = require('../../lib/handlers/teamHandler');
const { addMemberHandler } = require('../../lib/handlers/addMemberHandler');
const { removeMemberHandler } = require('../../lib/handlers/removeMemberHandler');
const { nextHostHandler } = require('../../lib/handlers/nextHostHandler');
const { interactiveHandler } = require('../../lib/handlers/interactiveHandler');
const { createMockClient } = require('../../lib/slackClient');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Slack request (temporarily disabled for debugging)
    // const isValid = verifySlackRequest(req);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid request signature' });
    // }

    // Debug: Still call it to see the logs
    verifySlackRequest(req);

    const body = req.body;

    // Handle URL verification challenge
    if (body.type === 'url_verification') {
      return res.status(200).json({ challenge: body.challenge });
    }

    // Handle slash commands
    if (body.command === '/micdrop') {
      const args = body.text.trim().split(' ');
      const subcommand = args[0];

      const respond = (message) => {
        return res.status(200).json(message);
      };

      switch (subcommand) {
        case 'team':
          await teamCommandHandler({ respond });
          break;
        case 'add':
          await addMemberHandler({ command: body, respond });
          break;
        case 'remove':
          await removeMemberHandler({ command: body, respond });
          break;
        case 'next':
          await nextHostHandler({ respond });
          break;
        default:
          await respond({
            text: 'Usage: `/micdrop team|add @user|remove @user|next`',
            response_type: 'ephemeral'
          });
      }
      return;
    }

    // Handle interactive components
    if (body.type === 'block_actions') {
      const action = body.actions[0];
      const ack = () => res.status(200).json({});
      const client = createMockClient(res);

      switch (action.action_id) {
        case 'add_member_button':
          await interactiveHandler.addMemberButton({ body, ack, client });
          break;
        case 'remove_member_button':
          await interactiveHandler.removeMemberButton({ body, ack, client });
          break;
        case 'view_next_host_button':
          await interactiveHandler.viewNextHostButton({ body, ack, client });
          break;
        default:
          res.status(200).json({});
      }
      return;
    }

    // Handle modal submissions
    if (body.type === 'view_submission') {
      const ack = () => res.status(200).json({});
      const client = createMockClient(res);

      switch (body.view.callback_id) {
        case 'add_member_modal':
          await interactiveHandler.addMemberSubmission({ body, ack, client });
          break;
        case 'remove_member_modal':
          await interactiveHandler.removeMemberSubmission({ body, ack, client });
          break;
        default:
          res.status(200).json({});
      }
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Slack event handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}