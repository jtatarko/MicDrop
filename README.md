# MicDrop - Slack Standup Host Rotation

Serverless Slack app for automatic standup host rotation with smart availability detection. Now deployed on Vercel with GitHub Actions scheduling.

## Quick Setup for Vercel Deployment

### 1. Install Dependencies
```bash
npm install
npm install -g vercel
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Slack app credentials and secrets
```

### 3. Set up Slack App Configuration

In your Slack app settings (https://api.slack.com/apps):

#### OAuth & Permissions
Add these Bot Token Scopes:
- `chat:write`
- `users:read`
- `channels:read`
- `commands`
- `im:write`

#### Slash Commands
Create a slash command:
- Command: `/micdrop`
- Request URL: `https://your-app.vercel.app/api/slack/events`
- Description: "Manage standup host rotation"

#### Interactivity & Shortcuts
- Enable Interactivity: ON
- Request URL: `https://your-app.vercel.app/api/slack/events`

### 4. Deploy to Vercel

#### First-time deployment:
```bash
vercel login
vercel --prod
```

#### Set up Vercel KV Database:
1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → KV
3. Copy the environment variables to your Vercel project settings

#### Configure Environment Variables in Vercel:
- `SLACK_BOT_TOKEN` - Your Slack bot token
- `SLACK_SIGNING_SECRET` - Your Slack signing secret
- `SLACK_CHANNEL_ID` - Target channel ID for notifications
- `CRON_SECRET` - Random secret for GitHub Actions authentication
- `KV_*` variables - Automatically provided by Vercel KV

### 5. Set up GitHub Actions Scheduling

#### Configure Repository Secrets:
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add these secrets:
   - `VERCEL_CRON_URL` - `https://your-app.vercel.app/api/cron/daily-standup`
   - `CRON_SECRET` - Same secret as in Vercel environment variables

The GitHub Actions workflow will automatically trigger daily notifications:
- Runs Monday/Wednesday at 13:00 UTC (15:00 CET)
- Sends notifications for Tuesday/Thursday standups
- Calls your Vercel cron endpoint securely

### 6. Test the Deployment

#### Test Slack Commands:
```
/micdrop team          # View team roster with interactive buttons
/micdrop add @username # Quick add team member
/micdrop remove @user  # Quick remove team member
/micdrop next          # Preview next host
```

#### Test Cron Endpoint (Manual):
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-standup \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -d '{"trigger": "manual_test"}'
```

## Architecture Overview

### Vercel Functions
- **`/api/slack/events`** - Main Slack webhook handler
- **`/api/cron/daily-standup`** - Scheduled notification endpoint

### Data Storage
- **Vercel KV (Redis)** - Team configuration and rotation state

### Scheduling
- **GitHub Actions** - Daily cron trigger at 15:00 Vienna time
- **Automatic notifications** - Tuesday and Thursday standup reminders

### Smart Features
- **Availability Detection** - Skips users with vacation/sick status
- **Fallback Logic** - Manual assignment when all users unavailable
- **Interactive UI** - Slack-native team management with buttons and modals

## Project Structure

```
/
├── api/
│   ├── slack/
│   │   └── events.js           # Main Slack webhook handler
│   └── cron/
│       └── daily-standup.js    # Scheduled notifications
├── lib/
│   ├── database.js            # Vercel KV operations
│   ├── slack.js              # Slack API helpers
│   ├── handlers/             # Slash command handlers
│   └── templates/            # Block Kit message templates
├── .github/workflows/
│   └── daily-standup.yml     # GitHub Actions cron job
└── vercel.json              # Vercel configuration
```

## Development Commands

```bash
npm run dev      # Start Vercel development server
npm run build    # Build for production
npm run deploy   # Deploy to Vercel
npm test         # Run tests
npm run lint     # Lint code
```

## Environment Variables

### Required for Production:
- `SLACK_BOT_TOKEN` - Slack bot user OAuth token
- `SLACK_SIGNING_SECRET` - Slack app signing secret
- `SLACK_CHANNEL_ID` - Target channel for notifications
- `CRON_SECRET` - Secret for authenticating GitHub Actions
- `KV_*` - Vercel KV database credentials (auto-configured)

## Scheduling Logic

### Daily Notifications:
1. **GitHub Actions triggers** at 13:00 UTC (15:00 CET) on Monday/Wednesday
2. **Cron endpoint checks** if tomorrow is Tuesday/Thursday
3. **Smart host selection** finds next available team member
4. **Availability checking** via Slack status/emoji detection
5. **Fallback handling** when all users are unavailable

### Rotation Rules:
- Alphabetical order by display name
- Skips unavailable users without memory
- Automatic index adjustment when members added/removed
- Manual assignment option when all unavailable

## Troubleshooting

### Common Issues

**"URL verification failed"**
- Check that your Vercel URL is correct in Slack app settings
- Ensure the endpoint is `/api/slack/events`
- Verify your Signing Secret matches

**"Missing scopes"**
- Add required OAuth scopes in your Slack app
- Reinstall the app to workspace after adding scopes

**"Cron not working"**
- Verify GitHub Actions secrets are configured correctly
- Check CRON_SECRET matches between GitHub and Vercel
- Ensure Vercel function deployment is successful

**"KV Database errors"**
- Verify Vercel KV database is created and linked
- Check KV environment variables are configured
- Ensure your Vercel plan supports KV usage

### Monitoring
- Check GitHub Actions runs for cron execution logs
- Monitor Vercel function logs for errors
- Test manual cron endpoint calls for debugging

## Cost Estimates

### Vercel (Free/Pro):
- **Functions**: Free tier covers typical usage
- **KV Database**: Free tier includes 30,000 commands/month
- **Bandwidth**: Sufficient for Slack API calls

### GitHub Actions:
- **Free**: 2,000 minutes/month (sufficient for daily cron)

### Total:
- **Free tier**: $0/month for most teams
- **Pro tier**: ~$20/month for larger teams or higher usage

## Migration from AWS

This version replaces:
- **AWS Lambda** → Vercel Functions
- **DynamoDB** → Vercel KV (Redis)
- **EventBridge** → GitHub Actions
- **API Gateway** → Vercel automatic routing

All functionality remains the same while simplifying deployment and reducing costs.