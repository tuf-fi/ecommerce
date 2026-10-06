// Mock mode: the app runs entirely on the fixtures in ./data.ts, with no backend. On by default for this branch;
// set NEXT_PUBLIC_MOCK_API=0 to talk to a real API again.
export const MOCK_API = process.env.NEXT_PUBLIC_MOCK_API !== "0";
