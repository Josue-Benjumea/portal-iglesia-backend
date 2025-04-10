
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/portal/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/portal/auth/login",
    "route": "/portal"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-UU5P55TO.js",
      "chunk-OXZSAA2A.js",
      "chunk-UO7HTRBI.js"
    ],
    "redirectTo": "/portal/auth/login",
    "route": "/portal/auth"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-UU5P55TO.js",
      "chunk-OXZSAA2A.js",
      "chunk-UO7HTRBI.js"
    ],
    "route": "/portal/auth/login"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-UU5P55TO.js",
      "chunk-OXZSAA2A.js",
      "chunk-UO7HTRBI.js"
    ],
    "route": "/portal/auth/register"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-5KNQXBFV.js",
      "chunk-RQ2CNPDX.js"
    ],
    "route": "/portal/dashboard"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-NHXA4VYE.js",
      "chunk-QVV3MSXL.js",
      "chunk-UO7HTRBI.js",
      "chunk-RQ2CNPDX.js"
    ],
    "redirectTo": "/portal/adoracion/buscar-canciones",
    "route": "/portal/adoracion"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-NHXA4VYE.js",
      "chunk-QVV3MSXL.js",
      "chunk-UO7HTRBI.js",
      "chunk-RQ2CNPDX.js"
    ],
    "route": "/portal/adoracion/buscar-canciones"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-NHXA4VYE.js",
      "chunk-QVV3MSXL.js",
      "chunk-UO7HTRBI.js",
      "chunk-RQ2CNPDX.js"
    ],
    "route": "/portal/adoracion/crear-repertorio"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-CPOZJHUE.js",
      "chunk-OXZSAA2A.js",
      "chunk-QVV3MSXL.js",
      "chunk-UO7HTRBI.js",
      "chunk-RQ2CNPDX.js"
    ],
    "redirectTo": "/portal/multimedia/listar-repertorios",
    "route": "/portal/multimedia"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-CPOZJHUE.js",
      "chunk-OXZSAA2A.js",
      "chunk-QVV3MSXL.js",
      "chunk-UO7HTRBI.js",
      "chunk-RQ2CNPDX.js"
    ],
    "route": "/portal/multimedia/listar-repertorios"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-CPOZJHUE.js",
      "chunk-OXZSAA2A.js",
      "chunk-QVV3MSXL.js",
      "chunk-UO7HTRBI.js",
      "chunk-RQ2CNPDX.js"
    ],
    "route": "/portal/multimedia/editar-diapositivas"
  },
  {
    "renderMode": 2,
    "redirectTo": "/portal/auth/login",
    "route": "/portal/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 71482, hash: '32f877234cece48780b6fa1ada618585b4afe2067996b07e440263a852e83ebe', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17296, hash: '4120592b4a7a5bb650b6a41a50f755a79920973ac7f4fe3cd4021600df2ea5f6', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'auth/register/index.html': {size: 182851, hash: '7376540a08e5c8821b0dc3a4ad8e6e2be056f5ff8bc5a5d39dbc721c65bb98c0', text: () => import('./assets-chunks/auth_register_index_html.mjs').then(m => m.default)},
    'auth/login/index.html': {size: 153655, hash: '3e54b1e671a697f00918abcf0b3a8429477dbc55340ab9add7484d02fe2c051a', text: () => import('./assets-chunks/auth_login_index_html.mjs').then(m => m.default)},
    'adoracion/crear-repertorio/index.html': {size: 158408, hash: 'f5835a547721cb4d77f38c4df404535e425687166f6d58b2e65344a4fceb741d', text: () => import('./assets-chunks/adoracion_crear-repertorio_index_html.mjs').then(m => m.default)},
    'multimedia/listar-repertorios/index.html': {size: 158460, hash: '496329962dae28ed676bfd74931738de4540088c123c8fad521a677faa4c548a', text: () => import('./assets-chunks/multimedia_listar-repertorios_index_html.mjs').then(m => m.default)},
    'adoracion/buscar-canciones/index.html': {size: 158408, hash: '0a03a721981a32bcbdbcf133aba16b749d695002ea5df1d98829779501eb9111', text: () => import('./assets-chunks/adoracion_buscar-canciones_index_html.mjs').then(m => m.default)},
    'dashboard/index.html': {size: 158304, hash: 'fe884264fed689bc3bbb9e299bb938a95bac1a30e1a233ce4831beba8726995d', text: () => import('./assets-chunks/dashboard_index_html.mjs').then(m => m.default)},
    'multimedia/editar-diapositivas/index.html': {size: 158464, hash: '83fcc43da3599d640251f64d083eab6a929f9293de0459425e8094c5711104ad', text: () => import('./assets-chunks/multimedia_editar-diapositivas_index_html.mjs').then(m => m.default)},
    'styles-5W7ETEKB.css': {size: 101611, hash: 'wijy3Mb8+BQ', text: () => import('./assets-chunks/styles-5W7ETEKB_css.mjs').then(m => m.default)}
  },
};
