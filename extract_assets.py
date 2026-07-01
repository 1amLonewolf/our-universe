from pathlib import Path
import re

root = Path(__file__).resolve().parent
index_path = root / 'index.html'
text = index_path.read_text(encoding='utf-8')

style_match = re.search(r'<style>(.*?)</style>', text, re.S)
script_match = re.search(r'<script>(.*?)</script>\s*</body>', text, re.S)

if not style_match or not script_match:
    raise SystemExit('Could not find the main style/script blocks to extract.')

(root / 'css').mkdir(exist_ok=True)
(root / 'js').mkdir(exist_ok=True)
(root / 'css' / 'styles.css').write_text(style_match.group(1), encoding='utf-8')
(root / 'js' / 'script.js').write_text(script_match.group(1), encoding='utf-8')

updated = text.replace(style_match.group(0), '<link rel="stylesheet" href="css/styles.css">', 1)
updated = updated.replace(script_match.group(0), '<script src="js/script.js"></script>\n</body>', 1)
index_path.write_text(updated, encoding='utf-8')
print('Extracted css/styles.css and js/script.js and updated index.html')
