$(document).ready(function () {

    // ブラウザのキャッシュからキーとリージョンを取得。取得できなければインプットフィールドから取得
    localStorage.getItem("apiKey") ? $("#apiKey").val(localStorage.getItem("apiKey")) : $("apiKey").value = "";
    localStorage.getItem("region") ? $("#region").val(localStorage.getItem("region")) : $("region").value = "";


    let speechConfig, audioConfig, recognizer;

    // 録音開始ボタンと音声認識・翻訳結果を表示する要素を取得する
    const toggleRecording = document.getElementById("toggleRecording");

    let count = 1;
    // 録音開始ボタンがクリックされたときの処理
    toggleRecording.addEventListener("click", function () {
        // 録音開始ボタンのテキストによって処理を分岐する
        if (toggleRecording.textContent === "録音開始") {
            // キーをinputフィールドから取得
            const key = $("#apiKey").val();
            const region = $("#region").val();
            // If key and region are empty, display alert
            if (key === "" || region === "") {
                alert("Please enter your API key and region.");
                return;
            }
            speechConfig = SpeechSDK.SpeechTranslationConfig.fromSubscription(key, region);

            speechConfig.speechRecognitionLanguage = "en-US";
            speechConfig.addTargetLanguage("ja");

            // 音声入力の設定オブジェクトを作成する
            // ここではマイクロフォンからの入力を選択していますが、他の入力も選択できます
            audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

            // 音声認識・翻訳オブジェクト（TranslationRecognizer）を作成する
            recognizer = new SpeechSDK.TranslationRecognizer(speechConfig, audioConfig);

            // キーとリージョンをブラウザのキャッシュに保存
            localStorage.setItem("apiKey", key);
            localStorage.setItem("region", region);

            recognizer.recognizing = function (s, e) {
                // 既存の要素があればそのまま使う
                let transcription = document.getElementById("transcription-" + count);
                let translation = document.getElementById("translation-" + count);
                // 新しい div 要素を作成する
                if (!transcription) {
                    let resultsSection = document.getElementsByClassName("results-section")[0];
                    transcription = document.createElement("div");
                    transcription.id = "transcription-" + count;
                    translation = document.createElement("div");
                    translation.id = "translation-" + count;
                    resultsSection.appendChild(transcription);
                    resultsSection.appendChild(translation);
                }
                // 音声認識の部分的な結果を表示する
                transcription.textContent = e.result.text;
                // 翻訳結果を取得する
                const translations = e.result.translations;
                // 翻訳先の言語コードを取得する
                const targetLanguage = speechConfig.targetLanguages[0];
                // 翻訳結果を表示する
                translation.textContent = translations.get(targetLanguage);
                var element = document.documentElement;
                var bottom = element.scrollHeight - element.clientHeight;
                //console output element and bottom
                console.log(element);
                console.log(bottom);
                window.scrollTo(0, bottom);
            };

            // 音声認識・翻訳が完了したときの処理
            recognizer.recognized = function (s, e) {
                // 既存の要素があればそのまま使う
                let transcription = document.getElementById("transcription-" + count);
                let translation = document.getElementById("translation-" + count);
                // 音声認識の最終的な結果を表示する
                transcription.textContent = e.result.text;
                // 翻訳結果を取得する
                const translations = e.result.translations;
                // 翻訳先の言語コードを取得する
                const targetLanguage = speechConfig.targetLanguages[0];
                // 翻訳結果を表示する
                translation.textContent = translations.get(targetLanguage);
                //resultsSection.scrollTo(0, resultsSection.scrollHeight);
                count++;
            };

            // 音声認識・翻訳を開始する
            recognizer.startContinuousRecognitionAsync();

            // 録音開始ボタンのテキストを録音停止に変更する
            toggleRecording.textContent = "録音停止";
        } else {
            // 録音開始ボタンのテキストを録音開始に変更する
            toggleRecording.textContent = "録音開始";
            // 音声認識・翻訳を停止する
            recognizer.stopContinuousRecognitionAsync();
        }
    });


});
