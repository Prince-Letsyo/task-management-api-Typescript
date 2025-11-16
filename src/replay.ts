import { streamBus } from './utils/events/stream-bus.event';
const replayStreams = async () => {
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;

  await streamBus.replay('user:registered', yesterday, (payload, id) => {
    console.log('REPLAY:', id, payload.email);
  });
};
replayStreams();
