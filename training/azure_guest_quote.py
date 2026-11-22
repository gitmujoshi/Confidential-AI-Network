#!/usr/bin/env python3
"""Read a SEV-SNP guest report from the node and submit it.

The report is read from the Linux TSM configfs interface. This process does
not create a report when that interface is missing, and it does not submit a
report that is not 1184 bytes.
"""

import base64
import json
import os
import sys
import urllib.error
import urllib.request

REPORT_SIZE = 0x4A0
CHIP_OFF = 0x1A0
CHIP_LEN = 64
TCB_OFF = 0x180
REPORT_DATA_LEN = 64


class QuoteUnavailable(Exception):
    pass


def read_tsm_report(report_data, root="/sys/kernel/config/tsm/report"):
    if not os.path.isdir(root):
        raise QuoteUnavailable(
            "SEV-SNP guest report interface is not available. No quote was created."
        )
    slot = os.path.join(root, "can-quote")
    os.makedirs(slot, exist_ok=True)
    blob = bytes(report_data[:REPORT_DATA_LEN]).ljust(REPORT_DATA_LEN, b"\x00")
    with open(os.path.join(slot, "inblob"), "wb") as handle:
        handle.write(blob)
    with open(os.path.join(slot, "outblob"), "rb") as handle:
        report = handle.read()
    if len(report) != REPORT_SIZE:
        raise QuoteUnavailable(
            f"Guest report was {len(report)} bytes. A SEV-SNP report is {REPORT_SIZE} bytes. No quote was submitted."
        )
    return report


def tcb_of(report):
    tcb = report[TCB_OFF:TCB_OFF + 8]
    return {
        "blSPL": tcb[0],
        "teeSPL": tcb[1],
        "snpSPL": tcb[6],
        "ucodeSPL": tcb[7],
    }


def chip_id_of(report):
    return report[CHIP_OFF:CHIP_OFF + CHIP_LEN].hex()


def kds_urls(report, product):
    chip = chip_id_of(report)
    tcb = tcb_of(report)
    query = "&".join(f"{name}={value}" for name, value in tcb.items())
    base = f"https://kdsintf.amd.com/vcek/v1/{product}/{chip}"
    return {
        "vcek": f"{base}?{query}",
        "chain": f"https://kdsintf.amd.com/vcek/v1/{product}/cert_chain",
    }


def der_to_pem(data):
    if data.startswith(b"-----BEGIN"):
        return data.decode("utf-8")
    body = base64.b64encode(data).decode("ascii")
    lines = [body[index:index + 64] for index in range(0, len(body), 64)]
    return "-----BEGIN CERTIFICATE-----\n" + "\n".join(lines) + "\n-----END CERTIFICATE-----\n"


def ask_from_chain(chain_pem):
    parts = []
    current = []
    for line in chain_pem.splitlines():
        current.append(line)
        if line.strip() == "-----END CERTIFICATE-----":
            parts.append("\n".join(current) + "\n")
            current = []
    if not parts:
        raise QuoteUnavailable("AMD certificate chain did not contain an ASK certificate.")
    return parts[0]


def fetch(url):
    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            return response.read()
    except urllib.error.URLError as error:
        raise QuoteUnavailable(f"AMD KDS request failed for {url}: {error}") from error


def submit_quote(api_url, job_id, token, body):
    target = api_url.rstrip("/") + f"/api/tdc/training/jobs/{job_id}/sev-snp-quote"
    request = urllib.request.Request(
        target,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise QuoteUnavailable(f"Quote submission was rejected ({error.code}): {detail}") from error


def collect(env=None):
    env = os.environ if env is None else env
    job_id = env.get("TRAINING_JOB_ID", "")
    api_url = env.get("CAN_API_URL", "")
    token = env.get("CAN_GUEST_QUOTE_TOKEN", "")
    product = env.get("AZURE_SNP_PRODUCT", "Milan")
    if not job_id or not api_url or not token:
        raise QuoteUnavailable(
            "TRAINING_JOB_ID, CAN_API_URL, and CAN_GUEST_QUOTE_TOKEN are required. No quote was submitted."
        )
    report = read_tsm_report(job_id.encode("utf-8"))
    urls = kds_urls(report, product)
    vcek = der_to_pem(fetch(urls["vcek"]))
    ask = ask_from_chain(fetch(urls["chain"]).decode("utf-8"))
    status = submit_quote(api_url, job_id, token, {
        "report": base64.b64encode(report).decode("ascii"),
        "vcekPem": vcek,
        "askPem": ask,
    })
    if status != 200:
        raise QuoteUnavailable(f"Quote submission returned HTTP {status}.")
    return status


def self_test():
    missing = "/tmp/can-tsm-missing"
    try:
        read_tsm_report(b"job", root=missing)
    except QuoteUnavailable as error:
        if "No quote was created" not in str(error):
            raise
    else:
        raise AssertionError("a missing TSM path created a quote")

    report = bytearray(REPORT_SIZE)
    report[0:4] = (2).to_bytes(4, "little")
    report[TCB_OFF] = 3
    report[TCB_OFF + 1] = 0
    report[TCB_OFF + 6] = 7
    report[TCB_OFF + 7] = 72
    report[CHIP_OFF:CHIP_OFF + 4] = b"\x01\x02\x03\x04"
    urls = kds_urls(bytes(report), "Milan")
    if "blSPL=3" not in urls["vcek"] or not urls["vcek"].startswith("https://kdsintf.amd.com/vcek/v1/Milan/"):
        raise AssertionError(urls["vcek"])
    if urls["chain"] != "https://kdsintf.amd.com/vcek/v1/Milan/cert_chain":
        raise AssertionError(urls["chain"])
    chain = (
        "-----BEGIN CERTIFICATE-----\nASK\n-----END CERTIFICATE-----\n"
        "-----BEGIN CERTIFICATE-----\nARK\n-----END CERTIFICATE-----\n"
    )
    if "ASK" not in ask_from_chain(chain) or "ARK" in ask_from_chain(chain):
        raise AssertionError("ASK was not the first certificate")
    print("azure guest quote self-test passed")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
        sys.exit(0)
    try:
        collect()
    except QuoteUnavailable as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
