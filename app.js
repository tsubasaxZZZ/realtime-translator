$(document).ready(function () {

    // ブラウザのキャッシュからキーとリージョンを取得。取得できなければインプットフィールドから取得
    localStorage.getItem("apiKey") ? $("#apiKey").val(localStorage.getItem("apiKey")) : $("apiKey").value = "";
    localStorage.getItem("region") ? $("#region").val(localStorage.getItem("region")) : $("region").value = "";
    localStorage.getItem("openAiKey") ? $("#azureOpenAiApiKey").val(localStorage.getItem("openAiKey")) : $("azureOpenAiApiKey").value = "";
    localStorage.getItem("openAiEndpoint") ? $("#azureOpenAiEndpoint").val(localStorage.getItem("openAiEndpoint")) : $("azureOpenAiEndpoint").value = "";
    localStorage.getItem("prompt") ? $("#prompt").val(localStorage.getItem("prompt")) : $("prompt").value = "";


    let speechConfig, audioConfig, recognizer;

    // 録音開始ボタンと音声認識・翻訳結果を表示する要素を取得する
    const toggleRecording = document.getElementById("toggleRecording");

    let isScrolling = true;

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
                if (isScrolling)
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

    const toggleStopScroll = document.getElementById("toggleStopScroll");

    toggleStopScroll.addEventListener("click", function () {
        console.log("toggleStopScroll");
        if (isScrolling) {
            toggleStopScroll.textContent = "Start scroll";
            isScrolling = false;
        } else {
            toggleStopScroll.textContent = "Stop scroll";
            isScrolling = true;
        }
    });

    $("#sendToOpenAI").on("click", function () {
        // 1) Azure OpenAI 用のキー＆エンドポイントを取得
        const openAiKey = $("#azureOpenAiApiKey").val().trim();
        const openAiEndpoint = $("#azureOpenAiEndpoint").val().trim();
        const prompt = $("#prompt").val().trim();

        if (!openAiKey || !openAiEndpoint) {
            alert("Azure OpenAIのAPIキーとエンドポイントURLを入力してください。");
            return;
        }

        // 2) ユーザがドラッグ選択したテキストを取得
        const selectedText = window.getSelection().toString().trim();
        if (!selectedText) {
            alert("テキストが選択されていません。");
            return;
        }


        const requestData = {
            messages: [
                {
                    role: "system", content: `
                    You are an excellent summary writer. You are also an SRE with good knowledge of Azure.
You need to understand and respond to user-provided meeting transcripts accurately and without halation. You need to say you don't know if you don't know without making assumptions or inferences about what the user has not provided. Here are some additional instructions from the user.
# Prompt
${prompt}
                ` },
                { role: "user", content: selectedText }
            ],
            max_tokens: 10000,       // 必要に応じて調整
            temperature: 0.7       // 必要に応じて調整
        };

        // 4) jQueryのajaxで直接POST
        $.ajax({
            url: openAiEndpoint,   // 例: https://xxxx.openai.azure.com/openai/deployments/xxx/chat/completions?api-version=2023-03-15-preview
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": openAiKey
            },
            data: JSON.stringify(requestData),
            success: function (response) {
                console.log("AzureOpenAI応答:", response);
                if (response && response.choices && response.choices.length > 0) {
                    // 5) 応答を #summary-by-gpt に表示
                    const aiReply = response.choices[0].message.content;
                    $("#summary-by-gpt").val(aiReply);
                } else {
                    $("#summary-by-gpt").val("応答が正しく取得できませんでした: " + JSON.stringify(response));
                }
            },
            error: function (err) {
                console.error("AzureOpenAI呼び出しエラー:", err);
                alert("API呼び出しに失敗しました。コンソールを確認してください。");
            }
        });
    });

    $("#saveSettings").on("click", function () {
        const key = $("#apiKey").val().trim();
        const region = $("#region").val().trim();
        localStorage.setItem("apiKey", key);
        localStorage.setItem("region", region);

        const openAiKey = $("#azureOpenAiApiKey").val().trim();
        const openAiEndpoint = $("#azureOpenAiEndpoint").val().trim();
        localStorage.setItem("openAiKey", openAiKey);
        localStorage.setItem("openAiEndpoint", openAiEndpoint);

        const prompt = $("#prompt").val().trim();
        localStorage.setItem("prompt", prompt);

    });

    $(document).on("click", "[id^='transcription-']", function () {
        if ($(this).css("background-color") === "rgb(255, 255, 0)") {
            $(this).css("background-color", "");
        } else {
            $(this).css("background-color", "rgb(255, 255, 0)");
        }
    });
});
