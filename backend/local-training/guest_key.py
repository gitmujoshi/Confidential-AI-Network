"""Clean-room guest crypto.

The guest holds sk_ccr. It opens HPKE seals from owner brokers and decrypts
CANSEAL1 dataset and model envelopes. This process is the local training
container. It is not a hardware TEE, and the attestation report stays simulated.
"""

import base64
import hashlib
import hmac
import json
import os
import sys

from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import serialization

KEM_ID = 0x0020
KDF_ID = 0x0001
AEAD_ID = 0x0001
NSECRET = 32
NK = 16
NN = 12


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(text: str) -> bytes:
    pad = "=" * ((4 - len(text) % 4) % 4)
    return base64.urlsafe_b64decode(text + pad)


def _i2osp(value: int, length: int) -> bytes:
    return value.to_bytes(length, "big")


def _extract(salt: bytes, ikm: bytes) -> bytes:
    used = salt if salt else bytes(32)
    return hmac.new(used, ikm, hashlib.sha256).digest()


def _expand(prk: bytes, info: bytes, length: int) -> bytes:
    previous = b""
    chunks = []
    rounds = (length + 31) // 32
    for i in range(1, rounds + 1):
        previous = hmac.new(prk, previous + info + bytes([i]), hashlib.sha256).digest()
        chunks.append(previous)
    return b"".join(chunks)[:length]


def _labeled_extract(suite_id: bytes, salt: bytes, label: bytes, ikm: bytes) -> bytes:
    return _extract(salt, b"HPKE-v1" + suite_id + label + ikm)


def _labeled_expand(suite_id: bytes, prk: bytes, label: bytes, info: bytes, length: int) -> bytes:
    return _expand(prk, _i2osp(length, 2) + b"HPKE-v1" + suite_id + label + info, length)


KEM_SUITE = b"KEM" + _i2osp(KEM_ID, 2)
HPKE_SUITE = b"HPKE" + _i2osp(KEM_ID, 2) + _i2osp(KDF_ID, 2) + _i2osp(AEAD_ID, 2)


def _zero(buf: bytearray) -> None:
    for i in range(len(buf)):
        buf[i] = 0


def generate_keypair():
    private = X25519PrivateKey.generate()
    raw_private = private.private_bytes(
        serialization.Encoding.Raw,
        serialization.PrivateFormat.Raw,
        serialization.NoEncryption(),
    )
    raw_public = private.public_key().public_bytes(
        serialization.Encoding.Raw,
        serialization.PublicFormat.Raw,
    )
    return bytearray(raw_private), "hpke1." + _b64url(raw_public)


def _exchange(raw_private: bytes, raw_public: bytes) -> bytes:
    private = X25519PrivateKey.from_private_bytes(raw_private)
    public = X25519PublicKey.from_public_bytes(raw_public)
    return private.exchange(public)


def _public_from_private(raw_private: bytes) -> bytes:
    private = X25519PrivateKey.from_private_bytes(raw_private)
    return private.public_key().public_bytes(
        serialization.Encoding.Raw,
        serialization.PublicFormat.Raw,
    )


def _key_schedule(shared_secret: bytes, info: bytes):
    psk_id_hash = _labeled_extract(HPKE_SUITE, b"", b"psk_id_hash", b"")
    info_hash = _labeled_extract(HPKE_SUITE, b"", b"info_hash", info or b"")
    context = bytes([0]) + psk_id_hash + info_hash
    secret = _labeled_extract(HPKE_SUITE, shared_secret, b"secret", b"")
    return {
        "key": _labeled_expand(HPKE_SUITE, secret, b"key", context, NK),
        "base_nonce": _labeled_expand(HPKE_SUITE, secret, b"base_nonce", context, NN),
    }


def open_wrapped(raw_private: bytes, wrapped: str, info: bytes = b"", aad: bytes = b"") -> bytearray:
    if not str(wrapped).startswith("hpke1."):
        raise ValueError("Wrapped key is not HPKE.")
    packed = _b64url_decode(str(wrapped)[len("hpke1."):])
    enc = packed[:32]
    ciphertext = packed[32:]
    recipient_public = _public_from_private(raw_private)
    shared_dh = _exchange(raw_private, enc)
    eae = _labeled_extract(KEM_SUITE, b"", b"eae_prk", shared_dh)
    shared_secret = _labeled_expand(KEM_SUITE, eae, b"shared_secret", enc + recipient_public, NSECRET)
    schedule = _key_schedule(shared_secret, info)
    body = ciphertext[:-16]
    tag = ciphertext[-16:]
    aes = AESGCM(schedule["key"])
    plaintext = bytearray(aes.decrypt(schedule["base_nonce"], body + tag, aad or None))
    return plaintext


def seal_canseal(key: bytes, plaintext: bytes, key_type: str, owner_id: str) -> bytes:
    nonce = os.urandom(12)
    header = {
        "v": 1,
        "alg": "AES-256-GCM",
        "nonce": _b64url(nonce),
        "keyType": key_type,
        "ownerId": owner_id,
    }
    ciphertext = AESGCM(key).encrypt(nonce, plaintext, None)
    return b"CANSEAL1\n" + json.dumps(header).encode("utf-8") + b"\n" + ciphertext


def decrypt_canseal(key: bytes, blob: bytes) -> bytearray:
    if not blob.startswith(b"CANSEAL1\n"):
        raise ValueError("Dataset or model file is not a CANSEAL1 envelope.")
    rest = blob[len(b"CANSEAL1\n"):]
    line, _, ciphertext = rest.partition(b"\n")
    header = json.loads(line.decode("utf-8"))
    if header.get("alg") != "AES-256-GCM":
        raise ValueError("CANSEAL1 envelope is not AES-256-GCM.")
    nonce = _b64url_decode(header["nonce"])
    return bytearray(AESGCM(key).decrypt(nonce, ciphertext, None))


def _selftest() -> None:
    raw_private, public = generate_keypair()
    dek = os.urandom(32)

    # Round-trip a CANSEAL1 envelope with the owner key.
    blob = seal_canseal(dek, b"training-bytes", "DEK", "did:can:tdp")
    opened = decrypt_canseal(dek, blob)
    if bytes(opened) != b"training-bytes":
        raise SystemExit("CANSEAL1 round trip failed")
    _zero(opened)
    print("ok")


def _open_stdin() -> None:
    payload = json.loads(sys.stdin.read())
    raw_private = _b64url_decode(payload["privateKey"])
    plaintext = open_wrapped(raw_private, payload["wrappedKey"])
    sys.stdout.write(_b64url(bytes(plaintext)))
    _zero(plaintext)


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    if command == "selftest":
        _selftest()
    elif command == "open-stdin":
        _open_stdin()
    else:
        raise SystemExit("usage: guest_key.py selftest|open-stdin")
