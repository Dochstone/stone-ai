"""Record a demo video of Stone AI chat for marketing."""

import asyncio
from playwright.async_api import async_playwright

OUTPUT = "C:/Users/Administrator/stone-ai/marketing/ad-reel/output/chat_demo.webm"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},  # iPhone 14 Pro size
            device_scale_factor=2,
            record_video_dir="C:/Users/Administrator/stone-ai/marketing/ad-reel/output/",
            record_video_size={"width": 390, "height": 844},
        )
        page = await context.new_page()

        # Login first
        print("1. Logging in...")
        await page.goto("https://stoneai.ru/webchat", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Fill login form
        email_input = page.locator('input[type="email"]')
        if await email_input.is_visible(timeout=5000):
            await email_input.fill("dochstone@gmail.com")
            await page.locator('input[type="password"]').fill("Asde123asd@")
            await page.locator('button[type="submit"]').click()
            await page.wait_for_timeout(3000)
            print("   Logged in")
        else:
            print("   Already logged in")

        # Wait for chat to load
        await page.wait_for_timeout(2000)

        # Close onboarding if visible
        for btn_text in ['Начать бесплатно', 'Пропустить', 'Далее']:
            try:
                btn = page.locator(f'text={btn_text}').first
                if await btn.is_visible(timeout=1500):
                    await btn.click()
                    await page.wait_for_timeout(500)
            except:
                pass
        # Also set localStorage to skip onboarding
        await page.evaluate("localStorage.setItem('stone_chat_onboarded', '1')")
        await page.wait_for_timeout(500)
        # Click any remaining overlay
        try:
            overlay = page.locator('.fixed.inset-0.z-\\[60\\]')
            if await overlay.is_visible(timeout=1000):
                await overlay.click(position={"x": 195, "y": 750})
                await page.wait_for_timeout(500)
        except:
            pass

        print("2. Chat loaded, starting recording...")
        await page.wait_for_timeout(1000)

        # Type a prompt slowly (simulating human typing)
        textarea = page.locator('textarea')
        if await textarea.is_visible(timeout=5000):
            prompt = "Напиши короткий пост для VK про AI-генерацию видео"
            for char in prompt:
                await textarea.type(char, delay=50)
            await page.wait_for_timeout(500)

            print("3. Sending message...")
            # Click send button
            send_btn = page.locator('[data-send-btn]')
            if await send_btn.is_visible(timeout=2000):
                await send_btn.click()
            else:
                await page.keyboard.press("Enter")

            # Wait for response to stream
            print("4. Waiting for AI response...")
            await page.wait_for_timeout(15000)  # Wait 15s for response

        print("5. Taking screenshots...")
        # Take high-res screenshots at different moments
        await page.screenshot(path="C:/Users/Administrator/stone-ai/marketing/ad-reel/output/chat_screenshot_1.png", full_page=False)

        # Scroll down to see full response
        await page.evaluate("document.querySelector('[class*=overflow-y-auto]')?.scrollTo(0, 99999)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="C:/Users/Administrator/stone-ai/marketing/ad-reel/output/chat_screenshot_2.png", full_page=False)

        print("6. Done! Closing...")
        await context.close()
        await browser.close()

        print(f"\nScreenshots saved to marketing/ad-reel/output/")
        print("Video saved automatically by Playwright")

asyncio.run(main())
