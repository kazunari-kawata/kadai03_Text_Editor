// 必要なグローバル変数を取得
const Header = window.Header;
const Quote = window.Quote;
const Embed = window.Embed;
const ImageTool = window.ImageTool;
const LinkTool = window.LinkTool;
const InlineCode = window.InlineCode;
const Delimiter = window.Delimiter;
const Table = window.Table;
const Code = window.CodeTool;
const Raw = window.RawTool;
const List = window.List;
const Warning = window.Warning;

// Editor.js を初期化
const editor = new EditorJS({
    holder: "editorjs",
    placeholder: "ここに文章を入力してください…",
    tools: {
        header: {
            class: Header,
            inlineToolbar: ["link", "bold", "italic"],
            config: {
                levels: [1, 2, 3, 4, 5],
                defaultLevel: 3,
            },
        },
        list: {
            class: EditorjsList,
            inlineToolbar: true,
            config: {
                defaultStyle: "unordered",
            },
        },
        quote: {
            class: Quote,
            inlineToolbar: ["link", "bold", "italic"],
        },
        embed: {
            class: Embed,
            inlineToolbar: true,
        },
        image: {
            class: ImageTool,
            inlineToolbar: true,
            config: {
                uploader: {
                    uploadByFile(file) {
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const base64Image = event.target.result;
                                // Base64形式の画像をlocalStorageに保存
                                localStorage.setItem(
                                    "uploadedImage",
                                    base64Image
                                );
                                resolve({
                                    success: 1,
                                    file: {
                                        url: base64Image,
                                    },
                                });
                            };
                            reader.onerror = (error) => {
                                console.error(
                                    "画像の読み込みに失敗しました:",
                                    error
                                );
                                reject(error);
                            };
                            reader.readAsDataURL(file);
                        });
                    },
                    uploadByUrl(url) {
                        return new Promise((resolve, reject) => {
                            resolve({
                                success: 1,
                                file: {
                                    url: url,
                                },
                            });
                        });
                    },
                },
            },
        },
        linkTool: {
            class: LinkTool,
            inlineToolbar: true,
        },
        inlineCode: {
            class: InlineCode,
            inlineToolbar: true,
        },
        delimiter: {
            class: Delimiter,
            inlineToolbar: true,
        },
        table: {
            class: Table,
            inlineToolbar: true,
            config: {
                rows: 2,
                cols: 3,
                maxRows: 5,
                maxCols: 5,
            },
        },
        code: {
            class: CodeTool,
            inlineToolbar: true,
        },
        raw: {
            class: RawTool,
            inlineToolbar: true,
        },
        warning: {
            class: Warning,
            inlineToolbar: true,
            shortcut: "CMD+SHIFT+W",
            config: {
                titlePlaceholder: "Title",
                messagePlaceholder: "Message",
            },
        },
    },
});

// 保存ボタンの動作
$("#save").on("click", () => {
    const title = $("#title").val();
    editor
        .save()
        .then((outputData) => {
            const fullData = {
                title: title,
                content: outputData.blocks,
            };
            console.log("保存されたデータ:", fullData);
            localStorage.setItem("editorData", JSON.stringify(fullData));
        })
        .catch((error) => {
            console.error("保存に失敗しました:", error);
        });
});

// 読み込みした時に保存データの復元
$(document).ready(function () {
    const savedData = localStorage.getItem("editorData");
    if (!savedData) return;

    if (savedData) {
        const parsedData = JSON.parse(savedData);

        $("#title").val(parsedData.title || "");

        editor.isReady.then(() => {
            if (parsedData.content) {
                editor.render({
                    blocks: parsedData.content,
                });
            }
        });
    }
});

