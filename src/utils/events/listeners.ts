import { eventBus } from './event-bus';
import { taskQueue } from '../queue';
import '../../jobs/email.job';


// Example: Log analytics
eventBus.on('user:registered', async (payload) => {
  console.log('Analytics: New user registered', payload.email);
  // await analytics.track('User Registered', payload);
});

// Example: Send push notification
eventBus.on('report:generated', async (payload) => {
  console.log(`Report ready for user ${payload.userId}: ${payload.reportUrl}`);
  // await sendPushNotification(payload.userId, 'Your report is ready!');
});

// Example: Trigger follow-up email after activation
eventBus.on('user:activated', async (payload) => {
  await taskQueue.add('send-followup-email', {
    userId: payload.userId,
  });
});

// // Example: Webhook to external service
// eventBus.on('user:registered', async (payload) => {
//   try {
//     await fetch('https://webhook.site/xxx', {
//       method: 'POST',
//       body: JSON.stringify({ event: 'user:registered', ...payload }),
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (err) {
//     console.error('Webhook failed:', err);
//   }
// });