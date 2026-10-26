<!DOCTYPE html>

<html lang="es"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>EduColor - Acceso Institucional</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;family=Caveat:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .font-script {
      font-family: 'Caveat', cursive;
    }
    .slider-pane {
      transition: transform 0.65s cubic-bezier(0.65, 0, 0.35, 1);
    }
    .auth-card {
      box-shadow: 0 25px 60px -15px rgba(2, 20, 60, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
    }
    /* Mode Toggle */
    .mode-login .brand-sliding-panel {
      transform: translateX(-100%);
    }
    .mode-login .form-register-view {
      opacity: 0;
      pointer-events: none;
    }
    .mode-login .form-login-view {
      opacity: 1;
      pointer-events: auto;
    }
  </style>
</head>
<body class="min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-x-hidden bg-[#0a1f44]">
<!-- School Classroom Ambient Background (Deep Blue tone like Reference) -->
<div class="fixed inset-0 pointer-events-none z-0 overflow-hidden">
<!-- Base stylized classroom scene with photographic blur -->
<div class="absolute inset-0 bg-cover bg-center filter blur-md scale-105 opacity-40 mix-blend-luminosity" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDq7GBJPmxFjAyYGd9ev0aO3mCY0s2PouR5BoUkdRILv-5CROmUCiDANvSdMonWTNFdXqt17NEM-tLUNe06nTflL4noBBpUucsgvtjwq0WnQsyr8mKFGqtzD9zdGdBLsgxHry4G9L4_O9-9MlMX5YuOUhn5dc492MukqdZPVxHRd6LwDrvwFwRsA_RI9aUVygd939mIFTnG7qn2wNMCiNPKgsuv8LwudxcWdT8XqHjqaZBpeC01KB_OKQ');">
</div>
<!-- Deep blue moody color overlay -->
<div class="absolute inset-0 bg-gradient-to-tr from-[#06132d]/95 via-[#0c2a63]/90 to-[#103a87]/85"></div>
<div class="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-500/25 blur-[120px]"></div>
<div class="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-blue-400/20 blur-[140px]"></div>
</div>
<!-- Main Layout Container -->
<div class="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 py-6">
<!-- LEFT SIDE: Chalk / Brush Script Quote ("Aprender Inspirar Transformar") -->
<div class="w-full lg:w-4/12 flex flex-col items-start select-none pl-2 lg:pl-6 text-left">
<div class="relative">
<h1 class="font-script text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-wide leading-[1.1] drop-shadow-md">
          Aprender<br/>
          Inspirar<br/>
          Transformar
        </h1>
<!-- Chalk swoop underline -->
<svg class="w-36 h-5 mt-2 text-white/80" fill="none" viewbox="0 0 160 16" xmlns="http://www.w3.org/2000/svg">
<path d="M3 11C35 4 105 3 157 12" stroke="currentColor" stroke-linecap="round" stroke-width="3.5"></path>
</svg>
</div>
<p class="mt-5 text-blue-200/90 text-sm md:text-base font-normal max-w-xs leading-relaxed">
        Plataforma educativa interactiva diseñada para conectar colegios, maestros y estudiantes.
      </p>
</div>
<!-- RIGHT / CENTER SIDE: Neumorphic Floating White Card -->
<div class="w-full lg:w-8/12 max-w-[720px]">
<div class="auth-card relative bg-white rounded-[26px] overflow-hidden min-h-[540px] flex shadow-2xl transition-all" id="cardContainer">
<!-- ==============================================
             PANEL 1 (LEFT HALF CONTENT): REGISTRO INSTITUCIONAL
             ============================================== -->
<div class="w-full md:w-1/2 p-8 md:p-9 flex flex-col justify-center transition-all duration-500 form-register-view">
<!-- Institutional Form Header -->
<div class="mb-5">
<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-2.5 border border-blue-100">
<span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span> Alta Institución
            </span>
<h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">Registra tu Colegio</h2>
<p class="text-xs text-slate-500 mt-1">Inscribe tu centro para activar las aulas virtuales.</p>
</div>
<!-- Register Form -->
<form class="space-y-3.5" onsubmit="event.preventDefault();">
<div>
<label class="block text-xs font-semibold text-slate-700 mb-1">Nombre del Colegio / Institución</label>
<div class="relative">
<input class="w-full text-xs md:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1E60E6] focus:ring-2 focus:ring-[#1E60E6]/15 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="Ej. Colegio San Agustín" type="text"/>
</div>
</div>
<div>
<label class="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional del Centro</label>
<div class="relative">
<input class="w-full text-xs md:text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1E60E6] focus:ring-2 focus:ring-[#1E60E6]/15 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="direccion@colegio.edu" type="email"/>
</div>
</div>
<div class="grid grid-cols-2 gap-2.5">
<div>
<label class="block text-xs font-semibold text-slate-700 mb-1">Código Escolar / CIF</label>
<input class="w-full text-xs md:text-sm px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1E60E6] focus:ring-2 focus:ring-[#1E60E6]/15 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="CÓD-8823" type="text"/>
</div>
<div>
<label class="block text-xs font-semibold text-slate-700 mb-1">Contraseña Admin</label>
<input class="w-full text-xs md:text-sm px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1E60E6] focus:ring-2 focus:ring-[#1E60E6]/15 outline-none transition-all placeholder:text-slate-400 text-slate-800" placeholder="••••••••" type="password"/>
</div>
</div>
<button class="w-full mt-3 py-3 px-4 rounded-xl bg-[#1E60E6] hover:bg-[#1850c2] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2" type="button">
<span>Registrar Colegio</span>
</button>
</form>
<!-- Mobile Quick Switcher -->
<div class="mt-4 pt-3 border-t border-slate-100 text-center md:hidden">
<button class="text-xs font-semibold text-[#1E60E6] hover:underline" onclick="setAuthMode(true)">
              ¿Ya estás registrado? Iniciar sesión
            </button>
</div>
</div>
<!-- ==============================================
             PANEL 2 (RIGHT HALF CONTENT): LOGIN INSTITUCIONAL
             (Visible when sliding panel moves to the left)
             ============================================== -->
<div class="w-full md:w-1/2 p-8 md:p-9 flex flex-col justify-center transition-all duration-500 form-login-view">
<!-- EduColor Header Logo Style (Fiel a https://lh3.googleusercontent.com/aida-public/AB6AXuAjSt-Efc6d9xmOhYMHuleuKhWZ9NmAFN1de6owiiLQBsHlBfQQFYcC1vCh3qKgushuA_CjzjR1C7i0lO6GHIWAtI58qKatgtWqsCSmIBcYCTRWiCCDlWwqrPoj6wGIIZT2RHEahe9noaIWi-g73iM2qu-X_-0rqAdjmwpNc2skTFmnDMBVUhk1JVChs6_urhu5BBfoEdB9P2p4rr_MpZSXzgTv1iVu2FxFtD7lPSD0aFUW6wxg9BLgRS676r4epANWiWs) -->
<div class="flex flex-col items-center mb-5 text-center">
<div class="flex items-center gap-2 mb-1">
<div class="w-9 h-9 rounded-lg bg-[#1E60E6] flex items-center justify-center text-white font-black text-lg tracking-tighter shadow-sm">
                EC
              </div>
<span class="text-2xl font-extrabold text-slate-800 tracking-tight">EduColor</span>
</div>
<h3 class="text-sm font-semibold text-slate-700">Acceso del colegio</h3>
<div class="w-10 h-0.5 bg-[#1E60E6] rounded-full mt-1.5"></div>
</div>
<!-- Login Form (Exact layout as Reference Image) -->
<form class="space-y-4" onsubmit="event.preventDefault();">
<div>
<label class="block text-xs font-semibold text-slate-600 mb-1">Correo electrónico</label>
<div class="relative flex items-center">
<span class="material-symbols-outlined absolute left-3 text-slate-400 text-lg">mail</span>
<input class="w-full text-xs md:text-sm pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1E60E6] focus:ring-2 focus:ring-[#1E60E6]/15 outline-none transition-all text-slate-800" type="email" value="tu@email.com"/>
</div>
</div>
<div>
<label class="block text-xs font-semibold text-slate-600 mb-1">Contraseña</label>
<div class="relative flex items-center">
<span class="material-symbols-outlined absolute left-3 text-slate-400 text-lg">lock</span>
<input class="w-full text-xs md:text-sm pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1E60E6] focus:ring-2 focus:ring-[#1E60E6]/15 outline-none transition-all text-slate-800 tracking-wider" id="loginPasswordInput" type="password" value="secretpassword"/>
<button class="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center" onclick="togglePasswordVisibility()" type="button">
<span class="material-symbols-outlined text-lg" id="eyeIcon">visibility</span>
</button>
</div>
</div>
<button class="w-full py-3 px-4 rounded-xl bg-[#1E60E6] hover:bg-[#1850c2] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all transform active:scale-[0.99]" type="button">
              Entrar
            </button>
</form>
<div class="mt-5 text-center">
<button class="text-xs font-semibold text-[#1E60E6] hover:underline" onclick="setAuthMode(false)">
              Registrar colegio
            </button>
</div>
</div>
<!-- ==============================================
             SLIDING BRAND / SWITCH OVERLAY PANEL (DESKTOP)
             ============================================== -->
<div class="slider-pane brand-sliding-panel hidden md:flex absolute top-0 right-0 w-1/2 h-full z-20 bg-gradient-to-br from-[#1E60E6] via-[#154ec4] to-[#0d348a] text-white p-8 flex-col justify-between items-center text-center shadow-xl" id="slidingPanel">
<!-- Subtle decorative graphic pattern -->
<div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
<!-- Top Brand Badge -->
<div class="relative z-10 w-full flex justify-center">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-blue-100 font-medium">
<span>Portal Escolar EduColor</span>
</div>
</div>
<!-- Central Brand Experience -->
<div class="relative z-10 flex flex-col items-center">
<!-- Reference Logo Replica -->
<div class="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[#1E60E6] font-extrabold text-2xl shadow-lg mb-3">
              EC
            </div>
<h3 class="text-3xl font-extrabold tracking-tight text-white">EduColor</h3>
<p class="text-blue-100 text-xs md:text-sm mt-2 max-w-xs font-light leading-relaxed" id="sliderSubtext">
              Gestión centralizada para directores, docentes y alumnos de tu centro educativo.
            </p>
</div>
<!-- Switcher Action Container -->
<div class="relative z-10 w-full max-w-xs">
<p class="text-xs text-blue-100/90 mb-2 font-medium" id="sliderPrompt">
              ¿Tu colegio ya forma parte de EduColor?
            </p>
<button class="w-full py-2.5 px-5 rounded-xl bg-white text-[#1E60E6] hover:bg-blue-50 font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5" id="sliderActionBtn" onclick="toggleAuthMode()">
<span id="sliderBtnLabel">Acceder aquí</span>
<span class="material-symbols-outlined text-sm font-bold">arrow_forward</span>
</button>
</div>
</div>
</div>
</div>
</div>
<!-- Bottom minimal subtle footer indicator matching chevron in reference -->
<div class="fixed bottom-3 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors cursor-pointer flex flex-col items-center">
<span class="material-symbols-outlined text-lg">keyboard_arrow_up</span>
</div>
<script>
    let isLoginMode = false;
    const cardContainer = document.getElementById('cardContainer');
    const sliderSubtext = document.getElementById('sliderSubtext');
    const sliderPrompt = document.getElementById('sliderPrompt');
    const sliderBtnLabel = document.getElementById('sliderBtnLabel');
    const loginPasswordInput = document.getElementById('loginPasswordInput');
    const eyeIcon = document.getElementById('eyeIcon');

    function setAuthMode(login) {
      isLoginMode = login;
      updateSliderState();
    }

    function toggleAuthMode() {
      isLoginMode = !isLoginMode;
      updateSliderState();
    }

    function updateSliderState() {
      if (isLoginMode) {
        cardContainer.classList.add('mode-login');
        sliderSubtext.textContent = 'Impulsa el aprendizaje digital en tus aulas con herramientas intuitivas.';
        sliderPrompt.textContent = '¿Aún no has registrado tu centro escolar?';
        sliderBtnLabel.textContent = 'Registrar Colegio';
      } else {
        cardContainer.classList.remove('mode-login');
        sliderSubtext.textContent = 'Gestión centralizada para directores, docentes y alumnos de tu centro educativo.';
        sliderPrompt.textContent = '¿Tu colegio ya forma parte de EduColor?';
        sliderBtnLabel.textContent = 'Acceder aquí';
      }
    }

    function togglePasswordVisibility() {
      if (loginPasswordInput.type === 'password') {
        loginPasswordInput.type = 'text';
        eyeIcon.textContent = 'visibility_off';
      } else {
        loginPasswordInput.type = 'password';
        eyeIcon.textContent = 'visibility';
      }
    }

  </script>
</body></html>
