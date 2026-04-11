"""Record two demo clips of Stone AI for marketing."""

import asyncio
import os
from playwright.async_api import async_playwright

OUTDIR = "C:/Users/Administrator/stone-ai/marketing/ad-reel/output"

async def main():
    demo_email = os.getenv("STONE_DEMO_EMAIL", "")
    demo_password = os.getenv("STONE_DEMO_PASSWORD", "")
    if not demo_email or not demo_password:
        raise RuntimeError("Set STONE_DEMO_EMAIL and STONE_DEMO_PASSWORD before recording a demo")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ═══════════════════════════════════════
        # CLIP 1: GPT-5.4 dialogue
        # ═══════════════════════════════════════
        print("=== CLIP 1: GPT-5.4 Chat ===")
        ctx1 = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            record_video_dir=OUTDIR,
            record_video_size={"width": 390, "height": 844},
        )
        page = await ctx1.new_page()

        # Skip onboarding via localStorage before navigating
        await page.goto("https://stoneai.ru")
        await page.evaluate("localStorage.setItem('stone_chat_onboarded', '1')")
        await page.evaluate("localStorage.setItem('stone_onboarded', '1')")

        # Login
        await page.goto("https://stoneai.ru/webchat", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        email_input = page.locator('input[type="email"]')
        if await email_input.is_visible(timeout=3000):
            await email_input.fill(demo_email)
            await page.locator('input[type="password"]').fill(demo_password)
            await page.locator('button[type="submit"]').click()
            await page.wait_for_timeout(4000)

        # Close any overlays
        for _ in range(3):
            try:
                overlay = page.locator('.fixed.inset-0').first
                if await overlay.is_visible(timeout=500):
                    await overlay.click(position={"x": 195, "y": 750})
                    await page.wait_for_timeout(300)
            except:
                break

        await page.wait_for_timeout(1000)

        # Select GPT-5.4 model chip
        try:
            gpt5_chip = page.locator('text=GPT-5.4')
            if await gpt5_chip.is_visible(timeout=2000):
                await gpt5_chip.click()
                await page.wait_for_timeout(500)
        except:
            pass

        # Type prompt
        textarea = page.locator('textarea')
        await textarea.click()
        await page.wait_for_timeout(300)

        prompt1 = "Придумай 3 идеи для стартапа на базе AI в 2026 году"
        for char in prompt1:
            await textarea.type(char, delay=40)
        await page.wait_for_timeout(300)

        # Send
        await page.keyboard.press("Enter")
        print("  Message sent, waiting for response...")
        await page.wait_for_timeout(12000)

        # Screenshot
        await page.screenshot(path=f"{OUTDIR}/demo_gpt5_chat.png")
        print("  Screenshot saved")

        await page.wait_for_timeout(2000)
        await ctx1.close()
        print("  Clip 1 recorded")

        # ═══════════════════════════════════════
        # CLIP 2: Image generation
        # ═══════════════════════════════════════
        print("\n=== CLIP 2: Image Generation ===")
        ctx2 = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            record_video_dir=OUTDIR,
            record_video_size={"width": 390, "height": 844},
        )
        page2 = await ctx2.new_page()

        await page2.goto("https://stoneai.ru")
        await page2.evaluate("localStorage.setItem('stone_chat_onboarded', '1')")
        await page2.evaluate("localStorage.setItem('stone_onboarded', '1')")

        await page2.goto("https://stoneai.ru/webchat", wait_until="networkidle", timeout=30000)
        await page2.wait_for_timeout(2000)

        email_input2 = page2.locator('input[type="email"]')
        if await email_input2.is_visible(timeout=3000):
            await email_input2.fill(demo_email)
            await page2.locator('input[type="password"]').fill(demo_password)
            await page2.locator('button[type="submit"]').click()
            await page2.wait_for_timeout(4000)

        # Close overlays
        for _ in range(3):
            try:
                overlay = page2.locator('.fixed.inset-0').first
                if await overlay.is_visible(timeout=500):
                    await overlay.click(position={"x": 195, "y": 750})
                    await page2.wait_for_timeout(300)
            except:
                break

        await page2.wait_for_timeout(1000)

        # Switch to Фото tab
        try:
            photo_tab = page2.locator('text=Фото')
            if await photo_tab.is_visible(timeout=2000):
                await photo_tab.click()
                await page2.wait_for_timeout(1000)
        except:
            pass

        # Type image prompt
        textarea2 = page2.locator('textarea')
        await textarea2.click()
        await page2.wait_for_timeout(300)

        prompt2 = "Киберпанк город ночью, неоновые вывески, дождь, отражения в лужах"
        for char in prompt2:
            await textarea2.type(char, delay=35)
        await page2.wait_for_timeout(300)

        # Send
        await page2.keyboard.press("Enter")
        print("  Image prompt sent, waiting for generation...")
        await page2.wait_for_timeout(25000)  # Images take ~20s

        # Screenshot
        await page2.screenshot(path=f"{OUTDIR}/demo_image_gen.png")

        # Scroll to see image
        await page2.evaluate("document.querySelector('[class*=overflow-y-auto]')?.scrollTo(0, 99999)")
        await page2.wait_for_timeout(1000)
        await page2.screenshot(path=f"{OUTDIR}/demo_image_gen_2.png")
        print("  Screenshots saved")

        await page2.wait_for_timeout(2000)
        await ctx2.close()
        print("  Clip 2 recorded")

        await browser.close()
        print("\n=== DONE ===")
        print(f"Files in {OUTDIR}")

asyncio.run(main())
