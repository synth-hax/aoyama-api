export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // Step 1: Fetch public universes for the user
    const universeRes = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=10`
    );

    if (!universeRes.ok) {
      throw new Error(`Failed to fetch universes: ${universeRes.status}`);
    }

    const universeData = await universeRes.json();
    const universes = universeData.data || [];

    if (universes.length === 0) {
      return res.status(200).json({
        userId,
        total: 0,
        gamepasses: [],
        message: "No public games found.",
      });
    }

    // Step 2: Fetch gamepasses for each universe in parallel
    const gamepassPromises = universes.map(async (u) => {
      try {
        const passRes = await fetch(
          `https://apis.roblox.com/game-passes/v1/universes/${u.id}/game-passes`
        );

        if (!passRes.ok) return [];

        const passData = await passRes.json();
        const passes = passData.gamePasses || [];

        if (passes.length === 0) return [];

        // Step 3: Fetch prices via Marketplace v1 batch API
        const productIds = passes.map((p) => ({ id: p.productId }));
        const productRes = await fetch(
          'https://apis.roblox.com/marketplace/v1/products/details',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: productIds }),
          }
        );

        const productData = await productRes.json();
        const priceMap = {};

        productData.data?.forEach((item) => {
          priceMap[item.id] = item.priceInRobux ?? null;
        });

        // Step 4: Combine gamepasses with their prices
        return passes.map((p) => ({
          ...p,
          universeId: u.id,
          universeName: u.name,
          price: priceMap[p.productId] ?? null,
        }));
      } catch (err) {
        console.error(`Failed for universe ${u.id}:`, err);
        return [];
      }
    });

    const passesArray = await Promise.all(gamepassPromises);
    const allPasses = passesArray.flat();

    // Step 5: Return result
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
