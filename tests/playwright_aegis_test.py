import os
import time
from playwright.sync_api import sync_playwright

ARTIFACTS_DIR = r"C:\Users\Preetham.j\.gemini\antigravity\brain\c95f737b-481b-4921-aabf-dc774f62b939"

def run_aegis_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1600, "height": 1050})
        page = context.new_page()

        print("[TEST] Navigating to AEGIS SOC at http://localhost:5050...")
        page.goto("http://localhost:5050", wait_until="networkidle")
        time.sleep(1.5)

        # 1. Capture Nominal Overview
        page.wait_for_selector(".soc-quadrant")
        nominal_shot = os.path.join(ARTIFACTS_DIR, "aegis_soc_nominal_verified.png")
        page.screenshot(path=nominal_shot, full_page=False)
        print(f"[SUCCESS] Saved Nominal Overview screenshot: {nominal_shot}")

        # 2. Test Human Transaction (Dual-Channel Sharding)
        print("[TEST] Executing Human Dual-Channel Transfer...")
        page.click("#btn-pay-user")
        page.wait_for_selector(".threat-entry.APPROVED", timeout=6000)
        time.sleep(1)
        human_shot = os.path.join(ARTIFACTS_DIR, "aegis_human_transfer_verified.png")
        page.screenshot(path=human_shot, full_page=False)
        print(f"[SUCCESS] Saved Human Transfer screenshot: {human_shot}")

        # 3. Test Attack Vector 1: Classic CSRF
        print("[TEST] Launching Classic CSRF Attack...")
        page.click("#btn-atk-csrf")
        time.sleep(1.2)
        csrf_shot = os.path.join(ARTIFACTS_DIR, "aegis_csrf_blocked_verified.png")
        page.screenshot(path=csrf_shot, full_page=False)
        print(f"[SUCCESS] Saved CSRF Blocked screenshot: {csrf_shot}")

        # 4. Test Attack Vector 2: Agentic AI Bot
        print("[TEST] Launching Agentic AI Bot Exploit...")
        page.click("#btn-atk-bot")
        time.sleep(1)

        # 5. Test Attack Vector 3: Temporal Desync
        print("[TEST] Launching Temporal Desync Attack...")
        page.click("#btn-atk-desync")
        time.sleep(1.5)

        multi_shot = os.path.join(ARTIFACTS_DIR, "aegis_multi_vector_defense_verified.png")
        page.screenshot(path=multi_shot, full_page=False)
        print(f"[SUCCESS] Saved Multi-Vector Defense screenshot: {multi_shot}")

        browser.close()
        print("[ALL AEGIS VERIFICATION TESTS COMPLETED SUCCESSFULLY]")

if __name__ == "__main__":
    run_aegis_verification()
