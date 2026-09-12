
const chat = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });
  
  setTimeout(() => {
    res.json({
      success: true,
      data: { reply: 'Based on your current crop data and local weather, I suggest reviewing your irrigation schedule. The recent soil moisture readings indicate adequate hydration.' }
    });
  }, 1000);
};

module.exports = { chat };
