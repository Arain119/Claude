# 把 assets/models、assets/chars 下的 .glb 转成内嵌 glTF JSON（dist/assets/.../*.gltf.json），供 Artifact 发布
import base64, json, os, struct
for d in ['models', 'chars']:
    os.makedirs(f'dist/assets/{d}', exist_ok=True)
    for f in sorted(os.listdir(f'assets/{d}')):
        if not f.endswith('.glb'): continue
        b = open(f'assets/{d}/{f}', 'rb').read()
        assert b[:4] == b'glTF'
        off, js, bin_ = 12, None, b''
        while off < len(b):
            ln, typ = struct.unpack_from('<II', b, off); chunk = b[off + 8: off + 8 + ln]; off += 8 + ln
            if typ == 0x4E4F534A: js = json.loads(chunk)
            elif typ == 0x004E4942: bin_ = chunk
        js['buffers'][0]['uri'] = 'data:application/octet-stream;base64,' + base64.b64encode(bin_).decode()
        open(f'dist/assets/{d}/{f[:-4]}.gltf.json', 'w').write(json.dumps(js, separators=(',', ':')))
print('ok')
