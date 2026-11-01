export const landing = `
<section id="home">
 <div class="landing-hero">
  <div class="hero-copy">
   <div class="eyebrow"><span class="signal"></span> YOUR NEXT 10-SECOND OBSESSION</div>
   <p class="hero-kicker">카메라 하나면, 여기가 너의 링.</p>
   <h1>네 주먹은<br>얼마나 <em>빠를까?</em></h1>
   <p class="intro">딱 10초. 뻗고, 돌아오고, 다시 펀치.<br>나만의 스피드 지수를 만들고 친구에게 도전장을 보내세요.</p>
   <p id="challenge" class="notice" hidden></p>
   <div class="hero-actions"><button id="begin" class="primary">펀치 측정 시작 <span>↗</span></button><button id="demo" class="secondary">카메라 없이 먼저 체험 <span>▷</span></button></div>
   <p class="hero-fine">가입 없이 바로 · 영상은 내 기기에서만 처리</p>
   <div class="platforms"><span>◉ 스마트폰 카메라</span><span>▣ 노트북 웹캠</span><span>↗ 친구에게 공유</span></div>
  </div>
  <div class="hero-poster" aria-label="펀치 챌린지 결과 카드 예시. 스피드 지수 82점은 예시이며 측정 결과가 아닙니다.">
   <div class="poster-head"><span>THE 10 SEC CHALLENGE</span><span>ROUND / 01</span></div>
   <div class="poster-word" aria-hidden="true">HIT<br>YOUR<br>LIMIT.</div>
   <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
   <svg class="glove" viewBox="0 0 300 340" aria-hidden="true"><defs><linearGradient id="glove-red" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff6570"/><stop offset=".5" stop-color="#f52e43"/><stop offset="1" stop-color="#991b35"/></linearGradient></defs><g transform="rotate(-18 150 170)"><path d="M85 240 72 171Q49 145 59 110L78 69Q91 39 129 40L192 44Q231 48 238 89L243 144Q247 174 220 201L202 245Z" fill="url(#glove-red)" stroke="#ff8290" stroke-width="2"/><path d="M80 152Q105 122 126 143L148 176Q156 195 139 207L113 224" fill="#de2940" stroke="#ff7886" stroke-width="2"/><path d="M88 90Q138 67 206 88M115 50 114 112M157 47 155 112M195 53 193 114" fill="none" stroke="#7b1630" stroke-width="3" opacity=".65"/><path d="M89 233 203 237 205 285 92 283Z" fill="#16161d" stroke="#ff5264" stroke-width="2"/><path d="M100 251 193 254" stroke="#f6ef64" stroke-width="4"/><text x="108" y="274" fill="#f7f1e9" font-size="15" font-weight="900" font-family="sans-serif">PUNCH LAB</text><path d="M82 94Q86 64 123 58" stroke="#ffb0ae" stroke-width="6" stroke-linecap="round" fill="none" opacity=".6"/></g></svg>
   <div class="impact-lines" aria-hidden="true">✦</div>
   <div class="sample-result"><div><small>결과 예시 · 실측 아님</small><b>번개 주먹 <span>↗</span></b></div><strong>82<small>/100</small></strong></div>
   <div class="poster-bottom"><span>PLAY HARD. STAY SAFE.</span><span>✦</span></div>
  </div>
 </div>
 <div class="landing-strip"><div><strong>10<span>SEC</span></strong><small>짧고 강렬한 한 라운드</small></div><div><strong>0<span>SIGN UP</span></strong><small>가입도, 앱 설치도 없이</small></div><div><strong>100<span>INDEX</span></strong><small>나만의 게임 스피드 지수</small></div></div>
 <section id="how-it-works" class="landing-section" aria-labelledby="how-title"><div class="section-heading"><div><div class="eyebrow">READY. SET. PUNCH.</div><h2 id="how-title">어렵게 생각 말고,<br>가볍게 한 판.</h2></div><p>스마트폰을 고정하고, 양팔이 보이게.<br>나머지는 PUNCH LAB과 함께.</p></div><div class="how-cards"><article><span class="step-number">01</span><span class="step-icon" aria-hidden="true">▣</span><h3>너의 링을 세팅해</h3><p>밝은 곳에서 기기를 고정하세요.<br>1.5~2m부터 거리를 조절하고<br>상체와 양팔을 화면에 담아주세요.</p><small>사선 약 60°부터 시도해 보세요</small></article><article><span class="step-number">02</span><span class="step-icon" aria-hidden="true">⌁</span><h3>가드 올리고, 준비</h3><p>팔을 굽혀 준비 자세를 유지하세요.<br>관절 인식이 확인되면<br>3초 카운트다운이 시작됩니다.</p><small>측정 시작은 준비 확인 후 직접 눌러요</small></article><article><span class="step-number">03</span><span class="step-icon" aria-hidden="true">↗</span><h3>10초 동안 네 페이스로</h3><p>펀치를 뻗은 뒤 가드로 돌아오세요.<br>유효 펀치와 게임 지수를 확인하고<br>친구에게 도전장을 보내세요.</p><small>최고 기록은 이 브라우저에 저장돼요</small></article></div></section>
 <section class="challenge-banner"><div><div class="eyebrow">YOUR RIVAL? YESTERDAY'S YOU.</div><h2>다음 한 방은,<br>조금 더 빠르게.</h2><p>처음이라면 카메라 없이 게임 흐름부터 경험하세요.</p></div><button data-action="demo" class="primary">지금 체험해 보기 <span>↗</span></button></section>
 <section id="faq" class="landing-section faq" aria-labelledby="faq-title"><div class="section-heading"><div><div class="eyebrow">BEFORE YOU STEP IN</div><h2 id="faq-title">궁금한 건, 여기서.</h2></div></div><details><summary>실제 펀치 속도를 측정하나요?<span>+</span></summary><p>영상 속 상대적인 움직임과 동작 시간, 인식 신뢰도로 만든 0~100 게임 지수입니다. km/h나 m/s 단위의 실제 속도, 격투 능력 또는 운동 능력을 평가하지 않습니다. 촬영 각도와 조명에 따라 결과가 달라질 수 있어요.</p></details><details><summary>카메라가 연결되지 않아요.<span>+</span></summary><p>HTTPS 주소에서 Safari 또는 Chrome으로 직접 열고 카메라 권한을 허용해 주세요. 다운로드한 HTML의 카메라 측정에는 인터넷 연결도 필요합니다. 카카오톡 내부 브라우저라면 외부 브라우저로 열어보세요. 다른 앱이 카메라를 사용 중이면 종료해 주세요. 카메라 없는 체험은 권한 없이 사용할 수 있습니다.</p></details><details><summary>내 카메라 영상이 저장되나요?<span>+</span></summary><p>영상은 내 기기에서 처리하며 서버로 업로드하거나 녹화하지 않습니다. 화면을 나가거나 중단하면 카메라를 해제합니다. 개인 최고 기록은 현재 브라우저에만 저장됩니다.</p></details><details><summary>친구의 기록과 경쟁할 수 있나요?<span>+</span></summary><p>측정을 마치면 친구에게 도전 링크를 공유할 수 있어요. 체험 모드의 가상 점수는 공유하거나 최고 기록에 저장하지 않습니다. 공유 기록은 서버 검증이 없는 재미용 기록입니다.</p></details></section>
 <div class="mobile-cta"><button data-action="camera" class="primary">펀치 측정 시작 ↗</button><button data-action="demo" class="secondary">먼저 체험 ▷</button></div>
</section>`;
