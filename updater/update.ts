import { MongoClient } from "mongodb";

const MONGO_URI = "mongodb+srv://manh:8RgX8BwZ8ni7UJcI@cluster0.wa2m7ym.mongodb.net/";
const DATABASE_NAME = "ifsc-data";
const EVENTS_COLLECTION = "events";
const FULL_RESULTS_COLLECTION = "fullResults_2";
const CUSTOM_REFERER = "https://ifsc.results.info/";
const PROCESS_FULL_RESULTS = true; // Set to false to only add events and skip full results

async function main() {
  const client = new MongoClient(MONGO_URI);

  // Progress tracking variables
  let totalEvents = 0;
  let insertedEvents = 0;
  let skippedEvents = 0;

  let totalFullResults = 0;
  let insertedFullResults = 0;
  let skippedFullResults = 0;

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DATABASE_NAME);
    const eventsCollection = db.collection(EVENTS_COLLECTION);
    const fullResultsCollection = db.collection(FULL_RESULTS_COLLECTION);

    // 1) Fetch season data
    // This example uses season 36, but you can adjust as needed.
    const seasonUrl = "https://ifsc.results.info/api/v1/seasons/36";
    console.log(`Fetching season data from: ${seasonUrl}`);
    const seasonResponse = await fetch(seasonUrl, { headers: { referer: CUSTOM_REFERER } });
    if (!seasonResponse.ok) {
      throw new Error(`Failed to fetch season data: ${seasonResponse.status} ${seasonResponse.statusText}`);
    }

    const seasonData = await seasonResponse.json();
    console.log(`Season fetched: ${seasonData.name}`);

    // 'seasonData' should have something like: { name: '2023', events: [...] }
    const events = seasonData.events || [];

    for (const eventItem of events) {
      totalEvents++;
      // The event's URL is something like "/api/v1/events/1389". Construct full URL.
      const eventUrl = `https://ifsc.results.info${eventItem.url}`;
      console.log(`Fetching event data for event_id=${eventItem.event_id} from: ${eventUrl}`);

      // 2) Fetch event data
      const eventResponse = await fetch(eventUrl, { headers: { referer: CUSTOM_REFERER } });
      if (!eventResponse.ok) {
        console.error(`Failed to fetch event data for event_id=${eventItem.event_id}`);
        skippedEvents++;
        continue; // Skip this event
      }

      const eventData = await eventResponse.json();
      console.log(`Fetched event data for event_id=${eventData.id}`);

      // Verify if the event doc already exists in the 'events' collection.
      // We'll use event_id as the unique identifier.
      const existingEvent = await eventsCollection.findOne({ id: eventData.id });
      if (!existingEvent) {
        // Insert it if it doesn't exist
        await eventsCollection.insertOne(eventData);
        console.log(`Inserted event doc for event_id=${eventData.id}`);
        insertedEvents++;
      } else {
        console.log(`Event doc already exists for event_id=${eventData.id}. Skipping insertion.`);
        skippedEvents++;
      }

      // Process full results only if PROCESS_FULL_RESULTS is true
      if (PROCESS_FULL_RESULTS) {
        // 3) For each d_cat in the event data, fetch its full results
        const dCats = eventData.d_cats || [];
        for (const cat of dCats) {
          totalFullResults++;
          // e.g. cat.full_results_url: "/api/v1/events/1389/result/1"
          if (!cat.full_results_url) {
            continue;
          }
          const resultsUrl = `https://ifsc.results.info${cat.full_results_url}`;
          console.log(`Fetching full results for event_id=${eventData.id} from: ${resultsUrl}`);

          const resultResponse = await fetch(resultsUrl, { headers: { referer: CUSTOM_REFERER } });
          if (!resultResponse.ok) {
            console.error(`Failed to fetch full results from ${resultsUrl}`);
            skippedFullResults++;
            continue;
          }

          const fullResultsData = await resultResponse.json();
          console.log(`Fetched full results for id=${eventData.id}, url=${cat.full_results_url}`);

          // Extract cid as the last number from the full_results_url
          const parts = cat.full_results_url.split('/');
          const cidStr = parts[parts.length - 1];
          const cid = parseInt(cidStr, 10);

          // Append id and cid fields to the fullResultsData
          fullResultsData.id = eventData.id;
          fullResultsData.cid = cid;

          // Use these fields to check for an existing full results document
          const existingFullResults = await fullResultsCollection.findOne({
            id: eventData.id,
            cid: cid
          });

          if (!existingFullResults) {
            // Insert the received document directly with appended fields
            await fullResultsCollection.insertOne(fullResultsData);
            console.log(`Inserted full results for id=${eventData.id}, cid=${cid}, url=${cat.full_results_url}`);
            insertedFullResults++;
          } else {
            console.log(`Full results already exist for id=${eventData.id}, cid=${cid}, url=${cat.full_results_url}. Skipping.`);
            skippedFullResults++;
          }
        }
      } else {
        console.log(`Skipping full results processing for event_id=${eventData.id} as PROCESS_FULL_RESULTS is false`);
      }
    }

    // Print summary of progress
    console.log("\n----- SUMMARY -----");
    console.log(`Total events processed: ${totalEvents}`);
    console.log(`Events inserted: ${insertedEvents}`);
    console.log(`Events skipped: ${skippedEvents}`);

    console.log(`Total full results processed: ${totalFullResults}`);
    console.log(`Full results inserted: ${insertedFullResults}`);
    console.log(`Full results skipped: ${skippedFullResults}`);

  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // Close out the connection to MongoDB
    await client.close();
    console.log("Connection closed.");
  }
}

main();