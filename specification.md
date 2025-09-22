## Overview

MicDrop is a serverless Slack app that automatically rotates standup meeting hosts and sends daily notifications. The system includes Slack-native team management UI and skips unavailable team members based on their Slack status.

## Requirements

### Core Functionality

- **Automatic Rotation**: Cycles through team members in alphabetical order
- **Smart Availability**: Skips users with "vacationing", "sick", or "out of office" Slack statuses
- **Scheduled Notifications**: Sends Slack messages at 15:00 Vienna time (CET/CEST) before standup days
- **Standup Schedule**: Tuesday and Thursday meetings
- **Slack-Native Team Management**: Add/remove team members via slash commands and interactive UI

### Business Rules

- Rotation order is alphabetical by display name
- If a user is unavailable, move to next available person without memory
- If all users unavailable, notify team and request manual assignment
- New team members are inserted alphabetically into existing rotation

## Technical Architecture

### Technology Stack

- **Runtime**: Node.js 18.x on AWS Lambda
- **Database**: Amazon DynamoDB (single table)
- **Scheduler**: Amazon EventBridge (cron expression)
- **Integrations**: Slack Web API
- **Deployment**: AWS SAM or Serverless Framework

### System Components

### 1. Lambda Function (`micdrop-scheduler`)

**Trigger**: EventBridge rule - daily at 13:00 UTC (15:00 CET)
**Environment Variables**:

- `SLACK_BOT_TOKEN` - Bot User OAuth Token
- `SLACK_SIGNING_SECRET` - For webhook verification
- `SLACK_CHANNEL_ID` - Target channel ID
- `DYNAMODB_TABLE_NAME` - Team data table name

### 2. Lambda Function (`micdrop-commands`)

**Trigger**: API Gateway HTTP requests from Slack
**Purpose**: Handle slash commands and interactive components
**Environment Variables**: Same as scheduler function

### 3. DynamoDB Table (`micdrop-team`)

**Schema**:

json

`{
  "id": "team_config", *// Partition Key*
  "teamMembers": ["alice.smith", "bob.jones", "charlie.brown"], *// Slack user IDs*
  "currentIndex": 0,
  "lastNotificationDate": "2025-09-16",
  "channelId": "C1234567890"
}`

### 4. EventBridge Rule

**Schedule**: `cron(0 13 * * ? *)` (13:00 UTC daily)
**Target**: micdrop-scheduler Lambda function

### 5. API Gateway

**Purpose**: Webhook endpoint for Slack interactions
**Target**: micdrop-commands Lambda function

### API Dependencies

### Slack Web API Endpoints

- `users.list` - Get team member list and display names
- `users.getPresence` - Check user availability status
- `users.profile.get` - Get user status text and emoji
- `chat.postMessage` - Send notification to channel

### Required Slack Permissions

- `users:read` - Access user profile information
- `chat:write` - Send messages to channels
- `channels:read` - Access channel information
- `commands` - Enable slash commands
- `im:write` - Send direct messages for confirmations

## Team Management UI

### Slack Slash Commands

### `/micdrop team` - View Current Team

Displays current team roster with interactive management buttons.

**Response**: Interactive message with:

- Current rotation order (numbered list)
- "Add Member" button
- "Remove Member" button
- "View Next Host" button

### `/micdrop add @username` - Quick Add Member

Adds specified user to the team rotation.

**Response**: Confirmation message or error if user already exists.

### `/micdrop remove @username` - Quick Remove Member

Removes specified user from team rotation.

**Response**: Confirmation message or error if user not found.

### `/micdrop next` - Preview Next Host

Shows who the next host will be without sending notification.

### Interactive UI Components

### Add Member Flow

1. User clicks "Add Member" button from `/micdrop team`
2. Modal opens with user selector dropdown (populated from workspace members)
3. User selects person to add
4. System validates user not already in team
5. User is inserted in alphabetical order
6. Confirmation message sent to channel
7. Original message updated with new team list

### Remove Member Flow

1. User clicks "Remove Member" button from `/micdrop team`
2. Modal opens with dropdown of current team members
3. User selects person to remove
4. Confirmation dialog: "Remove {name} from standup rotation?"
5. If confirmed, user is removed and rotation index adjusted if needed
6. Confirmation message sent to channel
7. Original message updated with new team list

