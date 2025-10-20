// pages/api/lbnames.js

export default async function handler(req, res) {
  try {
    const ids = (req.query.ids || "").split(",").map(Number).filter(Boolean);
    const users = [];

    for (const id of ids) {
      const r = await fetch(`https://users.roblox.com/v1/users/${id}`);
      if (r.ok) users.push(await r.json());
      await new Promise((r) => setTimeout(r, 150)); // delay
    }

    res.status(200).json({ count: users.length, users });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
