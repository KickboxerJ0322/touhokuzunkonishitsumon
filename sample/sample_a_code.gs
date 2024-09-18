function transcribeAudioFile(fileId) {
  try {
    // Google DriveからMP3ファイルを取得
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var base64Audio = Utilities.base64Encode(blob.getBytes());
    
    // Google Cloud Speech-to-Text APIにリクエストを送信
    var apiKey = 'Google Cloud APIキー'; // ここにGoogle Cloud APIキーを入力
    var url = 'https://speech.googleapis.com/v1/speech:recognize?key=' + apiKey;
    
    var payload = {
      "config": {
        "encoding": "MP3",
        "sampleRateHertz": 16000,  // 録音時のサンプルレートに合わせて設定
        "languageCode": "ja-JP",   // 日本語の言語コード
        "enableAutomaticPunctuation": true,  // 自動句読点を有効にする
        "speechContexts": [
          {
            "phrases": ["特定の単語", "フレーズ"]
          }
        ]  // 必要に応じて強調したい単語やフレーズを追加
      },
      "audio": {
        "content": base64Audio
      }
    };
    
    var options = {
      "method" : "post",
      "contentType": "application/json",
      "payload" : JSON.stringify(payload)
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    Logger.log("API Response: " + responseText);  // レスポンスをログに出力して確認
    var json = JSON.parse(responseText);
    
    // 取得したテキストを返す
    if (json.results && json.results.length > 0) {
      return json.results[0].alternatives[0].transcript;
    } else {
      Logger.log("No speech detected in API response.");
      return "No speech detected.";
    }
  } catch (error) {
    Logger.log("Error in transcribeAudioFile: " + error.toString());  // エラーをログに出力
    return "Error: " + error.toString();
  }
}

function doPost(e) {
  try {
    Logger.log("Request parameters: " + JSON.stringify(e.parameters)); // 送信されたパラメータをログに記録

    if (e.parameters.text && e.parameters.text.length > 0) {
      // テキスト入力を処理
      var transcript = e.parameters.text[0]; // テキストを取得
      if (!transcript || transcript.trim() === "") {
        transcript = "ラーメンの種類を教えてください。";
      } else {
        transcript = transcript.replace(/[\r\n]+/g, ' ').trim();
      }

      var geminiResponse = sendToGemini(transcript);

      return ContentService.createTextOutput(JSON.stringify({
        'result': 'success',
        'transcript': transcript,
        'geminiResponse': geminiResponse
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (e.parameters.file && e.parameters.file.length > 0) {
      // 音声ファイルを処理
      var decodedFile = Utilities.base64Decode(e.parameters.file);
      var timestamp = new Date().getTime();
      var filename = 'recording_' + timestamp + '.mp3';

      var blob = Utilities.newBlob(decodedFile, 'audio/mp3', filename);
      
      // 音声ファイルをGoogle Driveに保存
      var folderId = '保存先フォルダID'; // 保存先フォルダID
      var folder = DriveApp.getFolderById(folderId);
      var file = folder.createFile(blob);
      Logger.log("File saved: " + file.getName() + " (ID: " + file.getId() + ")");

      // 音声ファイルをテキストに変換
      var transcript = transcribeAudioFile(file.getId());
      Logger.log("Transcript: " + transcript);

      if (!transcript || transcript.trim() === "") {
        transcript = "ラーメンの種類を教えてください。";
      }

      // テキストをGemini APIに送信
      var geminiResponse = sendToGemini(transcript);

      return ContentService.createTextOutput(JSON.stringify({
        'result': 'success',
        'transcript': transcript,
        'geminiResponse': geminiResponse
      })).setMimeType(ContentService.MimeType.JSON);

    } else {
      return ContentService.createTextOutput(JSON.stringify({
        'result': 'error',
        'error': 'No file or text provided.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (f) {
    Logger.log("Error in doPost: " + f.toString());
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'error': f.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendToGemini(transcript) {
  var url = 'Cloud FunctionsのURL';  // Cloud FunctionsのURL

  var payload = {
    "transcript": transcript
  };

  var options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    Logger.log("Gemini API Response: " + responseText);

    var json = JSON.parse(responseText);

    if (json && json.result === 'success') {
      return json.geminiResponse;
    } else {
      Logger.log("Error in Gemini API response: " + responseText);
      return "Error: " + json.message || "Unknown error occurred.";
    }
  } catch (error) {
    Logger.log("Error fetching from Gemini API: " + error.toString());
    return "Error: " + error.toString();
  }
}

