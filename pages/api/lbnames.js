// pages/api/lbnames.js

export default async function handler(req, res) {
  try {
    // Accept user IDs from query: ?ids=123,456,789
    const idsParam = req.query.ids;

    if (!idsParam) {
      return res.status(400).json({
        error: "Missing user IDs. Provide ?ids=123,456 or similar",
      });
    }

    // Normalize into array of numbers
    const userIds = idsParam
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((n) => !isNaN(n));

    if (userIds.length === 0) {
      return res.status(400).json({ error: "No valid user IDs found." });
    }

    // Roblox batch user lookup
    const userRes = await fetch("https://users.roblox.com/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });

    if (!userRes.ok) {
      throw new Error(`Failed to fetch users: ${userRes.status}`);
    }

    const data = await userRes.json();
    const users = data.data || [];

    // Map simplified output
    const results = users.map((u) => ({
      userId: u.id,
      displayName: u.displayName,
      username: u.name,
      description: u.description,
      created: u.created,
      isBanned: u.isBanned,
    }));

    return res.status(200).json({
      count: results.length,
      users: results,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
