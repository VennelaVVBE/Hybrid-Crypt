from flask import Flask, render_template, request, jsonify
from PIL import Image
from io import BytesIO
import base64
import math

app = Flask(__name__)


# ============================================================
# HILL CIPHER
# ============================================================

def mod_inverse(a, m=26):
    a %= m

    for x in range(1, m):
        if (a * x) % m == 1:
            return x

    raise ValueError(
        f"{a} has no modular inverse modulo {m}. "
        "Hill Cipher key is not invertible modulo 26."
    )


def parse_hill_key(key_text, size):
    rows = key_text.strip().split(";")

    if len(rows) != size:
        raise ValueError(
            f"For {size}x{size}, enter exactly {size} rows."
        )

    matrix = []

    for row in rows:
        values = [int(x.strip()) for x in row.split(",")]

        if len(values) != size:
            raise ValueError(
                f"Each row must contain exactly {size} numbers."
            )

        matrix.append([x % 26 for x in values])

    return matrix


def determinant_2x2(m):
    return m[0][0] * m[1][1] - m[0][1] * m[1][0]


def determinant_3x3(m):
    a, b, c = m[0]
    d, e, f = m[1]
    g, h, i = m[2]

    return (
        a * (e * i - f * h)
        - b * (d * i - f * g)
        + c * (d * h - e * g)
    )


def hill_inverse(matrix):
    size = len(matrix)

    if size == 2:
        det = determinant_2x2(matrix)
    elif size == 3:
        det = determinant_3x3(matrix)
    else:
        raise ValueError("Only 2x2 and 3x3 matrices are supported.")

    det_mod = det % 26

    if math.gcd(det_mod, 26) != 1:
        raise ValueError(
            f"Matrix determinant is {det_mod}. "
            "Hill Cipher key is not invertible modulo 26."
        )

    inverse_det = mod_inverse(det_mod, 26)

    if size == 2:
        a, b = matrix[0]
        c, d = matrix[1]

        return [
            [
                (d * inverse_det) % 26,
                (-b * inverse_det) % 26
            ],
            [
                (-c * inverse_det) % 26,
                (a * inverse_det) % 26
            ]
        ]

    cofactors = []

    for row in range(3):
        current = []

        for col in range(3):
            minor = []

            for r in range(3):
                if r == row:
                    continue

                minor_row = []

                for c in range(3):
                    if c == col:
                        continue

                    minor_row.append(matrix[r][c])

                minor.append(minor_row)

            minor_det = (
                minor[0][0] * minor[1][1]
                - minor[0][1] * minor[1][0]
            )

            sign = 1 if (row + col) % 2 == 0 else -1

            current.append(sign * minor_det)

        cofactors.append(current)

    adjugate = [
        [cofactors[col][row] for col in range(3)]
        for row in range(3)
    ]

    return [
        [
            (adjugate[r][c] * inverse_det) % 26
            for c in range(3)
        ]
        for r in range(3)
    ]


def hill_encrypt(text, key):
    size = len(key)

    text = "".join(
        c for c in text.upper()
        if c.isalpha()
    )

    if not text:
        raise ValueError(
            "Message must contain alphabetic characters."
        )

    while len(text) % size != 0:
        text += "X"

    result = ""

    for i in range(0, len(text), size):
        block = [
            ord(c) - 65
            for c in text[i:i + size]
        ]

        encrypted = []

        for row in range(size):
            value = sum(
                key[row][col] * block[col]
                for col in range(size)
            )

            encrypted.append(value % 26)

        result += "".join(
            chr(x + 65)
            for x in encrypted
        )

    return result


def hill_decrypt(cipher, key):
    inverse_key = hill_inverse(key)
    size = len(key)

    result = ""

    for i in range(0, len(cipher), size):
        block = [
            ord(c) - 65
            for c in cipher[i:i + size]
        ]

        if len(block) != size:
            continue

        decrypted = []

        for row in range(size):
            value = sum(
                inverse_key[row][col] * block[col]
                for col in range(size)
            )

            decrypted.append(value % 26)

        result += "".join(
            chr(x + 65)
            for x in decrypted
        )

    if result.endswith("X"):
        result = result[:-1]

    return result


# ============================================================
# S-DES
# ============================================================

