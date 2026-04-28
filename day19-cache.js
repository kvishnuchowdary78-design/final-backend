const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => console.log('Redis Error:', err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

// Cache-aside pattern
async function getActivities() {
  await connectRedis();

  const key = 'popular_activities';

  const cached = await client.get(key);

  if (cached) {
    console.log("⚡ Cache Hit");
    return JSON.parse(cached);
  }

  console.log("🐢 Cache Miss");

  const dbData = [
    { id: 1, name: 'Hiking' },
    { id: 2, name: 'Networking' }
  ];

  await client.setEx(key, 60, JSON.stringify(dbData));

  return dbData;
}

// Cache invalidation
async function updateActivity() {
  await connectRedis();

  console.log("Updating data...");

  await client.del('popular_activities');

  console.log("❌ Cache cleared");
}

// Run test
(async () => {
  console.log("First Call:");
  console.log(await getActivities());

  console.log("\nSecond Call:");
  console.log(await getActivities());

  await updateActivity();

  console.log("\nAfter Update:");
  console.log(await getActivities());
})();