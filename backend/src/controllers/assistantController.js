// Grounded GenAI Assistant Controller
const { answerFarmerQuery } = require('../services/genAiService');

async function handleChat(req, res, next) {
  try {
    const { question, diagnosisContext, weatherContext, language } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    const answer = await answerFarmerQuery({
      question,
      diagnosisContext,
      weatherContext,
      language
    });

    res.json({
      answer,
      grounded: true,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleChat
};
