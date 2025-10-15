// server.js
import express from "express";
import fetch from "node-fetch"; // remove this line if using Node 18+

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/api/gamepasses/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Step 1: Fetch public universes for the user
    const universeRes = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=10`
    );

    if (!universeRes.ok)
      throw new Error(`Failed to fetch universes: ${universeRes.status}`);

    const universeData = await universeRes.json();
    const universes = universeData.data || [];

    if (universes.length === 0)
      return res.json({ userId, gamepasses: [], message: "No public games found." });

    // Step 2: Fetch gamepasses from each universe
    const allPasses = [];

    for (const u of universes) {
      const passRes = await fetch(
        `https://games.roblox.com/v1/games/${u.id}/game-passes?limit=100`
      );

      if (passRes.ok) {
        const passData = await passRes.json();
        if (passData.data && passData.data.length > 0) {
          passData.data.forEach(p => {
            allPasses.push({
              ...p,
              universeId: u.id,
              universeName: u.name,
            });
          });
        }
      }
    }

    // Step 3: Return combined result
    return res.json({
      userId,
      total: allPasses.length,
      gamepasses: allPasses,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
