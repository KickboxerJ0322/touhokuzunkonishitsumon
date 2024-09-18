const fetch = require('node-fetch');

exports.sendToGemini = async (req, res) => {
  try {
    const transcript = req.body.transcript;
    const apiKey = 'Gemini APIのキー';  // ここにGemini APIのキーを設定
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `${transcript} あなたは東北ずん子という17歳の女性です。礼儀正しい話し方です。100字程度で簡潔に回答してください。`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    const response = await fetch(url, options);
    const json = await response.json();

    if (json && json.candidates && json.candidates.length > 0) {
      const responseText = json.candidates[0].content.parts[0].text || "No response text available.";
      res.json({ result: 'success', geminiResponse: truncateText(responseText, 120) });
    } else {
      res.json({ result: 'error', message: 'No response from Gemini API or unexpected response format.' });
    }
  } catch (error) {
    res.status(500).json({ result: 'error', message: error.toString() });
  }
};

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  let truncated = text.slice(0, maxLength);
  const lastPunctuation = Math.max(truncated.lastIndexOf('。'), truncated.lastIndexOf('、'), truncated.lastIndexOf(' '));
  if (lastPunctuation > 0) truncated = truncated.slice(0, lastPunctuation + 1);
  return truncated + '...';
}
