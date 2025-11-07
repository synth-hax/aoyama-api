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

        // Step 3: Fetch price for each gamepass in parallel
        const passesWithPrice = await Promise.all(
          passes.map(async (p) => {
            try {
              const productRes = await fetch(
                `https://api.roblox.com/marketplace/productinfo?assetId=${p.productId}`
              );
              const productData = await productRes.json();

              return {
                ...p,
                universeId: u.id,
                universeName: u.name,
                price: productData?.PriceInRobux ?? null, // null if not for sale
              };
            } catch (err) {
              console.error(`Failed to fetch price for productId ${p.productId}`, err);
              return { ...p, universeId: u.id, universeName: u.name, price: null };
            }
          })
        );

        return passesWithPrice;
      } catch (err) {
        console.error(`Failed to fetch gamepasses for universe ${u.id}`, err);
        return [];
      }
    });

    const passesArray = await Promise.all(gamepassPromises);
    const allPasses = passesArray.flat();

    // Step 4: Return combined result
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
