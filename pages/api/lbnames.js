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

    const userIds = idsParam
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((n) => !isNaN(n));

    if (userIds.length === 0) {
      return res.status(400).json({ error: "No valid user IDs found." });
    }

    const results = [];

    for (const userId of userIds) {
      try {
        const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        if (!userRes.ok) continue; // skip invalid users

        const u = await userRes.json();
        results.push({
          userId: u.id,
          displayName: u.displayName,
          username: u.name,
          description: u.description,
          created: u.created,
          isBanned: u.isBanned,
        });
      } catch (e) {
        console.error(`Failed to fetch user ${userId}:`, e.message);
      }
    }

    return res.status(200).json({
      count: results.length,
      users: results,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
