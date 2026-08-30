// ============================================================
// HILL CIPHER PLACEHOLDER
// ============================================================

function updateHillPlaceholder() {

    const size =
        document.getElementById("hillSize").value;

    const input =
        document.getElementById("hillKey");

    const help =
        document.getElementById("hillHelp");


    if (size === "2") {

        input.placeholder =
            "2×2 example: 3,3;2,5";

        help.textContent =
            "Enter 2 rows. Example: 3,3;2,5";

    } else {

        input.placeholder =
            "3×3 example: 6,24,1;13,16,10;20,17,15";

        help.textContent =
            "Enter 3 rows. Example: 6,24,1;13,16,10;20,17,15";
    }
}


function updateDecryptHillPlaceholder() {

    const size =
        document.getElementById("decryptHillSize").value;

    const input =
        document.getElementById("decryptHillKey");

    const help =
        document.getElementById("decryptHillHelp");


    if (size === "2") {

        input.placeholder =
            "2×2 example: 3,3;2,5";

        help.textContent =
            "Enter the same 2×2 Hill key used for encryption.";

    } else {

        input.placeholder =
            "3×3 example: 6,24,1;13,16,10;20,17,15";

        help.textContent =
            "Enter the same 3×3 Hill key used for encryption.";
    }
}


// ============================================================
// ENCRYPTION
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


    // ---------------- VALIDATION ----------------

    if (!message) {

        alert("Please enter a secret message.");

        return;
    }


    if (!hillKey) {

        alert("Please enter the Hill Cipher key.");

        return;
    }


    if (!image) {

        alert("Please select a cover image.");

        return;
    }


    if (
        !sdesKey ||
        sdesKey.length !== 10 ||
        !/^[01]+$/.test(sdesKey)
    ) {

        alert(
            "S-DES key must contain exactly 10 binary digits."
        );

        return;
    }


    // ---------------- FORM DATA ----------------

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


    // ---------------- PROCESSING ----------------

    resultBox.innerHTML = `

        <div class="result-card">

            <h2>⟳ PROCESSING ENCRYPTION...</h2>

            <p style="color:#84918a">
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


        // Convert base64 returned by Flask
        // into a downloadable image

        const downloadUrl =
            "data:image/png;base64," +
            data.image;


        resultBox.innerHTML = `

            <div class="result-card">

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

                    <span>HILL CIPHER OUTPUT</span>

                    <div class="result-value">

                        ${escapeHtml(
                            data.hill_output
                        )}

                    </div>

                </div>


                <div class="result-item">

                    <span>S-DES OUTPUT</span>

                    <div class="result-value">

                        ${escapeHtml(
                            data.sdes_output
                        )}

                    </div>

                </div>


                <div class="result-item">

                    <span>STEGANOGRAPHY</span>

                    <div class="result-value">

                        ✓ Encrypted data successfully
                        hidden inside the image.

                    </div>

                </div>


                <a
                    class="download-btn"
                    href="${downloadUrl}"
                    download="hybridcrypt_encrypted.png"
                >

                    ↓ DOWNLOAD ENCRYPTED IMAGE

                </a>

            </div>
        `;

    }

    catch (error) {

        resultBox.innerHTML = `

            <div class="result-card">

                <h2 style="color:#ff7777">
                    ✕ ENCRYPTION FAILED
                </h2>

                <p style="color:#ff7777">

                    ${escapeHtml(
                        error.message
                    )}

                </p>

            </div>
        `;
    }
}


// ============================================================
// DECRYPTION
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


    // ---------------- VALIDATION ----------------

    if (!image) {

        alert(
            "Please select the encrypted image."
        );

        return;
    }


    if (!hillKey) {

        alert(
            "Please enter the Hill Cipher key."
        );

        return;
    }


    if (
        !sdesKey ||
        sdesKey.length !== 10 ||
        !/^[01]+$/.test(sdesKey)
    ) {

        alert(
            "S-DES key must contain exactly 10 binary digits."
        );

        return;
    }


    // ---------------- FORM DATA ----------------

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


    // ---------------- PROCESSING ----------------

    resultBox.innerHTML = `

        <div class="result-card">

            <h2>⟳ DECRYPTING...</h2>

            <p style="color:#84918a">

                Extracting →
                S-DES →
                Hill Cipher

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

            <div class="result-card">

                <h2>✓ DECRYPTION COMPLETE</h2>


                <div class="result-item">

                    <span>EXTRACTED DATA</span>

                    <div class="result-value">

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

                    <span>ORIGINAL MESSAGE</span>

                    <div class="result-value">

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

            <div class="result-card">

                <h2 style="color:#ff7777">

                    ✕ DECRYPTION FAILED

                </h2>

                <p style="color:#ff7777">

                    ${escapeHtml(
                        error.message
                    )}

                </p>

            </div>
        `;
    }
}


// ============================================================
// HTML SECURITY
// ============================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


// ============================================================
// INITIAL SETUP
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateHillPlaceholder();

        updateDecryptHillPlaceholder();

    }
);
