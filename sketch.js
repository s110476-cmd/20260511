let capture;
let bodyPose;
let handPose;
let poses = [];
let hands = [];
let maskImages = [];
let currentMaskIndex = 0; // 預設顯示第一款臉譜
let lastWaveTime = 0;
let prevWristX = 0;

function preload() {
  // 載入 bodyPose 模型
  bodyPose = ml5.bodyPose();
  // 載入 handPose 模型
  handPose = ml5.handPose();
  
  // 載入臉譜圖片 (存放於 mask 目錄)
  maskImages[0] = loadImage('mask/4379901.png');
  maskImages[1] = loadImage('mask/4379902.png');
  maskImages[2] = loadImage('mask/mask1_red.png');
  maskImages[3] = loadImage('mask/mask2_blue.png');
  maskImages[4] = loadImage('mask/mask3_gold.png');
  maskImages[5] = loadImage('mask/mask4_white.png');
}

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480); // 設定固定擷取解析度以利辨識穩定
  capture.hide(); // 隱藏預設產生的 HTML5 video 元件

  // 開始偵測姿勢
  bodyPose.detectStart(capture, (results) => {
    poses = results;
  });

  // 開始偵測手勢
  handPose.detectStart(capture, (results) => {
    hands = results;
  });
}

function draw() {
  background('#f4f1de');

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;
  let x = (width - vWidth) / 2;
  let y = (height - vHeight) / 2;

  push();
  // 實作左右顛倒（鏡像）
  translate(x + vWidth, y);
  scale(-1, 1);
  image(capture, 0, 0, vWidth, vHeight);

  // 手勢辨識：偵測揮手切換臉譜
  if (hands.length > 0) {
    let hand = hands[0]; // 只追蹤第一隻手以保持穩定，避免多手干擾
    let currentWristX = hand.wrist.x;

    // 確保有上一次的座標才計算位移
    if (prevWristX !== 0) {
      let vx = currentWristX - prevWristX; // 計算前後幀位移量

      if (millis() - lastWaveTime > 500) { // 0.5 秒冷卻時間，避免連續觸發
        // 將門檻值從 40 調降至 20，讓揮手動作更容易被辨識
        if (vx < -20) {
          // 往右揮（相機座標 x 變小）：換下一張
          currentMaskIndex = (currentMaskIndex + 1) % maskImages.length;
          lastWaveTime = millis();
        } else if (vx > 20) {
          // 往左揮（相機座標 x 變大）：回上一張
          currentMaskIndex = (currentMaskIndex - 1 + maskImages.length) % maskImages.length;
          lastWaveTime = millis();
        }
      }
    }
    prevWristX = currentWristX;
  } else {
    prevWristX = 0; // 沒偵測到手時重置座標，避免下次手出現時產生大位移誤判
  }

  // 臉部辨識：繪製臉譜
  if (poses.length > 0) {
    let pose = poses[0];
    let nose = pose.nose;
    let leftEar = pose.left_ear;
    let rightEar = pose.right_ear;
 
    // 確保關鍵點的可信度足夠
    if (nose.confidence > 0.1 && leftEar.confidence > 0.1 && rightEar.confidence > 0.1) {
      let nx = map(nose.x, 0, capture.width, 0, vWidth);
      let ny = map(nose.y, 0, capture.height, 0, vHeight);
      let elx = map(leftEar.x, 0, capture.width, 0, vWidth);
      let ely = map(leftEar.y, 0, capture.height, 0, vHeight);
      let erx = map(rightEar.x, 0, capture.width, 0, vWidth);
      let ery = map(rightEar.y, 0, capture.height, 0, vHeight);

      // 計算臉部寬度（以兩耳距離為基準）
      let faceWidth = dist(elx, ely, erx, ery);
      let maskImg = maskImages[currentMaskIndex];
      
      // 調整臉譜大小：寬度設為耳距的 2.4 倍以完整覆蓋臉部
      let mw = faceWidth * 2.4;
      let mh = mw * (maskImg.height / maskImg.width);
 
      // 將臉譜中心對齊鼻頭位置，並稍微上移以符合五官分佈
      image(maskImg, nx - mw / 2, ny - mh * 0.6, mw, mh);
    }
  }
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
