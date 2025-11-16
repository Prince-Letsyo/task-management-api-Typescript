import { streamBus } from './stream-bus.event';
import { taskQueue } from '../queue';
import '../../jobs/email.job';

// Example: Log analytics
streamBus.on('user:registered', async (payload) => {
  console.log('Analytics: New user registered', payload.email);
  // await analytics.track('User Registered', payload);
});

// Example: Send push notification
streamBus.on('report:generated', async (payload) => {
  console.log(`Report ready for user ${payload.userId}: ${payload.reportUrl}`);
  // await sendPushNotification(payload.userId, 'Your report is ready!');
});

// Example: Trigger follow-up email after activation
streamBus.on('user:activated', async (payload) => {
  await taskQueue.add('send-followup-email', {
    userId: payload.userId,
  });
});