P10 = [3, 5, 2, 7, 4, 10, 1, 9, 8, 6]
P8 = [6, 3, 7, 4, 8, 5, 10, 9]

IP = [2, 6, 3, 1, 4, 8, 5, 7]
IP_INV = [4, 1, 3, 5, 7, 2, 8, 6]

EP = [4, 1, 2, 3, 2, 3, 4, 1]
P4 = [2, 4, 3, 1]

S0 = [
    [1, 0, 3, 2],
    [3, 2, 1, 0],
    [0, 2, 1, 3],
    [3, 1, 3, 2]
]

S1 = [
    [0, 1, 2, 3],
    [2, 0, 1, 3],
    [3, 0, 1, 0],
    [2, 1, 0, 3]
]


def permute(bits, table):
    return "".join(bits[i - 1] for i in table)


def left_shift(bits, count):
    return bits[count:] + bits[:count]


def xor_bits(a, b):
    return "".join(
        "0" if x == y else "1"
        for x, y in zip(a, b)
    )


def generate_sdes_keys(key):
    if len(key) != 10 or any(c not in "01" for c in key):
        raise ValueError(
            "S-DES key must contain exactly 10 binary bits."
        )

    p10 = permute(key, P10)

    left = left_shift(p10[:5], 1)
    right = left_shift(p10[5:], 1)

    k1 = permute(left + right, P8)

    left = left_shift(left, 2)
    right = left_shift(right, 2)

    k2 = permute(left + right, P8)

    return k1, k2


def sbox(bits, box):
    row = int(bits[0] + bits[3], 2)
    column = int(bits[1] + bits[2], 2)

    return format(box[row][column], "02b")


def fk(bits, key):
    left = bits[:4]
    right = bits[4:]

    expanded = permute(right, EP)
    mixed = xor_bits(expanded, key)

    sbox_result = (
        sbox(mixed[:4], S0)
        + sbox(mixed[4:], S1)
    )

    p4_result = permute(sbox_result, P4)

    return xor_bits(left, p4_result) + right


def sdes_encrypt_block(block, key):
    k1, k2 = generate_sdes_keys(key)

    bits = permute(block, IP)
    bits = fk(bits, k1)

    bits = bits[4:] + bits[:4]

    bits = fk(bits, k2)

    return permute(bits, IP_INV)


def sdes_decrypt_block(block, key):
    k1, k2 = generate_sdes_keys(key)

    bits = permute(block, IP)
    bits = fk(bits, k2)

    bits = bits[4:] + bits[:4]

    bits = fk(bits, k1)

    return permute(bits, IP_INV)


def text_to_binary(text):
    return "".join(
        format(ord(c), "08b")
        for c in text
    )


def binary_to_text(binary):
    result = ""

    for i in range(0, len(binary), 8):
        byte = binary[i:i + 8]

        if len(byte) == 8:
            result += chr(int(byte, 2))

    return result


def sdes_encrypt_text(text, key):
    binary = text_to_binary(text)

    while len(binary) % 8 != 0:
        binary += "0"

    result = ""

    for i in range(0, len(binary), 8):
        result += sdes_encrypt_block(
            binary[i:i + 8],
            key
        )

    return result


def sdes_decrypt_text(binary, key):
    if len(binary) % 8 != 0:
        raise ValueError("Invalid S-DES binary data.")

    result = ""

    for i in range(0, len(binary), 8):
        result += sdes_decrypt_block(
            binary[i:i + 8],
            key
        )

    return binary_to_text(result)


# ============================================================
# LSB STEGANOGRAPHY
# ============================================================

def hide_data(image, binary_data):
    image = image.convert("RGB")

    pixels = list(image.getdata())

    header = format(len(binary_data), "032b")
    complete_data = header + binary_data

    capacity = len(pixels) * 3

    if len(complete_data) > capacity:
        raise ValueError(
            "The selected image is too small for this message."
        )

    data_index = 0
    new_pixels = []

    for pixel in pixels:
        rgb = list(pixel)

        for channel in range(3):
            if data_index < len(complete_data):
                bit = int(complete_data[data_index])

                rgb[channel] = (
                    rgb[channel] & 254
                ) | bit

                data_index += 1

        new_pixels.append(tuple(rgb))

    stego_image = Image.new("RGB", image.size)
    stego_image.putdata(new_pixels)

    return stego_image


