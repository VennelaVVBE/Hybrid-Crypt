// ============================================================
// HILL MATRIX PLACEHOLDER
// ============================================================

function updateHillPlaceholder() {

    const size =
        document.getElementById("hillSize").value;

    const input =
        document.getElementById("hillKey");

    const help =
        document.getElementById("hillHelp");

    if (size === "3") {

        input.placeholder =
            "6,24,1;13,16,10;20,17,15";

        help.innerText =
            "Example: 6,24,1;13,16,10;20,17,15";

    } else {

        input.placeholder =
            "3,3;2,5";

        help.innerText =
            "Example: 3,3;2,5";
    }
}


function updateDecryptPlaceholder() {

    const size =
        document.getElementById("decryptHillSize").value;

    const input =
        document.getElementById("decryptHillKey");

    const help =
        document.getElementById("decryptHillHelp");

    if (size === "3") {

        input.placeholder =
            "6,24,1;13,16,10;20,17,15";

        help.innerText =
            "Enter the same 3×3 matrix used for encryption.";

    } else {

        input.placeholder =
            "3,3;2,5";

        help.innerText =
            "Enter the same 2×2 matrix used for encryption.";
    }
}


// ============================================================
// ENCRYPT
// ============================================================

async function encryptMessage() {

    const message =
        document.getElementById("message").value.trim();

    const hillKey =
        document.getElementById("hillKey").value.trim();

    const hillSize =
        document.getElementById("hillSize").value;

    const sdesKey =
        document.getElementById("sdesKey").value.trim();

    const image =
        document.getElementById("image").files[0];

    const resultBox =
        document.getElementById("result");


    if (!message) {

        alert("Please enter a secret message.");

        return;
    }


    if (!hillKey) {

        alert("Please enter a Hill Cipher matrix.");

        return;
    }


    if (!image) {

        alert("Please select a cover image.");

        return;
    }


    if (
        sdesKey.length !== 10 ||
        !/^[01]+$/.test(sdesKey)
    ) {

        alert(
            "S-DES key must contain exactly 10 binary digits."
        );

        return;
    }


    const formData =
        new FormData();

    formData.append(
        "message",
        message
    );

    formData.append(
        "hill_key",
        hillKey
    );

    formData.append(
        "hill_size",
        hillSize
    );

    formData.append(
        "sdes_key",
        sdesKey
    );

    formData.append(
        "image",
        image
    );


    resultBox.innerHTML = `
        <div class="result-card processing">

            <h2>⟳ PROCESSING ENCRYPTION...</h2>

            <p>
                Hill Cipher → S-DES → LSB Steganography
            </p>

        </div>
    `;


    try {

        const response =
            await fetch(
                "/encrypt",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.status === "error"
        ) {

            throw new Error(
                data.message ||
                "Encryption failed."
            );
        }


        resultBox.innerHTML = `

            <div class="result-card success">

                <h2>✓ ENCRYPTION COMPLETE</h2>


                <div class="result-item">

                    <span>ORIGINAL MESSAGE</span>

                    <div class="result-value">
                        ${escapeHtml(
                            data.original_message
                        )}
                    </div>

                </div>


                <div class="result-item">

                    <span>HILL CIPHER MATRIX</span>

                    <div class="matrix">
                        ${formatMatrix(data.hill_key)}
                    </div>

                </div>


                <div class="result-item">

                    <span>DETERMINANT MOD 26</span>

                    <div class="result-value">
                        ${data.determinant}
                    </div>

                </div>


                <div class="result-item">

                    <span>HILL CIPHER OUTPUT</span>

                    <div class="result-value">
                        ${escapeHtml(
                            data.hill_output
                        )}
                    </div>

                </div>


                <div class="result-item">

                    <span>S-DES OUTPUT</span>

                    <div class="result-value binary">
                        ${escapeHtml(
                            data.sdes_output
                        )}
                    </div>

                </div>


                <div class="result-item">

                    <span>INVERSE MATRIX</span>

                    <div class="matrix">
                        ${formatMatrix(data.inverse_key)}
                    </div>

                </div>


                <div class="result-item">

                    <span>STEGANOGRAPHY</span>

                    <div class="result-value">
                        ✓ Encrypted data successfully
                        hidden inside image.
                    </div>

                </div>


                <a
                    class="download-btn"
                    href="data:image/png;base64,${data.image}"
                    download="hybridcrypt_encrypted.png">

                    ↓ DOWNLOAD ENCRYPTED IMAGE

                </a>

            </div>
        `;

    }

    catch (error) {

        resultBox.innerHTML = `

            <div class="result-card error">

                <h2>✕ ENCRYPTION FAILED</h2>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>
        `;
    }
}


