let uploadedSound = null;
let isFilePlaying = false;
let isPaused = false;
let seekTime = 0;
let amp;
let lofiFilter;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0); // 初始纯黑

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