def extract_data(image):
    image = image.convert("RGB")

    pixels = list(image.getdata())

    bits = ""

    for pixel in pixels:
        for value in pixel:
            bits += str(value & 1)

    if len(bits) < 32:
        raise ValueError("No hidden data found.")

    data_length = int(bits[:32], 2)

    start = 32
    end = start + data_length

    if end > len(bits):
        raise ValueError(
            "Hidden data is corrupted or invalid."
        )

    return bits[start:end]


# ============================================================
# HELPERS
# ============================================================

def matrix_to_string(matrix):
    return ";".join(
        ",".join(str(x) for x in row)
        for row in matrix
    )


def matrix_to_html(matrix):
    return [
        row[:] for row in matrix
    ]


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():
    return render_template("index.html")


# ============================================================
# CALCULATE INVERSE
# ============================================================

@app.route("/inverse", methods=["POST"])
def calculate_inverse():
    try:
        hill_key_text = request.form.get("hill_key", "")
        hill_size = int(request.form.get("hill_size", "2"))

        if hill_size not in [2, 3]:
            raise ValueError(
                "Hill Cipher size must be 2 or 3."
            )

        key = parse_hill_key(
            hill_key_text,
            hill_size
        )

        inverse = hill_inverse(key)

        determinant = (
            determinant_2x2(key)
            if hill_size == 2
            else determinant_3x3(key)
        )

        return jsonify({
            "status": "success",
            "matrix": matrix_to_html(key),
            "inverse_matrix": matrix_to_html(inverse),
            "determinant": determinant % 26,
            "message": "Matrix is invertible modulo 26."
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400


# ============================================================
# ENCRYPT
# ============================================================

@app.route("/encrypt", methods=["POST"])
def encrypt():
    try:
        message = request.form.get("message", "")
        hill_key_text = request.form.get("hill_key", "")
        hill_size = int(request.form.get("hill_size", "2"))
        sdes_key = request.form.get("sdes_key", "")
        image_file = request.files.get("image")

        if not message:
            raise ValueError("Please enter a message.")

        if hill_size not in [2, 3]:
            raise ValueError(
                "Hill Cipher size must be 2 or 3."
            )

        if not image_file:
            raise ValueError(
                "Please upload a cover image."
            )

        hill_key = parse_hill_key(
            hill_key_text,
            hill_size
        )

        inverse_key = hill_inverse(hill_key)

        hill_output = hill_encrypt(
            message,
            hill_key
        )

        sdes_output = sdes_encrypt_text(
            hill_output,
            sdes_key
        )

        original_image = Image.open(image_file)

        encrypted_image = hide_data(
            original_image,
            sdes_output
        )

        image_buffer = BytesIO()

        encrypted_image.save(
            image_buffer,
            format="PNG"
        )

        encoded_image = base64.b64encode(
            image_buffer.getvalue()
        ).decode("utf-8")

        return jsonify({
            "status": "success",
            "original_message": message,
            "hill_size": hill_size,
            "hill_output": hill_output,
            "sdes_output": sdes_output,
            "inverse_matrix": matrix_to_html(inverse_key),
            "image": encoded_image,
            "download_url":
                "data:image/png;base64," + encoded_image
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400


# ============================================================
# DECRYPT
# ============================================================

@app.route("/decrypt", methods=["POST"])
def decrypt():
    try:
        image_file = request.files.get("image")
        hill_key_text = request.form.get("hill_key", "")
        hill_size = int(request.form.get("hill_size", "2"))
        sdes_key = request.form.get("sdes_key", "")

        if not image_file:
            raise ValueError(
                "Please upload the encrypted image."
            )

        if hill_size not in [2, 3]:
            raise ValueError(
                "Hill Cipher size must be 2 or 3."
            )

        hill_key = parse_hill_key(
            hill_key_text,
            hill_size
        )

        inverse_key = hill_inverse(hill_key)

        image = Image.open(image_file)

        extracted_data = extract_data(image)

        sdes_decrypted = sdes_decrypt_text(
            extracted_data,
            sdes_key
        )

        original_message = hill_decrypt(
            sdes_decrypted,
            hill_key
        )

        return jsonify({
            "status": "success",
            "extracted_data": extracted_data,
            "sdes_output": sdes_decrypted,
            "original_message": original_message,
            "inverse_matrix": matrix_to_html(inverse_key)
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )