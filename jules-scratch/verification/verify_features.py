import asyncio
import subprocess
import time
import psutil
import os
from playwright.async_api import async_playwright, Page, expect

def kill_proc_tree(pid, including_parent=True):
    try:
        parent = psutil.Process(pid)
        for child in parent.children(recursive=True):
            child.kill()
        if including_parent:
            parent.kill()
    except psutil.NoSuchProcess:
        pass

async def main():
    # Start the dev server
    server_process = subprocess.Popen("pnpm run dev", shell=True, preexec_fn=os.setsid)
    await asyncio.sleep(15)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()

            # --- Verification Step 1: Configure Screen ---
            await page.goto("http://localhost:5173/")

            # Go to screens tab
            await page.get_by_role("tab", name="Pantallas").click()
            await page.wait_for_selector(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6")

            # Click configure on the first screen
            first_screen_card = page.locator(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.gap-6 > div").first
            await first_screen_card.get_by_role("button", name="Configurar").click()

            # Select a new folder
            await page.get_by_role("combobox").click()
            await page.get_by_role("option", name="Eventos").click()
            await page.get_by_role("button", name="Guardar").click()

            # Verify the change
            await expect(first_screen_card.locator("p:has-text('Eventos')")).to_be_visible()
            await page.screenshot(path="jules-scratch/verification/screen_configured.png")
            print("Screenshot 1 taken: screen_configured.png")

            # Get localStorage data
            screens_data = await page.evaluate("() => localStorage.getItem('cms_screens')")
            media_files_data = await page.evaluate("() => localStorage.getItem('cms_media_files')")

            # --- Verification Step 2: Display Page Content ---
            display_page = await browser.new_page()
            await display_page.goto("http://localhost:5173/display.html")

            # Inject localStorage data
            await display_page.evaluate(f"localStorage.setItem('cms_screens', '{screens_data}')")
            await display_page.evaluate(f"localStorage.setItem('cms_media_files', '{media_files_data}')")

            # Reload the page to apply localStorage
            await display_page.reload()

            # Open the config modal
            for _ in range(5):
                await display_page.locator("#clickZone").click()

            # Wait for the options to be populated
            await display_page.wait_for_selector('option[value="screen-1"]')

            # Select the first screen
            await display_page.get_by_role("combobox").select_option(value="screen-1")
            await display_page.get_by_role("button", name="Guardar").click()

            # Wait for content to load and verify it's an image
            await asyncio.sleep(2) # Wait for content rotation
            await expect(display_page.locator("img.media-content")).to_be_visible()

            await display_page.screenshot(path="jules-scratch/verification/display_page.png")
            print("Screenshot 2 taken: display_page.png")

            await browser.close()

    finally:
        # Kill the server process
        kill_proc_tree(server_process.pid)
        print("Server process killed.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except RuntimeError as e:
        if str(e) == 'Event loop is closed':
            pass
        else:
            raise
