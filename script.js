// Ear Training 4-sons — Full + Voicings (Close / Drop 2 / Both)
document.addEventListener('DOMContentLoaded', () => {

  /* ============================
   0) RÉGLAGES AUDIO (release doux)
   ============================ */
  const AUDIOCFG = {
    simult_volume: 0.9,
    simult_hold: 2800,
    simult_fade: 420,
    seq_gap: 600,
    seq_extra_hold: 300,
    seq_last_hold: 1500,
    seq_note_fade: 220,
    seq_last_fade: 300,
    ref_min_delay_simul: 1500,
    ref_hold_margin: 50,
    timings: {
      test:       { preDelayMs: 1500, playbackMs: 4000, noteGapMs: 0 },
      sequential: { preDelayMs: 800,  playbackMs: 2200, noteGapMs: 600 },
      training:   { preDelayMs: 400,  playbackMs: 5000, noteGapMs: 0 }
    }
  };

  /* ============================
     1) CONSTANTES / DOM
     ============================ */
  const EXAM_TIME_LIMIT_S = 60;
  const TOTAL_QUESTIONS_DEFAULT = 10;

  const SCORE_IMG_PATH = 'img';
  const SCORE_IMG = {
    success: `${SCORE_IMG_PATH}/success.png`,
    ok:      `${SCORE_IMG_PATH}/ok.png`,
    fail:    `${SCORE_IMG_PATH}/fail.png`,
  };

  const AUDIO_MIN_OCT = 2;
  const AUDIO_MAX_OCT = 4;
  const MAX_TOP_OCT   = 6;

  // DOM
  const $ = id=>document.getElementById(id);
  const progressDiv=$('progress'), scoreDiv=$('score'), timingDiv=$('timing'),
        menu=$('menu'), game=$('game'), questionDiv=$('question'),
        validationDiv=$('validation-message'), resultDiv=$('result');

  const startBtn=$('start-game'), backBtn=$('back-to-menu'), restartBtn=$('restart-test'),
        nextBtn=$('next-question'), replayBothBtn=$('replay-single-and-chord'),
        replayChordBtn=$('replay-chord-only'), submitBtn=$('submit-answer');

  const voicingSelect=$('voicing-select'), chordSelect=$('chord-select'),
        inversionSelect=$('inversion-select'), fundamentalSelect=$('fundamental-select');

  const chordPicker=$('chord-picker'), chordChecksWrap=$('chord-checks'),
        chordWarning=$('chord-warning'), selectAllBtnChords=$('select-all-chords'),
        deselectAllBtnChords=$('deselect-all-chords'), selectedCountEl=$('selected-count');

  const getGametype    = () => document.querySelector('[name="gametype"]:checked')?.value || 'training';
  const getMode        = () => document.querySelector('[name="mode"]:checked')?.value || 'sequential';
  const getVoicingMode = () => document.querySelector('[name="voicingMode"]:checked')?.value || 'close';

  // Notes & noms
  const noteMap={C:0,Db:1,D:2,Eb:3,E:4,F:5,Gb:6,G:7,Ab:8,A:9,Bb:10,B:11};
  const reverseNoteMap=Object.keys(noteMap).reduce((a,k)=>(a[noteMap[k]]=k,a),{});
  const enharm={Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#'};
  const enhText = n => {
    const name=n.slice(0,-1), o=n.slice(-1);
    return enharm[name] ? `${name}/${enharm[name]}${o}` : n;
  };

  const ALL_CHORDS = ['Maj7','Min7','7sus4','7','-7b5','Dim7','Maj2'];
  const INVERSIONS = ['Root Position','First Inversion','Second Inversion','Third Inversion'];

  /* ============================
     2) STRUCTURES 4-SONS (CLOSE)
     ============================ */
  const chordStructuresMaster = [
    { type:'Maj7',  intervals:[4,3,4], inversion:'PF' },
    { type:'Min7',  intervals:[3,4,3], inversion:'PF' },
    { type:'7sus4', intervals:[5,2,3], inversion:'PF' },
    { type:'7',     intervals:[4,3,3], inversion:'PF' },
    { type:'-7b5',  intervals:[3,3,4], inversion:'PF' },
    { type:'Dim7',  intervals:[3,3,3], inversion:'PF' },

    { type:'Maj7',  intervals:[3,4,1], inversion:'R1' },
    { type:'Min7',  intervals:[4,3,2], inversion:'R1' },
    { type:'7sus4', intervals:[2,3,2], inversion:'R1' },
    { type:'7',     intervals:[3,3,2], inversion:'R1' },
    { type:'-7b5',  intervals:[3,4,2], inversion:'R1' },

    { type:'Maj7',  intervals:[4,1,4], inversion:'R2' },
    { type:'Min7',  intervals:[3,2,3], inversion:'R2' },
    { type:'7sus4', intervals:[3,2,5], inversion:'R2' },
    { type:'7',     intervals:[3,2,4], inversion:'R2' },
    { type:'-7b5',  intervals:[4,2,3], inversion:'R2' },

    { type:'Maj7',  intervals:[1,4,3], inversion:'R3' },
    { type:'Min7',  intervals:[2,3,4], inversion:'R3' },
    { type:'7sus4', intervals:[2,5,2], inversion:'R3' },
    { type:'7',     intervals:[2,4,3], inversion:'R3' },
    { type:'-7b5',  intervals:[2,3,3], inversion:'R3' },

    { type:'Maj2', intervals:[0,0,0], inversion:'PF' },
  ];

  /* ============================
     3) AUDIO
     ============================ */
  const notes={};
  for(let o=AUDIO_MIN_OCT;o<=AUDIO_MAX_OCT;o++){
    Object.keys(noteMap).forEach(n=>notes[`${n}${o}`]=`audio/${n}${o}.mp3`);
  }
  const audioCache={}, activeAudios=new Set(), pendingTimers=new Set();

  function later(cb,ms){
    const id=setTimeout(()=>{
      pendingTimers.delete(id);
      try{cb();}catch{}
    },ms);
    pendingTimers.add(id);
    return id;
  }

  function clearAllTimers(){
    pendingTimers.forEach(id=>clearTimeout(id));
    pendingTimers.clear();
  }

  function getAudioSafe(noteKey){
    if(!audioCache[noteKey]){
      const a=new Audio(notes[noteKey]);
      a.preload='auto';
      audioCache[noteKey]=a;
    }
    const clone=new Audio(audioCache[noteKey].src);
    clone.preload='auto';
    return clone;
  }

  function stopWithFade(audio, fadeMs=220){
    try{
      const steps=8, stepDur=Math.max(10,Math.floor(fadeMs/steps));
      let i=0, startVol=audio.volume;
      const iv=setInterval(()=>{
        i++;
        audio.volume=startVol*Math.max(0,1-i/steps);
        if(i>=steps){
          clearInterval(iv);
          try{audio.pause();audio.currentTime=0;}catch{}
          audio.volume=startVol;
          activeAudios.delete(audio);
        }
      }, stepDur);
    }catch{}
  }

  function stopAllAudioNow(){
    try{
      activeAudios.forEach(a=>{try{a.pause();a.currentTime=0;}catch{}});
      activeAudios.clear();
      clearAllTimers();
    }catch{}
  }

  function playNote(noteKey,{volume=1,startDelayMs=0,maxDurMs=1200,fadeOutMs=0}={}){
    const a=getAudioSafe(noteKey); a.volume=volume; activeAudios.add(a);
    later(()=>{try{a.currentTime=0; a.play().catch(()=>{});}catch{}}, Math.max(0,startDelayMs));
    if(maxDurMs>0){
      later(()=>{
        if(fadeOutMs>0) stopWithFade(a,fadeOutMs);
        else{
          try{a.pause();a.currentTime=0;}catch{}
          activeAudios.delete(a);
        }
      }, startDelayMs+maxDurMs);
    }
  }

  function playChordArray(arr){
    if(getMode()==='sequential'){
      const gap=Math.max(400,AUDIOCFG.seq_gap), lastH=AUDIOCFG.seq_last_hold;
      arr.forEach((n,i)=>{
        const start=i*gap, last=i===arr.length-1;
        const hold= last?lastH:(gap+AUDIOCFG.seq_extra_hold);
        const fade= last?AUDIOCFG.seq_last_fade:AUDIOCFG.seq_note_fade;
        playNote(n,{volume:1,startDelayMs:start,maxDurMs:hold,fadeOutMs:fade});
      });
    }else{
      const hold=AUDIOCFG.simult_hold;
      arr.forEach(n=>playNote(n,{volume:AUDIOCFG.simult_volume,startDelayMs:0,maxDurMs:hold,fadeOutMs:AUDIOCFG.simult_fade}));
    }
  }

  /* ============================
     4) ÉTAT
     ============================ */
  let config = {
    gametype: 'training',
    mode: 'sequential',
    voicingMode: 'close',
    allowedChords: ALL_CHORDS.slice(),
    preDelayMs: AUDIOCFG.timings.training.preDelayMs,
    playbackMs: AUDIOCFG.timings.training.playbackMs,
    noteGapMs: AUDIOCFG.timings.training.noteGapMs,
    totalQuestions: TOTAL_QUESTIONS_DEFAULT,
  };
  let chordPool = chordStructuresMaster;

  let currentNotes=null, firstNotePlayed=null, correctAnswer='', correctVoicing='close';
  let questionIndex=-1, scoreTotal=0, examPointsByIndex=[], gamePointsByIndex=[];
  let startTime=null, questionStartTime=null, answeredThisQuestion=false;

  /* ============================
     5) UTILS MUSICAUX
     ============================ */
  const splitNote=n=>({idx:noteMap[n.slice(0,-1)], oct:parseInt(n.slice(-1),10)});
  const makeNote=(idx,oct)=>`${reverseNoteMap[(idx+12)%12]}${oct}`;
  const midiIndex=n=>{const s=splitNote(n); return s.idx+12*s.oct;};
  const byMidi=(a,b)=>midiIndex(a)-midiIndex(b);
  const getRandom = arr => arr[Math.floor(Math.random()*arr.length)];

  function getRandomBaseNote(){
    const startOct=AUDIO_MIN_OCT, endOct=Math.max(AUDIO_MIN_OCT, AUDIO_MAX_OCT-1);
    const oct = Math.floor(Math.random()*(endOct-startOct+1))+startOct;
    const name=getRandom(Object.keys(noteMap));
    return `${name}${oct}`;
  }

  function buildClose(baseNote, structure){
    const b=splitNote(baseNote);
    const arr=[baseNote];
    let cur=b.idx, oct=b.oct;
    structure.intervals.forEach(step=>{
      const next=(cur+step)%12;
      if(next<cur) oct=Math.min(AUDIO_MAX_OCT, oct+1);
      arr.push(makeNote(next,oct));
      cur=next;
    });
    arr.sort(byMidi);
    const low=splitNote(arr[0]).oct, maxOct=low+1;
    for(let i=1;i<arr.length;i++){
      const s=splitNote(arr[i]);
      if(s.oct>maxOct) arr[i]=makeNote(s.idx,maxOct);
    }
    const top=splitNote(arr[arr.length-1]);
    if(top.oct>MAX_TOP_OCT) arr[arr.length-1]=makeNote(top.idx,MAX_TOP_OCT);
    return arr.sort(byMidi);
  }

  function toDrop2(arr){
    const out=arr.slice().sort(byMidi);
    const s=splitNote(out[1]);
    out[1]=makeNote(s.idx, s.oct+1);
    out.sort(byMidi);
    const top=splitNote(out[out.length-1]);
    if(top.oct>MAX_TOP_OCT){ out[out.length-1]=makeNote(top.idx,MAX_TOP_OCT); }
    return out;
  }

  function analyzeChord(arrClose){
    const a=arrClose.slice().sort(byMidi);
    const [n1,n2,n3,n4]=a;
    const im=(x,y)=> (noteMap[y.slice(0,-1)]-noteMap[x.slice(0,-1)]+12)%12;
    const i1=im(n1,n2), i2=im(n2,n3), i3=im(n3,n4);
    const found=chordStructuresMaster.find(s=>s.intervals[0]===i1 && s.intervals[1]===i2 && s.intervals[2]===i3);
    if(!found) return { chordType:'', inversion:'', fundamental:'' };
    let fundamental=n1.slice(0,-1);
    if(found.inversion==='R1')      fundamental=n4.slice(0,-1);
    else if(found.inversion==='R2') fundamental=n3.slice(0,-1);
    else if(found.inversion==='R3') fundamental=n2.slice(0,-1);
    return { chordType:found.type, inversion:found.inversion, fundamental };
  }

  function parseAnswer(str){
    str = str.replace(/DDim7/i, 'Ddim7');
    str = str.replace(/dim7/i, 'dim7');

    const invs=['PF','R1','R2','R3'];
    const inv=invs.find(s=>str.endsWith(s))||'PF';
    const body=str.slice(0,-inv.length);

    const types=ALL_CHORDS.slice();
    const sortedTypes = types.slice().sort((a,b) => b.length - a.length);

    let chord='', tonic='';
    for(const t of sortedTypes){
      if(body.toLowerCase().endsWith(t.toLowerCase())){
        chord=t;
        tonic=body.slice(0, body.length - t.length);
        break;
      }
    }

    if ((str.includes('dim7') || str.includes('Dim7')) && (!chord || chord === '7')) {
      chord = 'Dim7';
      const idx = body.toLowerCase().indexOf('dim7');
      if (idx !== -1) tonic = body.slice(0, idx);
    }

    return { fund:tonic.trim(), chord, inv };
  }

  /* ============================
     6) CHECKBOXES
     ============================ */
  function updateSelectedCount(){
    const n=chordChecksWrap.querySelectorAll('input[type="checkbox"]:checked').length;
    selectedCountEl.textContent=`${n} sélectionnée${n>1?'s':''}`;
  }
  chordChecksWrap.addEventListener('change',()=>{ applySettings(); updateSelectedCount(); });
  selectAllBtnChords.onclick=()=>{ chordChecksWrap.querySelectorAll('input').forEach(c=>c.checked=true); applySettings(); updateSelectedCount(); };
  deselectAllBtnChords.onclick=()=>{ chordChecksWrap.querySelectorAll('input').forEach(c=>c.checked=false); applySettings(); updateSelectedCount(); };
  updateSelectedCount();

  /* ============================
     7) RÉGLAGES
     ============================ */
  function applySettings(){
    config.gametype    = getGametype();
    config.mode        = getMode();
    config.voicingMode = getVoicingMode();

    const checked = Array.from(chordChecksWrap.querySelectorAll('input:checked')).map(c=>c.value);
    config.allowedChords = checked;
    chordWarning.style.display = checked.length ? 'none' : 'block';

    const base = (config.gametype==='training')
      ? AUDIOCFG.timings.training
      : (config.mode==='sequential' ? AUDIOCFG.timings.sequential : AUDIOCFG.timings.test);

    config.preDelayMs = base.preDelayMs;
    config.playbackMs = base.playbackMs;
    config.noteGapMs  = base.noteGapMs || 0;

    config.totalQuestions = TOTAL_QUESTIONS_DEFAULT;

    chordPool = chordStructuresMaster.filter(s=>config.allowedChords.includes(s.type));
  }

  document.querySelectorAll('[name="gametype"]').forEach(r=>r.addEventListener('change',applySettings));
  document.querySelectorAll('[name="mode"]').forEach(r=>r.addEventListener('change',applySettings));
  document.querySelectorAll('[name="voicingMode"]').forEach(r=>r.addEventListener('change',applySettings));
  applySettings();

  /* ============================
     7b) VISIBILITÉ SELECTS
     ============================ */
  function updateSelectVisibility(){
    const chord = chordSelect.value;
    inversionSelect.style.display = (chord === 'Dim7' || chord === 'Maj2') ? 'none' : '';
    voicingSelect.style.display = (chord === 'Maj2') ? 'none' : (config.voicingMode === 'both' ? '' : 'none');
  }
  chordSelect.addEventListener('change', updateSelectVisibility);

  /* ============================
     8) NAVIGATION
     ============================ */
  startBtn.onclick   = startGame;
  backBtn.onclick    = ()=>backToMenu();
  restartBtn.onclick = startGame;

  nextBtn.onclick = () => {
    stopAllAudioNow();
    if (config.gametype === 'test') {
      if (!answeredThisQuestion && questionIndex >= 0 && questionIndex < config.totalQuestions) {
        examPointsByIndex[questionIndex] = 0;
        gamePointsByIndex[questionIndex] = 0;
        answeredThisQuestion = true;
      }
      advance();
    } else {
      nextTrainingQuestion();
    }
  };
  replayBothBtn.onclick  = () => { stopAllAudioNow(); playOneThenChord(); };
  replayChordBtn.onclick = () => { stopAllAudioNow(); playChordArray(currentNotes); };
  submitBtn.onclick      = () => { stopAllAudioNow(); validateAnswer(); };

  async function startGame(){
    applySettings();
    if (!config.allowedChords.length){
      chordWarning.style.display='block';
      return;
    }

    menu.style.display='none';
    game.style.display='block';
    resultDiv.textContent='';
    validationDiv.textContent='';

    stopAllAudioNow();
    answeredThisQuestion = false;

    buildSelects();

    startTime = Date.now();
    startHudTimer();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}

    if (config.gametype === 'test') {
      questionIndex = -1;
      scoreTotal = 0;
      examPointsByIndex = new Array(config.totalQuestions).fill(null);
      gamePointsByIndex = new Array(config.totalQuestions).fill(0);
      advance();
    } else {
      questionIndex = 0;
      nextTrainingQuestion();
    }
  }

  function backToMenu(){
    stopAllAudioNow();
    stopHudTimer();
    game.style.display='none';
    menu.style.display='block';
  }

  /* ============================
     9) FIN DE TEST
     ============================ */
  function advance(){
    questionIndex += 1;
    if (questionIndex >= config.totalQuestions) {
      endGame();
      return;
    }
    nextQuestionCommon();
  }

  function endGame(){
    stopHudTimer();
    const timeTaken = ((Date.now()-startTime)/1000);
    const timeTakenText = timeTaken.toFixed(2);

    const finalizedExam = examPointsByIndex.map(v => (v==null ? 0 : v)).slice(0, config.totalQuestions);
    const grade20 = finalizedExam.reduce((a,b)=>a+b,0);

    const twoPts = finalizedExam.filter(v=>v===2).length;
    const onePt  = finalizedExam.filter(v=>v===1).length;
    const zeroPt = config.totalQuestions - twoPts - onePt;

    let label, img;
    if (grade20 >= 16) { label='Très bien'; img=SCORE_IMG.success; }
    else if (grade20 >= 10) { label='Correct'; img=SCORE_IMG.ok; }
    else { label='Insuffisant'; img=SCORE_IMG.fail; }

    resultDiv.innerHTML = `
      <section class="result-summary">
        <p class="result-title"><strong>Test terminé !</strong></p>
        <p class="result-grade">${label}</p>
        <div class="trophy-block">
          <img src="${img}" alt="${label}" class="score-img" onerror="this.style.display='none'"/>
        </div>
        <p class="result-line">Score : <strong>${scoreTotal}</strong></p>
        <p class="result-line">Note : <strong>${Math.round(grade20)}/20</strong>
           <span class="result-sub">(${twoPts}×2 pts, ${onePt}×1 pt, ${zeroPt}×0 pt)</span>
        </p>
        <p class="result-line">Temps total : ${timeTakenText}s</p>
      </section>
      <section id="scoreboard"></section>
    `;

    const avgPerQuestion = (config.totalQuestions > 0) ? (timeTaken / config.totalQuestions) : 0;
    saveScore({
      validatedFull: twoPts,
      validatedHalf: onePt,
      grade20: grade20,
      score: scoreTotal,
      avgTime: avgPerQuestion
    });

    nextBtn.disabled=true;
    renderScoreboard();
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(_){}
  }

  function renderScoreboard() {
    const mount = $('scoreboard');
    if (!mount) return;

    const all = loadScores();
    mount.innerHTML = '';
    if (!all || !all.length) return;

    const top5 = all.slice().sort((a, b) => {
      const g = (b.grade20 || 0) - (a.grade20 || 0);
      return g !== 0 ? g : ((b.score || 0) - (a.score || 0));
    }).slice(0, 5);

    const h3 = document.createElement('h3');
    h3.className = 'result-h3';
    h3.textContent = 'Top 5 — Meilleurs scores';

    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';

    const table = document.createElement('table');
    table.className = 'score-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Rang</th><th>Note</th><th>Score</th><th>Mode</th><th>Accords</th><th>Temps moyen</th></tr>';

    const tbody = document.createElement('tbody');

    top5.forEach((s, idx) => {
      const tr = document.createElement('tr');
      const td = (label, text) => {
        const cell = document.createElement('td');
        cell.setAttribute('data-label', label);
        cell.textContent = text;
        return cell;
      };

      tr.appendChild(td('Rang', '#' + (idx + 1)));
      tr.appendChild(td('Note', String(Math.round(s.grade20 || 0)) + '/20'));
      tr.appendChild(td('Score', String(s.score || 0)));
      tr.appendChild(td('Mode', (s.gametype || '-') + ' / ' + (s.mode || '-') + (s.voicingMode ? ' / ' + s.voicingMode : '')));
      tr.appendChild(td('Accords', (Array.isArray(s.chords) && s.chords.length) ? s.chords.join(', ') : '—'));
      tr.appendChild(td('Temps moyen', (typeof s.avgTime === 'number' ? s.avgTime.toFixed(1) : '0.0') + 's'));

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    mount.appendChild(h3);
    mount.appendChild(wrap);
  }

  const SCORE_KEY = 'tetradScores';
  function loadScores(){
    try{ return JSON.parse(localStorage.getItem(SCORE_KEY)||'[]'); }
    catch(_){ return []; }
  }
  function saveScore(entry){
    const all=loadScores();
    all.push({
      date: new Date().toISOString(),
      mode: config.mode,
      gametype: config.gametype,
      voicingMode: config.voicingMode,
      chords: (config.allowedChords||[]).slice(),
      total: config.totalQuestions,
      validatedFull: entry.validatedFull,
      validatedHalf: entry.validatedHalf,
      grade20: Math.round(entry.grade20),
      score: entry.score,
      avgTime: entry.avgTime
    });
    localStorage.setItem(SCORE_KEY, JSON.stringify(all));
  }

  /* ============================
     10) QUESTIONS COMMUNES
     ============================ */
  function nextQuestionCommon(){
    validationDiv.textContent='';
    resultDiv.textContent='';
    nextBtn.disabled=false;
    answeredThisQuestion = false;
    submitBtn.disabled = false;

    chordSelect.selectedIndex = 0;
    inversionSelect.selectedIndex = 0;
    fundamentalSelect.selectedIndex = 0;
    voicingSelect.value = (config.voicingMode==='drop2'?'drop2':'close');

    updateSelectVisibility();
    updateHud();
    generateQuestion();
  }

  function nextTrainingQuestion(){
    validationDiv.textContent='';
    resultDiv.textContent='';
    nextBtn.disabled=false;
    answeredThisQuestion = false;
    submitBtn.disabled = false;

    chordSelect.selectedIndex = 0;
    inversionSelect.selectedIndex = 0;
    fundamentalSelect.selectedIndex = 0;
    voicingSelect.value = (config.voicingMode==='drop2'?'drop2':'close');

    updateSelectVisibility();
    progressDiv.textContent = 'Entraînement libre';
    scoreDiv.textContent = '';

    generateQuestion();
  }

  function buildSelects(){
    chordSelect.innerHTML = '';
    (config.allowedChords.length?config.allowedChords:ALL_CHORDS).forEach(t=>{
      const o=document.createElement('option');
      o.value=t;
      o.textContent = t === 'Maj2' ? 'Maj/2' : t;
      chordSelect.appendChild(o);
    });

    inversionSelect.innerHTML = '';
    INVERSIONS.forEach(inv=>{
      const o=document.createElement('option');
      o.value=inv;
      o.textContent=inv;
      inversionSelect.appendChild(o);
    });

    fundamentalSelect.innerHTML = '';
    Object.keys(noteMap).forEach(n=>{
      const o=document.createElement('option');
      const e=enharm[n];
      o.value=n;
      o.textContent = e?`${n}/${e}`:n;
      fundamentalSelect.appendChild(o);
    });

    voicingSelect.value=(config.voicingMode==='drop2'?'drop2':'close');
    updateSelectVisibility();
  }

  function getRefAndChordDelay() {
    let base = Math.max(80, config.preDelayMs || 400);
    if (getMode() === 'simultaneous') {
      base = Math.max(base, AUDIOCFG.ref_min_delay_simul);
    } else {
      const gap = Math.max( Math.max(400, config.noteGapMs || AUDIOCFG.seq_gap), 0 );
      base += gap;
    }
    return base;
  }

  function playOneThenChord(){
    stopAllAudioNow();
    const delay   = getRefAndChordDelay();
    const refHold = Math.max(300, delay - AUDIOCFG.ref_hold_margin);
    playNote(firstNotePlayed, { volume: 1.0, startDelayMs: 0, maxDurMs: refHold, fadeOutMs: 0 });
    later(() => { playChordArray(currentNotes); }, delay);
  }

  /* ============================
     10b) GÉNÉRATION QUESTION
     ============================ */
  function generateQuestion(){
    const structure = getRandom(chordPool);
    const baseNote  = getRandomBaseNote();

    if (structure.type === 'Maj2') {
      const triadFundName = getRandom(Object.keys(noteMap));
      const triadFundIdx  = noteMap[triadFundName];
      const bassIdx = (triadFundIdx + 2) % 12; // basse = fondamentale - 1 ton
      const bassOct = AUDIO_MIN_OCT;
      const bassNote = makeNote(bassIdx, bassOct);

      const rootOct = bassOct + 1;
      const root    = makeNote(triadFundIdx, rootOct);

      let thirdIdx  = (triadFundIdx+4)%12;
      let thirdOct  = rootOct;
      if (thirdIdx < triadFundIdx) thirdOct++;
      const third   = makeNote(thirdIdx, thirdOct);

      let fifthIdx  = (thirdIdx+3)%12;
      let fifthOct  = thirdOct;
      if (fifthIdx < thirdIdx) fifthOct++;
      const fifth   = makeNote(fifthIdx, fifthOct);

      let triad = [root, third, fifth].sort(byMidi);

      const rotations = Math.floor(Math.random()*3);
      for(let i=0;i<rotations;i++){
        const n = triad.shift();
        const s = splitNote(n);
        triad.push(makeNote(s.idx, s.oct+1));
        triad.sort(byMidi);
      }

      let notes = [bassNote, ...triad].sort(byMidi);

      const top = splitNote(notes[notes.length-1]);
      if (top.oct > MAX_TOP_OCT){
        notes[notes.length-1] = makeNote(top.idx, MAX_TOP_OCT);
      }

      currentNotes   = notes;
      correctVoicing = 'close';
      correctAnswer  = `${triadFundName}Maj2PF`;

      firstNotePlayed = notes[Math.floor(Math.random()*notes.length)];
      questionDiv.textContent = `Note jouée : ${enhText(firstNotePlayed)}`;

      questionStartTime = Date.now();
      playOneThenChord();
      return;
    }

    const close = buildClose(baseNote, structure);

    let effectiveVoicing = 'close';
    if (config.voicingMode === 'drop2')       effectiveVoicing = 'drop2';
    else if (config.voicingMode === 'both')   effectiveVoicing = (Math.random()<0.5?'close':'drop2');

    const voiced = (effectiveVoicing==='drop2') ? toDrop2(close) : close.slice();

    currentNotes   = voiced;
    correctVoicing = effectiveVoicing;

    const a = analyzeChord(close);

    let chordTypeStr = a.chordType;
    if (a.chordType === 'Dim7') {
      chordTypeStr = 'dim7';
    }

    correctAnswer = `${a.fundamental}${chordTypeStr}${a.inversion}`;

    let displayCorrect = correctAnswer;
    if (a.chordType === 'Dim7') {
      displayCorrect = `${a.fundamental}Dim7${a.inversion}`;
    } else if (a.chordType === 'Maj2') {
      displayCorrect = `${a.fundamental}Maj/2${a.inversion}`;
    }

    firstNotePlayed = voiced[Math.floor(Math.random()*voiced.length)];
    questionDiv.textContent = `Note jouée : ${enhText(firstNotePlayed)}`;

    questionStartTime = Date.now();
    playOneThenChord();
  }

  /* ============================
     11) VALIDATION
     ============================ */
  let hudTimerId = null;

  function updateHud(){
    if (config.gametype === 'test') {
      const qShown = Math.max(0, Math.min(questionIndex+1, config.totalQuestions));
      progressDiv.textContent = `Question ${qShown}/${config.totalQuestions}`;
      scoreDiv.textContent    = `Score : ${scoreTotal}`;
    } else {
      progressDiv.textContent = 'Entraînement libre';
      scoreDiv.textContent    = '';
    }
    timingDiv.textContent = `Temps: ${ startTime ? ((Date.now()-startTime)/1000).toFixed(1) : '0.0'}s`;
  }

  function getDifficultyMultiplier(cfg){
    const chordBoost    = 1 + 0.10 * Math.max(0, (cfg.allowedChords?.length||1) - 1);
    const modeBoost     = (cfg.mode==='sequential') ? 1.00 : 1.20;
    const voicingBoost  = (cfg.voicingMode==='both') ? 1.15 : 1.00;
    return Math.min(2.20, Number((chordBoost * modeBoost * voicingBoost).toFixed(2)));
  }

  function getTimeBonus(s){
    const t=Math.max(0,s);
    if (t<=1.5) return 150;
    if (t<=3)   return 120;
    if (t<=5)   return 100;
    if (t<=8)   return 80;
    if (t<=12)  return 60;
    if (t<=18)  return 45;
    if (t<=25)  return 35;
    if (t<=35)  return 25;
    if (t<=45)  return 15;
    return 5;
  }

  function computeQuestionPoints(ok, s, cfg){
    if(!ok) return 0;
    return Math.round((100 + getTimeBonus(s)) * getDifficultyMultiplier(cfg));
  }

  const uiInvToCode = s => s==='Root Position'?'PF'
                          : s==='First Inversion'?'R1'
                          : s==='Second Inversion'?'R2'
                          : 'R3';

  function validateAnswer(){
    if (answeredThisQuestion) return;

    const chord = chordSelect.value;
    const fund  = fundamentalSelect.value;
    const invUi = inversionSelect.value || 'Root Position';
    const inv   = uiInvToCode(invUi);
    const userVoicing = voicingSelect.value;

    const t = (Date.now()-questionStartTime)/1000;
    const within = (config.gametype === 'test') ? (t <= EXAM_TIME_LIMIT_S) : true;

    const exp = parseAnswer(correctAnswer);

    let displayCorrect = correctAnswer;
    if (correctAnswer.includes('dim7')) {
      displayCorrect = correctAnswer.replace('dim7', 'Dim7');
    } else if (correctAnswer.includes('Maj2')) {
      displayCorrect = correctAnswer.replace('Maj2', 'Maj/2');
    }

    let isTypeMatch, isFundMatch, isVoicingMatch;

    if (exp.chord === 'Dim7') {
      isTypeMatch    = (chord === 'Dim7');
      isFundMatch    = (fund === exp.fund);
      isVoicingMatch = (config.voicingMode === 'both' ? (userVoicing === correctVoicing) : true);
    } else if (exp.chord === 'Maj2') {
      isTypeMatch    = (chord === 'Maj2');
      isFundMatch    = (fund === exp.fund);
      isVoicingMatch = true;  // Pas de voicing pour Maj/2
    } else {
      isTypeMatch    = (chord === exp.chord) && (inv === exp.inv);
      isFundMatch    = (fund === exp.fund);
      isVoicingMatch = (config.voicingMode === 'both' ? (userVoicing === correctVoicing) : true);
    }

    let gained = 0;
    let examPoints = 0;
    let feedbackHTML = '';

    answeredThisQuestion = true;
    submitBtn.disabled   = true;

    const orderPlayed = currentNotes.map(enhText).join(' – ');

    let voicingDisplay = correctVoicing;
    if (exp.chord === 'Dim7') {
      voicingDisplay = correctVoicing;
    } else if (exp.chord === 'Maj2') {
      voicingDisplay = 'close';
    }

    let extraHint = '';
    if (exp.chord === 'Maj2') {
      extraHint = '<div style="margin-top:8px; font-size:13px; color:#555;">Rappel : pour Maj/2, le nom vient de la triade majeure (pas de la basse !)</div>';
    }

    if (within && isTypeMatch && isFundMatch && isVoicingMatch) {
      if (config.gametype === 'test') {
        gained = computeQuestionPoints(true, t, config);
        scoreTotal += gained;
        examPoints = 2;
        feedbackHTML = `
          <span style="color:#1f8b24; font-weight:700;">Correct ! ✅</span>
          <div style="margin-top:6px; font-size:14px;">
            Base 100 + Bonus temps ${getTimeBonus(t)} (${t.toFixed(1)}s)
            • Mult. ×${getDifficultyMultiplier(config).toFixed(2)}
            → <strong>${gained} pts</strong>
          </div>
          <div style="margin-top:6px;font-size:14px;opacity:.85;">Voicing : ${voicingDisplay} • Notes : ${orderPlayed}</div>
          ${extraHint}`;
        nextBtn.disabled = true;
        later(()=>{ nextBtn.disabled=false; advance(); }, 1200);
      } else {
        feedbackHTML = `<span style="color:#1f8b24; font-weight:700;">Correct ! ✅</span>
                        <div style="margin-top:6px;font-size:14px;opacity:.85;">Voicing : ${voicingDisplay} • Notes : ${orderPlayed}</div>
                        ${extraHint}`;
      }
    } else if (within && isTypeMatch && isFundMatch && !isVoicingMatch) {
      if (config.gametype === 'test') {
        gained = Math.round(computeQuestionPoints(true, t, config) / 2);
        scoreTotal += gained;
        examPoints = 1;
        feedbackHTML = `
          <span style="color:#2e7dd7; font-weight:700;">Presque ! ✳️</span>
          <div style="margin-top:6px; font-size:14px;">
            Type + tonique OK, mais voicing incorrect<br>
            → <strong>${gained} pts</strong> • <strong>+1 pt (examen)</strong><br>
            Attendu : <strong>${displayCorrect}</strong> (${voicingDisplay})
          </div>
          <div style="margin-top:6px;font-size:14px;opacity:.85;">Notes : ${orderPlayed}</div>
          ${extraHint}`;
      } else {
        feedbackHTML = `
          <span style="color:#2e7dd7; font-weight:700;">Voicing incorrect</span>
          <div style="margin-top:6px; font-size:14px;">
            Attendu : <strong>${displayCorrect}</strong> (${voicingDisplay})
          </div>
          <div style="margin-top:6px;font-size:14px;opacity:.85;">Notes : ${orderPlayed}</div>
          ${extraHint}`;
      }
    } else if (!within && config.gametype === 'test') {
      feedbackHTML = `
        <span style="color:#c62828;">⏱️ Temps dépassé (&gt; ${EXAM_TIME_LIMIT_S}s) — 0 pt</span>
        <div style="margin-top:6px;">Bonne réponse : <strong>${displayCorrect}</strong> (${voicingDisplay})</div>
        <div style="margin-top:6px;font-size:14px;opacity:.85;">Notes : ${orderPlayed}</div>
        ${extraHint}`;
    } else {
      feedbackHTML = `
        <span style="color:#c62828;">Incorrect ❌ — Attendu : <strong>${displayCorrect}</strong> (${voicingDisplay})</span>
        <div class="hint-relisten">Réécoute puis “${config.gametype==='test'?'Question suivante':'Nouvel accord'}”.</div>
        <div style="margin-top:6px;font-size:14px;opacity:.85;">Notes : ${orderPlayed}</div>
        ${extraHint}`;
      examPoints = 0;
    }

    if (config.gametype === 'test' && questionIndex >= 0 && questionIndex < config.totalQuestions) {
      examPointsByIndex[questionIndex] = examPoints;
      gamePointsByIndex[questionIndex] = gained;
    }

    validationDiv.innerHTML = feedbackHTML;
    updateHud();
  }

  /* ============================
     12) HUD TIMER
     ============================ */
  function startHudTimer(){
    stopHudTimer();
    updateHud();
    hudTimerId = setInterval(updateHud, 500);
  }
  function stopHudTimer(){
    if (hudTimerId){
      clearInterval(hudTimerId);
      hudTimerId = null;
    }
  }
});