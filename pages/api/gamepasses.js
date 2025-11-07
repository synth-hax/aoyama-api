export default async function handler(req, res) {
  const { userId } = req.query;

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
      return res.status(200).json({
        userId,
        gamepasses: [],
        message: "No public games found.",
      });

    // Step 2: Fetch gamepasses from each universe
    const allPasses = [];

    for (const u of universes) {
      const passRes = await fetch(
        `https://apis.roblox.com/game-passes/v1/universes/${u.id}/game-passes?`
      );

      if (passRes.ok) {
        const passData = await passRes.json();
        if (passData.gamePasses?.length > 0) {
          passData.gamePasses.forEach((p) => {
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
    return res.status(200).json({
      userId,
      total: allPasses.length,
      gamepasses: allPasses,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
