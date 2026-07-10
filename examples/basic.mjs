import { Truckline, TrucklineError } from "../dist/index.js";

const tl = new Truckline({
  apiKey: process.env.TRUCKLINE_API_KEY,
});

try {
  console.log("sdk", tl.version);
  console.log(await tl.meta.version());
  const search = await tl.users.search({ q: "a", limit: 3 });
  console.log("users", search.users?.map((u) => u.name));
} catch (err) {
  if (err instanceof TrucklineError) {
    console.error(err.status, err.code, err.requestId, err.message);
    process.exitCode = 1;
  } else {
    throw err;
  }
}
