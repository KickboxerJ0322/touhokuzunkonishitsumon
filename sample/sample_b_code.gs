function doGet(e) {
  // TTS APIキーを設定
  const ttsApiKey = 'TTS APIキー'; // ここにTTS APIキーを入力

  // レスポンスとしてAPIキーを返す
  return ContentService.createTextOutput(JSON.stringify({ key: ttsApiKey }))
    .setMimeType(ContentService.MimeType.JSON);
}