// ============================================================
// DECRYPT
// ============================================================

async function decryptMessage() {

    const image =
        document.getElementById(
            "decryptImage"
        ).files[0];


    const hillKey =
        document.getElementById(
            "decryptHillKey"
        ).value.trim();


    const hillSize =
        document.getElementById(
            "decryptHillSize"
        ).value;


    const sdesKey =
        document.getElementById(
            "decryptSdesKey"
        ).value.trim();


    const resultBox =
        document.getElementById(
            "decryptResult"
        );


    if (!image) {

        alert(
            "Please select the encrypted image."
        );

        return;
    }


    if (!hillKey) {

        alert(
            "Please enter the Hill Cipher matrix."
        );

        return;
    }


    if (
        sdesKey.length !== 10 ||
        !/^[01]+$/.test(sdesKey)
    ) {

        alert(
            "S-DES key must contain exactly 10 binary digits."
        );

        return;
    }


    const formData =
        new FormData();


    formData.append(
        "image",
        image
    );


    formData.append(
        "hill_key",
        hillKey
    );


    formData.append(
        "hill_size",
        hillSize
    );


    formData.append(
        "sdes_key",
        sdesKey
    );


    resultBox.innerHTML = `

        <div class="result-card processing">

            <h2>⟳ DECRYPTING...</h2>

            <p>
                Extracting → S-DES → Hill Cipher
            </p>

        </div>
    `;


    try {

        const response =
            await fetch(
                "/decrypt",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.status === "error"
        ) {

            throw new Error(
                data.message ||
                "Decryption failed."
            );
        }


        resultBox.innerHTML = `

            <div class="result-card success">

                <h2>✓ DECRYPTION COMPLETE</h2>


                <div class="result-item">

                    <span>EXTRACTED DATA</span>

                    <div class="result-value binary">
                        ${escapeHtml(
                            data.extracted_data
                        )}
                    </div>

                </div>


                <div class="result-item">

                    <span>S-DES DECRYPTED</span>

                    <div class="result-value">
                        ${escapeHtml(
                            data.sdes_output
                        )}
                    </div>

                </div>


                <div class="result-item">

                    <span>INVERSE MATRIX</span>

                    <div class="matrix">
                        ${formatMatrix(
                            data.inverse_key
                        )}
                    </div>

                </div>


                <div class="result-item original">

                    <span>ORIGINAL MESSAGE</span>

                    <div class="original-message">
                        ${escapeHtml(
                            data.original_message
                        )}
                    </div>

                </div>

            </div>
        `;

    }

    catch (error) {

        resultBox.innerHTML = `

            <div class="result-card error">

                <h2>✕ DECRYPTION FAILED</h2>

                <p>
                    ${escapeHtml(
                        error.message
                    )}
                </p>

            </div>
        `;
    }
}


// ============================================================
// MATRIX DISPLAY
// ============================================================

function formatMatrix(matrix) {

    if (!matrix) {
        return "";
    }

    return `
        <div class="matrix-box">
            ${matrix.map(
                row => `
                    <div class="matrix-row">
                        ${row.map(
                            value =>
                                `<span>${value}</span>`
                        ).join("")}
                    </div>
                `
            ).join("")}
        </div>
    `;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}