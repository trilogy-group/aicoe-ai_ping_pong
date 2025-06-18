import { config } from "dotenv";

// Load environment variables from .env file
config();

// Validate required API keys for testing
const requiredEnvVars = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "XAI_API_KEY",
];

const missingKeys: string[] = [];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    missingKeys.push(key);
  }
}

if (missingKeys.length > 0) {
  console.warn(`⚠️  Missing API keys: ${missingKeys.join(", ")}`);
  console.warn("   Some tests may be skipped. Add keys to .env file.");
}

// Global test utilities
declare global {
  var testUtils: {
    hasApiKey: (key: string) => boolean;
    skipIfMissingKey: (key: string) => void;
    createMockStream: (events: any[]) => ReadableStream;
  };
}

global.testUtils = {
  hasApiKey: (key: string) => !!process.env[key],

  skipIfMissingKey: (key: string) => {
    if (!process.env[key]) {
      console.log(`⏭️  Skipping test - missing ${key}`);
      return;
    }
  },

  createMockStream: (events: any[]) => {
    const encoder = new TextEncoder();
    let index = 0;

    return new ReadableStream({
      start(controller) {
        const sendNext = () => {
          if (index < events.length) {
            const event = JSON.stringify(events[index]) + "\n";
            controller.enqueue(encoder.encode(event));
            index++;
            setTimeout(sendNext, 10); // Small delay to simulate streaming
          } else {
            controller.close();
          }
        };
        sendNext();
      },
    });
  },
};
