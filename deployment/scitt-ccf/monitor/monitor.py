#!/usr/bin/env python3
import time
import requests
import psutil
import os

def check_health():
    try:
        response = requests.get("http://localhost:8000/app/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    while True:
        health = check_health()
        print(f"Health check: {'OK' if health else 'FAILED'}")
        time.sleep(30)

if __name__ == "__main__":
    main()
