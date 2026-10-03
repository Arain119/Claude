/* ---------------- 动漫渲染：赛璐璐着色 + 描边 ---------------- */
// 两阶色：受光面 / 阴影面（阴影由天空半球光补成偏蓝紫的冷色，接近新海诚、京阿尼的上色方式）
const ANIME_GRAD = (() => { const d = new Uint8Array([150, 150, 150, 255, 150, 150, 150, 255, 236, 236, 236, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const ANIME_LINE = lin(0x2b2236);
const ANIME_MATS = [];
// 平涂底色补光：白天较强，夜里减弱（避免角色在夜里自发光）
function animeUpdate(night) { const k = lerp(0.3, 0.05, night); for (const m of ANIME_MATS) m.emissive.setScalar(k); }
function animeToon(src, skinning) {
  const m = new THREE.MeshToonMaterial({ map: src && src.map || null, color: src && src.color ? src.color.clone() : new THREE.Color(1, 1, 1), gradientMap: ANIME_GRAD, skinning: !!skinning });
  if (m.map) { m.map.anisotropy = Math.max(m.map.anisotropy || 1, 4); m.emissiveMap = m.map; }
  m.emissive.setScalar(0.3); ANIME_MATS.push(m);
  return m;
}
// 背面外扩描边（width 以米计，随距离略加粗，保证远处仍可见）
function animeOutline(width, skinning) {
  const m = new THREE.MeshBasicMaterial({ color: ANIME_LINE, side: THREE.BackSide, skinning: !!skinning });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.outlineW = { value: width };
    sh.vertexShader = 'uniform float outlineW;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', 'vec3 transformed = vec3(position);')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 c0 = modelViewMatrix * vec4(transformed, 1.0); float k = outlineW * clamp(-c0.z * 0.12, 1.0, 3.0);
          vec3 on = normal;
          #ifdef USE_SKINNING
            mat4 sm = bindMatrixInverse * (skinWeight.x * boneMatX + skinWeight.y * boneMatY + skinWeight.z * boneMatZ + skinWeight.w * boneMatW) * bindMatrix; on = (sm * vec4(normal, 0.0)).xyz;
          #endif
          vec3 n = normalize(normalMatrix * on); mvPosition = c0 + vec4(n * k, 0.0); gl_Position = projectionMatrix * mvPosition; }`);
  };
  return m;
}
// 给普通模型加描边（与原网格共享几何）
function addOutline(mesh, width) {
  const o = new THREE.Mesh(mesh.geometry, animeOutline(width, false)); o.castShadow = false; o.receiveShadow = false; o.matrixAutoUpdate = false; mesh.add(o); return o;
}

/* 把切好的身体部件合成一个蒙皮网格：部件 → 骨骼一一对应，动画仍沿用 poseCharacter */
const SKIN_PARTS = ['hips', 'torso', 'head', 'uaL', 'faL', 'thL', 'shL', 'uaR', 'faR', 'thR', 'shR'];
function buildSkinGeo(M) {
  const off = (p) => {
    const sg = p.endsWith('L') ? 1 : -1, k = p.slice(0, 2);
    if (p === 'hips' || p === 'torso') return [0, M.hipY, 0]; if (p === 'head') return [0, M.neckY, 0];
    if (k === 'ua') return [sg * M.shoulderX, M.armY, 0]; if (k === 'fa') return [sg * M.shoulderX, M.armY - (M.elbowX - M.shoulderX), 0];
    if (k === 'th') return [sg * M.legX, M.hipY, 0]; return [sg * M.legX, M.kneeY, 0];
  };
  let n = 0; for (const p of SKIN_PARTS) n += M.g[p].attributes.position.count;
  const hasUV = !!M.g.torso.attributes.uv;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = hasUV ? new Float32Array(n * 2) : null, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  let o = 0;
  SKIN_PARTS.forEach((p, bi) => {
    const g = M.g[p], P = g.attributes.position, Nn = g.attributes.normal, U = g.attributes.uv, d = off(p);
    for (let i = 0; i < P.count; i++, o++) {
      pos[o * 3] = P.getX(i) + d[0]; pos[o * 3 + 1] = P.getY(i) + d[1]; pos[o * 3 + 2] = P.getZ(i) + d[2];
      if (Nn) { nor[o * 3] = Nn.getX(i); nor[o * 3 + 1] = Nn.getY(i); nor[o * 3 + 2] = Nn.getZ(i); }
      if (uv && U) { uv[o * 2] = U.getX(i); uv[o * 2 + 1] = U.getY(i); }
      si[o * 4] = bi; sw[o * 4] = 1;
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  geo.computeBoundingSphere(); geo.boundingSphere.radius += 0.6;
  return geo;
}