//  ダウンロード
$("#download").on("click", () => {
    const title = $("#title").val();

    editor
        .save()
        .then((outputData) => {
            const fullData = {
                title: title,
                content: outputData.blocks,
            };
            const jsonString = JSON.stringify(fullData, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;

            const now = new Date();
            const timestamp =
                now.getFullYear().toString() +
                ("00" + (now.getMonth() + 1)).slice(-2) +
                ("00" + now.getDate()).slice(-2) +
                "-" +
                ("00" + now.getHours()).slice(-2) +
                ("00" + now.getMinutes()).slice(-2) +
                ("00" + now.getSeconds()).slice(-2);
            a.download = `editor-export-${timestamp}.json`;

            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        })
        .catch((error) => {
            console.error("エクスポートに失敗しました:", error);
            alert(
                "エクスポート中にエラーが発生しました。コンソールを確認してください。"
            );
        });
});

//  インポート
$("#upload").on("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);

            if (json.title !== undefined) {
                $("#title").val(json.title);
            }

            if (!Array.isArray(json.content)) {
                alert(
                    "読み込んだファイルの形式が正しくありません（content が配列ではありません）。"
                );
                return;
            }

            editor.isReady
                .then(() => {
                    return editor.render({ blocks: json.content });
                })
                .then(() => {
                    console.log("インポート完了:", json);
                })
                .catch((err) => {
                    console.error("レンダー中にエラー:", err);
                    alert(
                        "エディタへの復元でエラーが発生しました。コンソールを確認してください。"
                    );
                });
        } catch (parseError) {
            console.error("JSON のパースに失敗しました:", parseError);
            alert("読み込んだファイルが正しい JSON 形式ではありません。");
        }
    };

    reader.onerror = (err) => {
        console.error("ファイル読み込みエラー:", err);
        alert("ファイルの読み込みに失敗しました。");
    };

    reader.readAsText(file);
});

// カーソルを追って画面が下に動く
document.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
        setTimeout(async () => {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const node = range.startContainer;

            const blockElement =
                node.nodeType === 1 ? node : node.parentElement;
            if (blockElement) {
                blockElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        }, 50);
    }
});

// ダークモード
$(function () {
    const $darkToggle = $("#dark-mode");
    const $body = $("body");

    // ページ読み込み時に復元
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        $body.addClass("dark");
        $darkToggle.prop("checked", true);
    }

    // チェックが変わったとき
    $darkToggle.on("change", function () {
        if ($(this).is(":checked")) {
            // ON
            $body.addClass("dark");
            localStorage.setItem("theme", "dark");
        } else {
            // OFF
            $body.removeClass("dark");
            localStorage.setItem("theme", "light");
        }
    });
});

// 文字数カウント
function countTotalCharacters(data) {
    let total = 0;

    data.blocks.forEach((block) => {
        console.log("ブロックのデータ:", block); // デバッグ用
        switch (block.type) {
            case "paragraph":
            case "header":
            case "quote":
                const rawHtml = block.data.text || "";
                const textOnly = rawHtml.replace(/<[^>]+>/g, "");
                total += textOnly.length;
                break;

            case "list":
                if (block.data.items) {
                    block.data.items.forEach((itemText) => {
                        const plain = itemText.replace(/<[^>]+>/g, "");
                        total += plain.length;
                    });
                }
                break;

            case "code":
                if (block.data.code) {
                    total += block.data.code.length;
                }
                break;

            case "raw":
                const raw = block.data.html || "";
                const plainRaw = raw.replace(/<[^>]+>/g, "");
                total += plainRaw.length;
                break;

            default:
                break;
        }
    });

    return total;
}

// 文字数カウント処理
function updateCharacterCount() {
    editor
        .save()
        .then((outputData) => {
            console.log("Editor.jsの保存データ:", outputData); // デバッグ
            const totalChars = countTotalCharacters(outputData);
            $("#charCount").text(totalChars + "文字");
        })
        .catch((err) => {
            console.error("文字数カウント時にエラー:", err);
        });
}

editor.isReady
    .then(() => {
        console.log("Editor.js is ready!"); // デバッグ

        let debounceId = null;
        setInterval(() => {
            console.log("定期的に文字数を更新します"); // デバッグ
            updateCharacterCount();
        }, 500); // 0.5秒ごとに更新
    })
    .catch((err) => {
        console.error("Editor.js 初期化失敗:", err);
    });

// 画像復元
uploadImage(fileUrl).then((url) => {
    localStorage.setItem("uploadedImage", url);
    editor.save().then((outputData) => {
        const fullData = { content: outputData.blocks };
        localStorage.setItem("editorData", JSON.stringify(fullData));
    });
});

$(document).ready(() => {
    const savedData = localStorage.getItem("editorData");
    if (!savedData) return;

    const parsed = JSON.parse(savedData);
    editor.isReady.then(() => {
        editor.render({ blocks: parsed.content });
    });
});

$(document).ready(() => {
    const savedData = localStorage.getItem("editorData");
    if (!savedData) return;

    const parsed = JSON.parse(savedData);

    // rawブロックを編集可能な形式に変換
    parsed.content = parsed.content.map((block) => {
        if (block.type === "raw") {
            return {
                type: "paragraph",
                data: {
                    text: block.data.html, // rawのHTMLをparagraphのテキストとして設定
                },
            };
        }
        return block;
    });

    editor.isReady.then(() => {
        editor.render({ blocks: parsed.content });
    });
});
