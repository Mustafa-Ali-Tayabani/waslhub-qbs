"""Rebuild the deployable prototype in public/ from the .dc.html sources.
usage: python3 build.py . "WaslHub Supplier Portal.html" public
Reuses the loader shell, runtime and font assets of the original export ("WaslHub Supplier Portal.html");
swaps in the current Supplier Portal, Tenant Admin, Design System and StatusTag sources."""
import sys, os, re, json, base64, gzip, html
repo, old_bundle, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
old = open(old_bundle, encoding='utf-8').read()

def block(t):
    m = re.search(r'<script type="__bundler/'+t+r'">\s*(.*?)\s*</script>', old, re.S); return m.group(1)
manifest = json.loads(block('manifest'))
ext      = json.loads(block('ext_resources'))
old_tpl  = json.loads(block('template'))
shell    = old[:old.index('  <script type="__bundler/manifest">')]

uuid_of = {e['id']: e['uuid'] for e in ext}
SUPPORT_UUID = '63b45496-425b-4fd5-89a2-5cc8ca5cea5b'
STATUS_ID = './StatusTag.dc.html'

# font block from the old template: everything inside <helmet> up to the page's own <style>
m = re.search(r'<helmet>\s*(.*?)\n<style>\nbody', old_tpl, re.S)
font_block = m.group(1).strip()
assert '@font-face' in font_block and 'Material Symbols' in font_block

def pack(data: bytes, mime: str):
    return {'mime': mime, 'compressed': True, 'data': base64.b64encode(gzip.compress(data, 9)).decode()}

# refresh the StatusTag component from the current source
manifest[uuid_of[STATUS_ID]] = pack(open(os.path.join(repo,'StatusTag.dc.html'),'rb').read(), 'text/html')

SP_ID = './Supplier%20Portal.dc.html'   # COMPONENT_DIR + '/' + encodeURIComponent('Supplier Portal') + '.dc.html'
SP_UUID = '7c1f3a52-9b0e-4d6a-8f21-3e5b7d9c0a14'
_sp = open(os.path.join(repo,'Supplier Portal.dc.html'), encoding='utf-8').read()
_sp = re.sub(r'<link rel="(preconnect|stylesheet)" href="https://fonts\.googleapis\.com[^"]*">\n?', '', _sp)  # host page supplies the fonts
assert 'googleapis' not in _sp
manifest[SP_UUID] = pack(_sp.encode(), 'text/html')
BASE_EXT = [e for e in ext if e['id'] != STATUS_ID] + [{'id': STATUS_ID, 'uuid': uuid_of[STATUS_ID]}]
DS_EXT = BASE_EXT + [{'id': SP_ID, 'uuid': SP_UUID}]

LINKS = {'Supplier Portal.dc.html':'index.html', 'Tenant Admin.dc.html':'admin.html',
         'Design System &amp; Change Log.dc.html':'design-system.html', 'Design System & Change Log.dc.html':'design-system.html'}

RAW_TAGS = ('table','tbody','thead','tfoot','tr','td','th','caption','select')
_RAW_RE = re.compile(r'<(/?)(' + '|'.join(RAW_TAGS) + r')(?=[\s/>])', re.I)
def encode_raw_tags(doc):
    """Rename table/select tags inside <x-dc> to <sc-raw-*> (as the design tool's exporter does) so the browser's
    HTML parser cannot foster-parent <sc-for>/<sc-if> out of tables. Script blocks are left untouched."""
    a = doc.index('<x-dc'); b = doc.rindex('</x-dc>')
    body = doc[a:b]
    parts = re.split(r'(<script\b.*?</script>)', body, flags=re.S)
    parts = [p if p.startswith('<script') else _RAW_RE.sub(lambda m: '<' + m.group(1) + 'sc-raw-' + m.group(2).lower(), p) for p in parts]
    return doc[:a] + ''.join(parts) + doc[b:]

def build(src, out_name, title, ext_list, man):
    s = open(os.path.join(repo, src), encoding='utf-8').read()
    n = s.count('<script src="./support.js"></script>'); assert n == 1, (src, n)
    s = s.replace('<script src="./support.js"></script>', f'<script src="{SUPPORT_UUID}"></script>')
    s = s.replace('<meta name="viewport" content="width=device-width, initial-scale=1">',
                  f'<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>{html.escape(title)}</title>', 1)
    # fonts: drop Google Fonts links, inline the @font-face block pointing at bundled woff2 assets
    s2 = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\n?', '', s)
    s2, k = re.subn(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]+">\n?', '', s2)
    assert k == 2, (src, k)
    assert 'googleapis' not in s2 or s2.count('googleapis') == 0, src
    s2 = s2.replace('<helmet>\n', '<helmet>\n' + font_block + '\n', 1)
    for a, b in LINKS.items():
        s2 = s2.replace(f'href="{a}"', f'href="{b}"')
    assert '.dc.html"' not in s2, (src, re.findall(r'href="[^"]*\.dc\.html"', s2))
    s2 = encode_raw_tags(s2)
    assert not re.search(r'<(table|tbody|thead|tr|td|th|select)[\s>]', s2.split('<script')[0][s2.index('<x-dc'):]), src
    tpl_json = json.dumps(s2, ensure_ascii=False).replace('</', '<\\/')
    page_shell = shell.replace('<title>Bundled Page</title>', f'<title>{html.escape(title)}</title>', 1)
    assert page_shell != shell
    doc = (page_shell
        + '  <script type="__bundler/manifest">\n' + json.dumps(man, separators=(',',':')) + '\n  </script>\n'
        + '  <script type="__bundler/ext_resources">\n' + json.dumps(ext_list, separators=(',',':')) + '\n  </script>\n'
        + '  <script type="__bundler/page_order">\n[]\n  </script>\n'
        + '  <script type="__bundler/template">\n' + tpl_json + '\n  </script>\n</body>\n</html>\n')
    p = os.path.join(out, out_name); open(p,'w',encoding='utf-8').write(doc)
    print(f'{out_name:22s} {len(doc):>9,} bytes  <- {src}')

base_man = {k:v for k,v in manifest.items() if k != SP_UUID}
build('Supplier Portal.dc.html',            'index.html',         'WaslHub Supplier Portal', BASE_EXT, base_man)
build('Tenant Admin.dc.html',               'admin.html',         'WaslHub Tenant Admin',    BASE_EXT, base_man)
build('Design System & Change Log.dc.html', 'design-system.html', 'WaslHub Design System',   DS_EXT,   manifest)
