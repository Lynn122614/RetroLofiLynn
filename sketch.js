let uploadedSound = null;
let isFilePlaying = false;
let isPaused = false;
let seekTime = 0;
let amp;
let lofiFilter;

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 移除 background()，让 HTML 背景显示

  amp = new p5.Amplitude(); // 幅度检测
  lofiFilter = new p5.LowPass(); // 低通滤波器

  // 绑定控件
  select('#speed').input(() => {
    if (uploadedSound && uploadedSound.isLoaded()) {
      uploadedSound.rate(Number(select('#speed').value()));
    }
    select('#speedDisplay').html(Number(select('#speed').value()).toFixed(1) + 'x');
  });

  select('#volume').input(() => {
    if (uploadedSound && uploadedSound.isLoaded()) {
      uploadedSound.setVolume(Number(select('#volume').value()));
    }
    select('#volumeDisplay').html(Number(select('#volume').value()).toFixed(1));
  });

  select('#lofi-enable').changed(() => {
    if (uploadedSound && uploadedSound.isLoaded()) {
      if (select('#lofi-enable').elt.checked) {
        let raw = Number(select('#lofi-cutoff').value());
        let cutoff = exp(map(raw, 20, 20000, log(20), log(20000))); // 对数映射
        lofiFilter.freq(cutoff);
        lofiFilter.res(Number(select('#lofi-reso').value()));
      } else {
        lofiFilter.freq(22050);
        lofiFilter.res(0.001);
      }
    }
  });

  select('#lofi-cutoff').input(() => {
    let raw = Number(select('#lofi-cutoff').value());
    let cutoff = exp(map(raw, 20, 20000, log(20), log(20000))); // 对数计算
    let displayVal = cutoff.toFixed(0); // 显示实际频率
    select('#lofi-cutoff-display').html(displayVal + ' Hz');
    if (uploadedSound && uploadedSound.isLoaded() && select('#lofi-enable').elt.checked) {
      lofiFilter.freq(cutoff);
    }
  });

  select('#lofi-reso').input(() => {
    let r = Number(select('#lofi-reso').value());
    if (uploadedSound && uploadedSound.isLoaded() && select('#lofi-enable').elt.checked) {
      lofiFilter.res(r);
    }
    select('#lofi-reso-display').html(r.toFixed(1) + ' Q');
  });

  select('#fileInput').changed(() => {
    let file = select('#fileInput').elt.files[0];
    if (file && file.type.startsWith('audio/')) {
      handleUploadedAudio(file);
    } else {
      alert('Please upload an audio file (MP3 or WAV)');
    }
  });

  select('#pause-play').mousePressed(() => {
    if (!uploadedSound || !uploadedSound.isLoaded()) {
      alert('Please upload an audio file first');
      return;
    }
    if (!isPaused) {
      seekTime = uploadedSound.currentTime(); // 保存暂停位置
      uploadedSound.pause();
      isPaused = true;
      select('#pause-play').html('▶️ Play');
    } else {
      getAudioContext().resume();
      uploadedSound.play();
      uploadedSound.jump(seekTime); // 跳转到 seekTime
      isPaused = false;
      isFilePlaying = true;
      select('#pause-play').html('⏸️ Pause');
    }
  });

  select('#progress').input(() => {
    if (uploadedSound && uploadedSound.isLoaded()) {
      let progressVal = Number(select('#progress').value());
      seekTime = progressVal * uploadedSound.duration();
      if (!isPaused) {
        uploadedSound.jump(seekTime);
      }
    }
  });
}

function draw() {
  if (uploadedSound && uploadedSound.isLoaded() && isFilePlaying && !isPaused) {
    // 更新进度条
    let currentTime = uploadedSound.currentTime();
    let duration = uploadedSound.duration();
    let progressVal = currentTime / duration;
    select('#progress').value(progressVal);
    select('#progressDisplay').html(
      formatTime(currentTime) + ' / ' + formatTime(duration)
    );

    // 幅度可视化：脉动圆圈
    let level = amp.getLevel();
    let radius = map(level, 0, 1, 50, 200);
    let alpha = map(level, 0, 1, 50, 255);
    noFill();
    stroke(255, alpha); // 白色，透明度随幅度
    strokeWeight(2);
    ellipse(width / 2, height / 2, radius * 2, radius * 2);
  }
}

function handleUploadedAudio(file) {
  if (uploadedSound) {
    uploadedSound.stop();
    uploadedSound.disconnect();
  }
  uploadedSound = loadSound(file, () => {
    console.log('Audio loaded');
    uploadedSound.disconnect();
    lofiFilter.process(uploadedSound); // 连接低通滤波器
    lofiFilter.freq(22050); // 默认无滤波
    lofiFilter.res(0.001); // 默认共振
    amp.setInput(uploadedSound);
    uploadedSound.play();
    isFilePlaying = true;
    isPaused = false;
    seekTime = 0;
    select('#pause-play').html('⏸️ Pause');
  }, (err) => {
    alert('Failed to load audio: ' + err);
  });
}

function formatTime(seconds) {
  let minutes = floor(seconds / 60);
  let secs = floor(seconds % 60);
  return minutes + ':' + nf(secs, 2, 0); // 格式化时间（如 1:23）
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}