### UI Message Templates

### Team Overview Message

`🎤 **MicDrop Team Rotation**

**Current Team** (5 members):
1. Alice Smith (@alice)
2. Bob Jones (@bob)  
3. Charlie Brown (@charlie)
4. Dana Wilson (@dana)
5. Eve Chen (@eve)

**Next Host**: Bob Jones
**Last Updated**: Sep 16, 2025 at 3:00 PM

[Add Member] [Remove Member] [View Next Host]`

### Confirmation Messages

`✅ **Added to Team**: @newuser has been added to the standup rotation
Position: #3 (alphabetical order)

❌ **Removed from Team**: @olduser has been removed from the standup rotation  
Rotation adjusted automatically

⚠️ **Error**: @username is already in the team rotation`

## Implementation Details

### Core Logic Flow

### Scheduled Notifications (micdrop-scheduler)

1. Check if tomorrow is Tuesday or Thursday
2. If not standup day, exit
3. Load team configuration from DynamoDB
4. Starting from currentIndex, find next available user:
    - Get user's Slack status
    - Check if status indicates unavailability
    - If available, select as host
    - If unavailable, increment index and repeat
5. Send notification message to Slack channel
6. Update currentIndex in DynamoDB
7. Log operation results

### Interactive Commands (micdrop-commands)

1. Verify Slack request signature
2. Parse command and parameters
3. For slash commands: Respond with appropriate UI or data
4. For interactive components: Handle button clicks and modal submissions
5. Update DynamoDB as needed
6. Send response or update original message

### Error Handling

- **All Users Unavailable**: Send message requesting manual host assignment
- **Slack API Failures**: Log error, send fallback message with last known host
- **Database Failures**: Log error, use in-memory fallback rotation
- **Invalid Configuration**: Send error message to channel with setup instructions

### Message Templates

### Standard Notification

`🎯 **Tomorrow's Standup Host**: <@{userId}>

📅 {dayName}, {date}
⏰ [Your usual standup time]

Thanks for hosting, {displayName}! 🙌`

### Fallback Messages

`⚠️ **Manual Host Assignment Needed**
All team members appear to be unavailable tomorrow. Please assign a standup host manually.

❌ **MicDrop Error**
Unable to determine tomorrow's host due to a technical issue. Last host: <@{lastUserId}>

Use `/micdrop team` to manage your standup rotation.`

## Configuration Management

### Initial Setup Data

json

`{
  "id": "team_config",
  "teamMembers": [], *// Populated during setup*
  "currentIndex": 0,
  "lastNotificationDate": null,
  "channelId": "TARGET_CHANNEL_ID"
}`

### Deployment Configuration

- **AWS Region**: eu-central-1 (Frankfurt - closest to Vienna)
- **Lambda Memory**: 128 MB
- **Lambda Timeout**: 30 seconds
- **DynamoDB Provisioned Capacity**: On-demand billing

## Testing Strategy

### Unit Tests

- Rotation logic with various team sizes
- Availability checking logic
- Message formatting
- Error handling scenarios

### Integration Tests

- Slack API authentication
- DynamoDB read/write operations
- EventBridge trigger functionality

### Manual Testing Scenarios

- Normal rotation cycle
- Single user unavailable
- Multiple users unavailable
- All users unavailable
- New user addition to team

## Monitoring & Observability

### CloudWatch Metrics

- Lambda invocation count and duration
- DynamoDB read/write operations
- Error rates and types

### Logging Requirements

- Log each host selection decision
- Log all Slack API calls and responses
- Log database operations
- Structured JSON logging for easy querying

## Security Considerations

- Store Slack tokens in AWS Secrets Manager
- Use least-privilege IAM roles
- Encrypt DynamoDB table at rest
- Validate all external API responses
- Sanitize user inputs in messages

## Future Enhancements (Out of Scope)

- Slack slash commands for manual team management
- Integration with Google Calendar/Outlook
- Historical reporting and analytics
- Multiple team support
- Custom rotation orders